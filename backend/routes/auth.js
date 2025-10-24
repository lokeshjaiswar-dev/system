const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Flat = require('../models/Flat');
const auth = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/emailService');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, wing, flatNo, role } = req.body;

    console.log('📝 Registration attempt:', { name, email, role, wing, flatNo });

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if trying to register as admin
    if (role === 'admin') {
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin user already exists. Only one admin is allowed.' });
      }
    }

    // For residents, validate and find the flat
    let flat = null;
    if (role === 'resident') {
      if (!wing || !flatNo) {
        return res.status(400).json({ message: 'Wing and Flat No are required for residents' });
      }

      // Find the flat
      flat = await Flat.findOne({ wing: wing.toUpperCase(), flatNo });
      
      if (!flat) {
        return res.status(400).json({ 
          message: `Flat ${wing}-${flatNo} not found. Please contact admin to add this flat first.` 
        });
      }

      // Check if flat is already occupied by another user
      if (flat.status === 'permanent' || flat.status === 'rented') {
        const existingUser = await User.findOne({ wing, flatNo, role: 'resident' });
        if (existingUser) {
          return res.status(400).json({ 
            message: `Flat ${wing}-${flatNo} is already occupied by another resident.` 
          });
        }
      }

      // Update flat status and resident info
      flat.status = 'permanent';
      flat.residentName = name;
      flat.phone = phone;
      await flat.save();
      
      console.log(`✅ Flat ${wing}-${flatNo} updated with resident info`);
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    user = new User({
      name,
      email,
      password,
      phone,
      role: role || 'resident',
      wing: role === 'resident' ? wing.toUpperCase() : undefined,
      flatNo: role === 'resident' ? flatNo : undefined,
      flat: role === 'resident' ? flat?._id : undefined,
      verificationCode
    });

    await user.save();

    // If resident, update flat with user reference
    if (role === 'resident' && flat) {
      flat.resident = user._id;
      await flat.save();
    }

    // Send verification email
    sendVerificationEmail(email, verificationCode).catch(error => {
      console.error('Failed to send verification email:', error);
    });

    console.log(`✅ User registered successfully: ${email}`);
    
    res.status(201).json({ 
      message: 'Registration successful. Please check your email for verification code.',
      email: email
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Verify Email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('flat');
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    if (!user.isActive) {
      return res.status(400).json({ message: 'Your account has been deactivated. Please contact admin.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log(`✅ User logged in: ${user.email} (${user.role})`);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wing: user.wing,
        flatNo: user.flatNo,
        flat: user.flat,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('flat');
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;