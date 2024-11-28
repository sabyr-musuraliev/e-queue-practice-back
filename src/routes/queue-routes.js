const { Router } = require('express')
const { addNewQueue, callStudents } = require('../controllers/queue-controller')

const router = Router()

router.post('/', addNewQueue)
router.patch('/', callStudents)

module.exports = router
