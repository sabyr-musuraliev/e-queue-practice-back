const mongoose = require('mongoose')

const Queue = new mongoose.Schema({
  type: { type: String, enum: ['BA', 'BM', 'C', 'C1'], required: true },
  ticketNumber: { type: String, required: true },
  status: {
    type: String,
    enum: ['waiting', 'calling', 'in-progress', 'completed', 'skipped'],
    default: 'waiting'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  startCallingTime: {
    type: Date
  },
  startServiceTime: {
    type: Date
  },
  endServiceTime: {
    type: Date
  },
  skippedTime: {
    type: Date
  },
  callingTimes: {
    type: Number
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  currentCar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  },
  servicedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Car'
  }
})

module.exports = mongoose.model('Queue', Queue)
