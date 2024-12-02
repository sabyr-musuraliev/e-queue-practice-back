let ioInstance

const initSocketIO = (server) => {
  const { Server } = require('socket.io')
  const io = new Server(server)

  ioInstance = io

  io.on('connection', (socket) => {
    console.log(`Клиент подключен: ${socket.id}`)

    // socket.on('join-department', (departmentId) => {
    //   console.log(departmentId)
    //   socket.join(departmentId)
    //   console.log(`Клиент ${socket.id} подключился к комнате: ${departmentId}`)
    // })

    socket.on('disconnect', () => {
      console.log(`Клиент отключен: ${socket.id}`)
    })
  })

  return io
}

const getIO = () => {
  if (!ioInstance) {
    throw new Error(
      'Socket.IO не инициализирован. Сначала вызовите initSocketIO.'
    )
  }
  return ioInstance
}

module.exports = { initSocketIO, getIO }
