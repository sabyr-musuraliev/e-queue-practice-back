const mongoose = require('mongoose')
const Department = require('../models/Department')
const Queue = require('../models/Queue')
const Car = require('../models/Car')

const addNewQueue = async (req, res) => {
  const session = await mongoose.startSession()
  try {
    const { queueType, departmentId } = req.params

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const department = await Department.findById(departmentId).session(session)
    if (!department) {
      await session.abortTransaction()
      return res.status(500).json({ message: 'Департамент не найден' })
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
    const ticketNumber = `${queueType}${String(department.ticketCounters[queueType])}`

    const newTicket = new Queue({
      type: queueType,
      ticketNumber,
      createdAt: Date.now(),
      departmentId: department._id,
      status: 'waiting'
    })

    const savedQueue = await newTicket.save({ session })
    await department.save({ session })

    res.status(201).json({
      queue: savedQueue,
      message: 'Новая очередь была зарегестрирована'
    })
  } catch (error) {
    await session.abortTransaction()
    console.error('Ошибка при добавлении тикета:', error.message)
    res.status(500).json({ message: 'Ошибка при регистрации новой очереди' })
  }
}

const callStudents = async (req, res) => {
  try {
    const { carId } = req.body

    const car = await Car.findById(carId)

    if (!car) {
      return res.status(400).json({ message: 'Не нашёл указанную машину' })
    }

    const nextQueues = await Queue.find({
      status: 'waiting',
      type: car.carType,
      departmentId: car.departmentId
    })
      .sort({ createdAt: 1 })
      .limit(4)

    if (!nextQueues) {
      return res.status(204).end()
    }

    car.status = 'calling'
    car.isAvailable = false
    const savedCar = await car.save()

    const updatedQueues = []

    for (const queue of nextQueues) {
      queue.currentCar = car._id
      queue.startCallingTime = new Date()
      queue.status = 'calling'
      const savedQueue = await queue.save()
      updatedQueues.push(savedQueue)
    }

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

    for (const queue of currentCarQueues) {
      queue.startServiceTime = new Date()
      queue.status = 'in-progress'

      const savedQueue = await queue.save()
      updatedQueues.push(savedQueue)
    }

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
    const { carId } = req.params

    const car = await Car.findById(carId)
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Ошибка при завершении практического экзамена',
      errorMessage: error.message
    })
  }
}

module.exports = {
  addNewQueue,
  callStudents,
  startPractice
}
