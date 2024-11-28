const {
  getCurrentDepartmentUsers,
  getCurrentUser,
  editUser,
  deleteUser,
  editUserPassword
} = require('../controllers/user-controller')
const { Router } = require('express')

const router = Router()

router.get('/:departmentId', getCurrentDepartmentUsers)
router.get('/:userId', getCurrentUser)
router.put('/:userId', editUser)
router.delete('/:userId', deleteUser)
router.put('/:userId/password', editUserPassword)

module.exports = router
