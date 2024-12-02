const { Router } = require('express')
const {
  addNewQueue,
  callStudents,
  getCarsQueues,
  startPractice,
  endPractice,
  getDepartmentsQueues
} = require('../controllers/queue-controller')

const router = Router()

router.post('/', addNewQueue)
router.patch('/call', callStudents)
router.patch('/start', startPractice)
router.patch('/end', endPractice)
router.patch('/skip', endPractice)
router.get('/:carId', getCarsQueues)
router.get('/:departmentId/spec', getDepartmentsQueues)

module.exports = router
