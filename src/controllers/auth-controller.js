const User = require('../models/User')
const Department = require('../models/Department')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const createNewUser = async (req, res) => {
  try {
    const { username, password, role, departmentId, name } = req.body

    if (!username || !password || !role || !name) {
      return res.status(400).json({ message: 'Нужно заполнить все поля' })
    }

    const duplicate = await User.findOne({ username }).lean().exec()

    if (duplicate) {
      return res.status(409).json({ message: 'Такой пользователь уже есть' })
    }

    const hashedPwd = await bcrypt.hash(password, 10)

    const newUser = new User({
      username,
      password: hashedPwd,
      role,
      departmentId,
      name
    })

    const savedUser = await newUser.save()

    if (savedUser) {
      res.status(201).json({
        message: `New user ${username} created`,
        data: savedUser
      })
    } else {
      res.status(400).json({ message: 'Invalid user data received' })
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({
      message: 'Something went wrong on registration'
    })
  }
}

const login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'Заполните все поля' })
    }

    const foundUser = await User.findOne({ username }).exec()

    if (!foundUser) {
      return res.status(401).json({ message: 'Пользователь не найден' })
    }

    const match = await bcrypt.compare(password, foundUser.password)

    if (!match) {
      return res.status(401).json({ message: 'Неверный пароль' })
    }

    if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
      return res.status(500).json({
        message:
          'Не установлены переменные окружения ACCESS_TOKEN_SECRET и REFRESH_TOKEN_SECRET'
      })
    }

    const department = await Department.findById(foundUser.departmentId)

    const accessToken = jwt.sign(
      {
        user: foundUser._id,
        username: foundUser.username,
        role: foundUser.role,
        name: foundUser.name,
        departmentId: department._id,
        departmentName: department.name
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '2d' }
    )

    return res.json({ accessToken, path: foundUser.role })
  } catch (error) {
    console.error('Ошибка во время входа пользователя:', error)
    return res.status(500).json({
      message: 'Ошибка на сервере при входе в систему',
      error: error.message
    })
  }
}

module.exports = {
  createNewUser,
  login
}
