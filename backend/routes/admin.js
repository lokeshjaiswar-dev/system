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
    console.log('📊 Fetching dashboard stats for admin:', req.user._id);
    
    const [
      totalResidents,
      totalFlats,
      vacantFlats,
      pendingComplaints,
      pendingPayments,
      totalNotices
    ] = await Promise.all([
      User.countDocuments({ role: 'resident', isVerified: true }),
      Flat.countDocuments(),
      Flat.countDocuments({ status: 'vacant' }),
      Complaint.countDocuments({ status: 'pending' }),
      Maintenance.countDocuments({ status: 'pending' }),
      Notice.countDocuments({ isActive: true })
    ]);

    const stats = {
      totalResidents,
      totalFlats,
      vacantFlats,
      pendingComplaints,
      pendingPayments,
      totalNotices
    };

    console.log('✅ Dashboard stats:', stats);
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching dashboard stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dashboard statistics',
      error: error.message 
    });
  }
});

// Get all users (for admin)
router.get('/users', auth, requireAdmin, async (req, res) => {
  try {
    console.log('👥 Fetching users list for admin');
    
    const users = await User.find()
      .select('-password -verificationCode')
      .populate('flat')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({ 
      message: 'Failed to fetch users',
      error: error.message 
    });
  }
});

// Update user status
router.put('/users/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;
    const userId = req.params.id;

    console.log(`🔄 Updating user status for ${userId} to:`, isActive);

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`✅ User status updated: ${user.name} is now ${user.isActive ? 'active' : 'inactive'}`);
    res.json(user);
  } catch (error) {
    console.error('❌ Error updating user status:', error);
    res.status(500).json({ 
      message: 'Failed to update user status',
      error: error.message 
    });
  }
});

// Bulk maintenance bill generation
router.post('/maintenance/bulk-generate', auth, requireAdmin, async (req, res) => {
  try {
    const { month, year, amount, dueDate, description } = req.body;
    
    console.log('🔧 Bulk generation request:', { 
      month, 
      year, 
      amount, 
      dueDate, 
      description 
    });

    // Validate required fields
    if (!month || !year || !amount || !dueDate) {
      return res.status(400).json({ 
        message: 'Month, year, amount, and due date are required' 
      });
    }

    // Get all occupied flats (with residents)
    const flats = await Flat.find({ 
      status: { $in: ['permanent', 'rented'] } 
    }).populate('resident');
    
    console.log(`🏠 Found ${flats.length} occupied flats`);

    if (flats.length === 0) {
      return res.status(400).json({ 
        message: 'No occupied flats found. Please add flats and assign residents first.' 
      });
    }

    // Delete existing bills for the same period
    const deleteResult = await Maintenance.deleteMany({ 
      month: month.toLowerCase(), 
      year: parseInt(year) 
    });
    
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing bills`);

    // Prepare bills for occupied flats
    const bills = flats.map(flat => ({
      flatNo: flat.flatNo,
      wing: flat.wing,
      amount: parseFloat(amount),
      month: month.toLowerCase(),
      year: parseInt(year),
      description: description || `Maintenance for ${month} ${year}`,
      dueDate: new Date(dueDate),
      status: 'pending',
      resident: flat.resident?._id || null
    }));

    console.log(`📄 Creating ${bills.length} maintenance bills...`);

    // Insert bills
    const createdBills = await Maintenance.insertMany(bills, { ordered: false });
    
    console.log(`✅ SUCCESS: Created ${createdBills.length} maintenance bills`);

    res.status(201).json({ 
      success: true,
      message: `${createdBills.length} maintenance bills generated successfully for ${month} ${year}`,
      billsCount: createdBills.length
    });

  } catch (error) {
    console.error('❌ ERROR in bulk generation:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate bills detected. Please try again with a different period.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to generate maintenance bills: ' + error.message,
      error: error.message 
    });
  }
});

// Get financial summary
router.get('/financial-summary', auth, requireAdmin, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    let filter = {};
    if (month && year) {
      filter.month = month.toLowerCase();
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

    const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;

    res.json({
      totalAmount,
      paidAmount,
      pendingAmount,
      collectionRate: Math.round(collectionRate * 100) / 100,
      totalBills: bills.length,
      paidBills: bills.filter(bill => bill.status === 'paid').length,
      pendingBills: bills.filter(bill => bill.status === 'pending').length,
      overdueBills: bills.filter(bill => bill.status === 'overdue').length
    });
  } catch (error) {
    console.error('❌ Error fetching financial summary:', error);
    res.status(500).json({ 
      message: 'Failed to fetch financial summary',
      error: error.message 
    });
  }
});

// Assign resident to flat
router.post('/assign-resident', auth, requireAdmin, async (req, res) => {
  try {
    const { userId, flatId } = req.body;

    const user = await User.findById(userId);
    const flat = await Flat.findById(flatId);

    if (!user || !flat) {
      return res.status(404).json({ message: 'User or flat not found' });
    }

    if (user.role !== 'resident') {
      return res.status(400).json({ message: 'Can only assign residents to flats' });
    }

    // Update user with flat information
    user.wing = flat.wing;
    user.flatNo = flat.flatNo;
    user.flat = flat._id;
    await user.save();

    // Update flat with resident information
    flat.status = 'permanent';
    flat.residentName = user.name;
    flat.phone = user.phone;
    flat.resident = user._id;
    await flat.save();

    console.log(`✅ Assigned resident ${user.name} to flat ${flat.wing}-${flat.flatNo}`);

    res.json({ 
      message: 'Resident assigned to flat successfully', 
      user: { name: user.name, email: user.email },
      flat: { wing: flat.wing, flatNo: flat.flatNo }
    });
  } catch (error) {
    console.error('❌ Error assigning resident:', error);
    res.status(500).json({ 
      message: 'Failed to assign resident to flat',
      error: error.message 
    });
  }
});

// Get available residents (without flats)
router.get('/available-residents', auth, requireAdmin, async (req, res) => {
  try {
    const residents = await User.find({ 
      role: 'resident',
      $or: [
        { wing: { $exists: false } },
        { wing: null },
        { wing: '' },
        { flatNo: { $exists: false } },
        { flatNo: null },
        { flatNo: '' }
      ]
    }).select('name email phone createdAt');

    console.log(`👥 Found ${residents.length} available residents`);
    res.json(residents);
  } catch (error) {
    console.error('❌ Error fetching available residents:', error);
    res.status(500).json({ 
      message: 'Failed to fetch available residents',
      error: error.message 
    });
  }
});

// Debug endpoint
router.get('/debug/data', auth, requireAdmin, async (req, res) => {
  try {
    const [users, flats, complaints, maintenance, notices] = await Promise.all([
      User.find().select('name email role wing flatNo').limit(5),
      Flat.find().select('wing flatNo status residentName').limit(5),
      Complaint.find().populate('raisedBy', 'name').limit(5),
      Maintenance.find().limit(5),
      Notice.find().populate('createdBy', 'name').limit(5)
    ]);

    res.json({
      users: {
        count: await User.countDocuments(),
        sample: users
      },
      flats: {
        count: await Flat.countDocuments(),
        occupied: await Flat.countDocuments({ status: { $in: ['permanent', 'rented'] } }),
        sample: flats
      },
      complaints: {
        count: await Complaint.countDocuments(),
        sample: complaints
      },
      maintenance: {
        count: await Maintenance.countDocuments(),
        sample: maintenance
      },
      notices: {
        count: await Notice.countDocuments(),
        sample: notices
      }
    });
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    res.status(500).json({ 
      message: 'Debug failed',
      error: error.message 
    });
  }
});

module.exports = router;