const { createNewUser, login } = require('../controllers/auth-controller')
const { Router } = require('express')

const router = Router()

router.post('/login', login)

router.post('/register', createNewUser)

module.exports = router
