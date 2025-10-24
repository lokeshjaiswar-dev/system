const express = require('express');
const User = require('../models/User');
const Flat = require('../models/Flat');
const Notice = require('../models/Notice');
const Complaint = require('../models/Complaint');
const Maintenance = require('../models/Maintenance');
const auth = require('../middleware/auth');

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Admin dashboard stats
router.get('/dashboard-stats', auth, requireAdmin, async (req, res) => {
  try {
    const totalResidents = await User.countDocuments({ role: 'resident', isVerified: true });
    const totalFlats = await Flat.countDocuments();
    const vacantFlats = await Flat.countDocuments({ status: 'vacant' });
    const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
    const pendingPayments = await Maintenance.countDocuments({ status: 'pending' });
    const totalNotices = await Notice.countDocuments({ isActive: true });

    res.json({
      totalResidents,
      totalFlats,
      vacantFlats,
      pendingComplaints,
      pendingPayments,
      totalNotices
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users (for admin)
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create admin user (special endpoint)
router.post('/create-admin', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }

    const admin = new User({
      name,
      email,
      password,
      phone,
      role: 'admin',
      isVerified: true
    });

    await admin.save();
    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user status
router.put('/users/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk maintenance bill generation
router.post('/maintenance/bulk-generate', auth, requireAdmin, async (req, res) => {
  try {
    const { month, year, amount, dueDate, description } = req.body;
    
    // Get all occupied flats
    const flats = await Flat.find({ status: { $in: ['permanent', 'rented'] } });
    
    const bills = flats.map(flat => ({
      flatNo: flat.flatNo,
      wing: flat.wing,
      amount,
      month,
      year,
      description: description || `Maintenance for ${month} ${year}`,
      dueDate: new Date(dueDate)
    }));

    const createdBills = await Maintenance.insertMany(bills);
    res.status(201).json({ message: `${createdBills.length} bills generated`, bills: createdBills });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get financial summary
router.get('/financial-summary', auth, requireAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let filter = {};
    if (month && year) {
      filter.month = month;
      filter.year = parseInt(year);
    }

    const bills = await Maintenance.find(filter);
    
    const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const paidAmount = bills
      .filter(bill => bill.status === 'paid')
      .reduce((sum, bill) => sum + bill.amount, 0);
    const pendingAmount = bills
      .filter(bill => bill.status === 'pending')
      .reduce((sum, bill) => sum + bill.amount, 0);

    res.json({
      totalAmount,
      paidAmount,
      pendingAmount,
      collectionRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
      totalBills: bills.length,
      paidBills: bills.filter(bill => bill.status === 'paid').length,
      pendingBills: bills.filter(bill => bill.status === 'pending').length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;