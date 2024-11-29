const { Router } = require('express')
const {
  addNewCar,
  getDepartmentCars,
  removeCar
} = require('../controllers/car-controller')

const route = Router()

route.post('/:departmentId', addNewCar)
route.get('/:departmentId', getDepartmentCars)
route.delete('/:carId', removeCar)

module.exports = route
