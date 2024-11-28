const Car = require('../models/Car')
const Department = require('../models/Department')
const mongoose = require('mongoose')

const addNewCar = async (req, res) => {
  try {
    const { carType, carNumber } = req.body
    const { departmentId } = req.params

    if (!carType || !carNumber) {
      return res.status(400).json({
        message: 'Отсутствуют обязательные данные: carType или carNumber'
      })
    }

    if (!mongoose.Types.ObjectId.isValid(departmentId)) {
      return res.status(400).json({ message: 'Некорректный departmentId' })
    }

    const department = await Department.findById(departmentId).lean()

    if (!department) {
      return res
        .status(404)
        .json({ message: `${departmentId} - указанное отделение не найдено` })
    }

    const existingCar = await Car.findOne({ carNumber, departmentId })
    if (existingCar) {
      return res.status(409).json({
        message: `Машина с номером ${carNumber} уже существует в этом отделении`
      })
    }

    const car = new Car({ carType, carNumber, departmentId })

    const newCar = await car.save()

    return res
      .status(201)
      .json({ newCar, message: 'Новый автомобиль успешно создан' })
  } catch (error) {
    console.error('Ошибка при добавлении машины:', error)

    return res.status(500).json({
      message: 'Ошибка при добавлении машины',
      errorMessage: error.message
    })
  }
}

const removeCar = async (req, res) => {
  try {
    const { carId } = req.params

    if (!carId) {
      return res.status(400).json({ message: 'Не указан carId' })
    }

    if (!mongoose.Types.ObjectId.isValid(carId)) {
      return res.status(400).json({ message: 'Некорректный carId' })
    }

    const deletedCar = await Car.findByIdAndDelete(carId)

    if (!deletedCar) {
      return res.status(404).json({ message: 'Машина не найдена' })
    }

    return res.status(200).json({ carId, message: 'Успешно удалено' })
  } catch (error) {
    console.log(error.message)
    res.status(500).json({
      message: 'Ошибка при удалении машины',
      errorMessage: error.message
    })
  }
}

module.exports = {
  addNewCar,
  removeCar
}
