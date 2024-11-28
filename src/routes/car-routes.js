const { Router } = require('express')
const { addNewCar } = require('../controllers/car-controller')

const route = Router()

route.post('/:departmentId', addNewCar)

module.exports = route
