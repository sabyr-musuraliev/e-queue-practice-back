const mongoose = require('mongoose')

const Department = new mongoose.Schema({
  name: { type: String, required: true },
  ticketCounters: {
    BA: { type: Number, default: 0 },
    BM: { type: Number, default: 0 },
    C: { type: Number, default: 0 },
    C1: { type: Number, default: 0 },
    lastResetDate: { type: Date, default: Date.now }
  }
})

module.exports = mongoose.model('Department', Department)
