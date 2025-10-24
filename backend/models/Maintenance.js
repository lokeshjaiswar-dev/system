const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  flatNo: {
    type: String,
    required: true
  },
  wing: String,
  amount: {
    type: Number,
    required: true
  },
  month: {
    type: String,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  dueDate: Date,
  paidDate: Date,
  paymentMethod: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);