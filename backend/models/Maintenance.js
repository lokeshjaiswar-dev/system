const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
  flatNo: {
    type: String,
    required: true
  },
  wing: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  month: {
    type: String,
    required: true,
    enum: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
  },
  year: {
    type: Number,
    required: true,
    min: 2020,
    max: 2030
  },
  description: {
    type: String,
    default: 'Monthly Maintenance'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidDate: Date,
  paymentMethod: String,
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate bills for same flat, month, year
maintenanceSchema.index({ flatNo: 1, month: 1, year: 1 }, { unique: true });

// Virtual for formatted period
maintenanceSchema.virtual('period').get(function() {
  return `${this.month.charAt(0).toUpperCase() + this.month.slice(1)} ${this.year}`;
});

module.exports = mongoose.model('Maintenance', maintenanceSchema);