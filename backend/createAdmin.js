const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/society-management');
    
    const adminExists = await User.findOne({ role: 'admin' });
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const admin = new User({
      name: 'Society Admin',
      email: 'admin@society.com',
      password: 'admin123',
      phone: '9876543210',
      role: 'admin',
      isVerified: true
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@society.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdmin();