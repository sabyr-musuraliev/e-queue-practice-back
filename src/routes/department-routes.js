const {
  getAllDepartments,
  addNewDepartment,
  deleteDepartment,
  editDepartment,
  getCurrentDepartment
} = require('../controllers/department-controller')
const { Router } = require('express')

const router = Router()

router.get('/', getAllDepartments)
router.post('/', addNewDepartment)
router.delete('/:departmentId', deleteDepartment)
router.put('/:departmentId', editDepartment)
router.get('/:departmentId', getCurrentDepartment)

module.exports = router
