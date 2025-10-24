const mongoose = require('mongoose');

const flatSchema = new mongoose.Schema({
  wing: {
    type: String,
    required: true
  },
  flatNo: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['permanent', 'rented', 'vacant'],
    default: 'vacant'
  },
  ownerName: String,
  residentName: String,
  phone: String,
  email: String,
  area: Number,
  parkingSlots: Number,
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Flat', flatSchema);