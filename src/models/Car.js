const mongoose = require('mongoose')

const Car = new mongoose.Schema({
  carNumber: { type: Number, required: true },
  carType: { type: String, enum: ['BA', 'BM', 'C', 'C1'] },
  isAvailable: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['available', 'calling', 'in-progress'],
    default: 'available'
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  currentQueue: { type: mongoose.Schema.Types.ObjectId, ref: 'Queue' },
  availableSince: { type: Date }
})

module.exports = mongoose.model('Car', Car)
