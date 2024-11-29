const express = require('express')
const { createServer } = require('node:http')
const path = require('path')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const dotenv = require('dotenv')
const { initSocketIO } = require('./sockets/root')

const authRoutes = require('./routes/auth-routes')
const departmentRoutes = require('./routes/department-routes')
const userRoutes = require('./routes/user-routes')
const queueRoutes = require('./routes/queue-routes')
const carRoutes = require('./routes/car-routes')

dotenv.config()

const app = express()
const server = createServer(app)
const port = process.env.PORT || 8000

app.use(
  cors({
    origin: 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true
  })
)
app.use(express.json())
app.use(cookieParser())
app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/api/auth', authRoutes)
app.use('/api/departments', departmentRoutes)
app.use('/api/users', userRoutes)
app.use('/api/queues', queueRoutes)
app.use('/api/car', carRoutes)

initSocketIO(server)

mongoose.connect(process.env.DB_URI)

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err)
})

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB')
  server.listen(port, () =>
    console.log(`[server]: Server is running at http://localhost:${port}`)
  )
})
