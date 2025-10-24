const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'resident'],
    default: 'resident'
  },
  wing: {
    type: String,
    required: function() { return this.role === 'resident'; }
  },
  flatNo: {
    type: String,
    required: function() { return this.role === 'resident'; }
  },
  flat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Flat'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: String,
  phone: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);