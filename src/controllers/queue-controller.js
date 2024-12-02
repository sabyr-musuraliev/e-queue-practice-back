const Department = require('../models/Department')
const Queue = require('../models/Queue')
const Car = require('../models/Car')
const mongoose = require('mongoose')
const { getIO } = require('../sockets/root')

const addNewQueue = async (req, res) => {
  try {
    const { queueType, departmentId } = req.body

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const department = await Department.findById(departmentId)
    if (!department) {
      return res.status(500).json({ message: 'Department not found' })
    }

    if (
      new Date(department.ticketCounters.lastResetDate).setHours(0, 0, 0, 0) <
      today.getTime()
    ) {
      department.ticketCounters = {
        BA: 0,
        BM: 0,
        C: 0,
        C1: 0,
        lastResetDate: today
      }
    }

    department.ticketCounters[queueType] += 1
    const ticketNumber = `${queueType}-${String(department.ticketCounters[queueType])}`

    const newTicket = new Queue({
      type: queueType,
      ticketNumber,
      createdAt: Date.now(),
      departmentId: department._id,
      status: 'waiting'
    })

    const savedQueue = await newTicket.save()
    await department.save()

    console.log(savedQueue)
    res.status(201).json({
      queue: savedQueue,
      message: 'Новая очередь была зарегестрирована'
    })
  } catch (error) {
    console.error('Ошибка при добавлении тикета:', error.message)
    res.status(500).json({ message: error.message })
  }
}

const getCarsQueues = async (req, res) => {
  try {
    const { carId } = req.params

    const car = await Car.findById(carId).lean()

    if (!car) {
      return res.status(400).json({ message: 'Не нашёл указанную машину' })
    }

    const carQueues = await Queue.find({
      currentCar: car._id,
      departmentId: car.departmentId
    })

    res.status(200).json({ carQueues, car })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      message: 'Ошибка при получении талонов машины',
      errorMessage: error.message
    })
  }
}

const callStudents = async (req, res) => {
  try {
    const { carId } = req.body

    const car = await Car.findById(carId)

    if (!car) {
      return res.status(400).json({ message: 'Не нашёл указанную машину' })
    }

    const limit = ['BA', 'BM'].includes(car.carType) ? 4 : 1

    const nextQueues = await Queue.find({
      status: 'waiting',
      type: car.carType,
      departmentId: car.departmentId
    })
      .sort({ createdAt: 1 })
      .limit(limit)

    if (nextQueues.length === 0) {
      return res.status(204).end()
    }

    car.status = 'calling'
    car.isAvailable = false
    const savedCar = await car.save()

    const updatedQueues = []

    const queuesNumbers = []

    for (const queue of nextQueues) {
      queue.currentCar = car._id
      queue.startCallingTime = new Date()
      queue.status = 'calling'
      queuesNumbers.push(queue.ticketNumber)
      const savedQueue = await queue.save()
      updatedQueues.push(savedQueue)
    }

    const socketData = {
      number: savedCar.carNumber,
      status: savedCar.status,
      tickets: queuesNumbers
    }

    const io = getIO()
    io.to(String(car.departmentId)).emit('call-students', socketData)

    return res
      .status(200)
      .json({ updatedQueues, message: 'Новые студенты вызваны', car: savedCar })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Ошибка при начале практики',
      errorMessage: error.message
    })
  }
}

const startPractice = async (req, res) => {
  try {
    const { carId } = req.body

    const car = await Car.findById(carId)

    if (!car) {
      return res.status(400).json({ message: 'Нет такой машины' })
    }

    const currentCarQueues = await Queue.find({
      currentCar: car._id,
      status: 'calling',
      departmentId: car.departmentId
    })

    if (!currentCarQueues) {
      return res.status(400).json({ message: 'Нет очереди' })
    }

    car.status = 'in-progress'
    const savedCar = await car.save()

    const updatedQueues = []

    const queuesNumbers = []

    for (const queue of currentCarQueues) {
      queue.startServiceTime = new Date()
      queue.status = 'in-progress'
      queuesNumbers.push(queue.ticketNumber)
      const savedQueue = await queue.save()
      updatedQueues.push(savedQueue)
    }

    const socketData = {
      number: savedCar.carNumber,
      status: savedCar.status,
      tickets: queuesNumbers
    }

    const io = getIO()
    io.to(String(car.departmentId)).emit('start-practice', socketData)

    res.status(200).json({
      message: 'Практический экзамен начался',
      updatedQueues,
      car: savedCar
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      message: 'Ошибка при начинании практики',
      errorMessage: error.message
    })
  }
}

const endPractice = async (req, res) => {
  try {
    const { carId } = req.body

    const car = await Car.findById(carId)

    if (!car) {
      return res.status(404).json({ message: 'Такой машины нет в БД' })
    }

    car.status = 'available'
    car.isAvailable = true
    const savedCar = await car.save()

    const currentCarQueues = await Queue.find({
      currentCar: car._id,
      status: 'in-progress',
      departmentId: car.departmentId
    })

    if (!currentCarQueues) {
      return res.status(400).json({ message: 'Нет очереди' })
    }

    for (const queue of currentCarQueues) {
      queue.endServiceTime = new Date()
      queue.status = 'completed'
      queue.currentCar = null
      queue.servicedBy = car._id

      await queue.save()
    }

    const io = getIO()
    io.to(String(car.departmentId)).emit('end-practice', car.carNumber)

    res.status(200).json({ message: 'Практика закончена', car: savedCar })
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Ошибка при завершении практического экзамена',
      errorMessage: error.message
    })
  }
}

const skipQueue = async (req, res) => {
  try {
    const { queueId, carId } = req.body

    const queue = await Queue.findById(queueId)

    if (!queue) {
      return res.status(404).json({ message: 'Такой очереди нет' })
    }

    const car = await Car.findById(carId).lean()

    if (!car) {
      return res.status(404).json({ message: 'Такой машины нет' })
    }

    queue.currentCar = null
    queue.skippedTime = new Date()
    queue.servicedBy = car._id

    const skippedQueue = await queue.save()

    const nextQueue = await Queue.findOne({
      status: 'waiting',
      type: car.carType,
      departmentId: car.departmentId
    }).sort({ createdAt: 1 })

    if (!nextQueue) {
      return res.status(204).end()
    }

    nextQueue.currentCar = car._id
    nextQueue.startCallingTime = new Date()
    nextQueue.status = 'calling'

    const updatedNextQueue = await nextQueue.save()

    return res.status(200).json({
      message: 'Следуйщий клиент получен',
      nextQueue: updatedNextQueue,
      skippedQueue
    })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      message: 'Ошибка при пропуске очереди',
      errorMessage: error.message
    })
  }
}

const getDepartmentsQueues = async (req, res) => {
  try {
    const { departmentId } = req.params

    const cars = await Car.find({
      departmentId: new mongoose.Types.ObjectId(departmentId),
      status: { $in: ['calling', 'in-progress'] }
    }).lean()

    const result = await Promise.all(
      cars.map(async (car) => {
        const queues = await Queue.find({
          currentCar: car._id,
          status: { $in: ['calling', 'in-progress'] }
        }).lean()

        return {
          number: car.carNumber,
          status: car.status,
          tickets: queues.map((queue) => queue.ticketNumber)
        }
      })
    )

    res.status(200).json(result)
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      message: 'Что-то пошло не так при получении списка всех сдающих',
      errorMessage: error.message
    })
  }
}

module.exports = {
  addNewQueue,
  callStudents,
  startPractice,
  endPractice,
  skipQueue,
  getCarsQueues,
  getDepartmentsQueues
}
