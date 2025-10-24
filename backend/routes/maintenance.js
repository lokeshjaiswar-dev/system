const express = require('express');
const Maintenance = require('../models/Maintenance');
const User = require('../models/User');
const Flat = require('../models/Flat');
const auth = require('../middleware/auth');
const { sendPaymentConfirmation } = require('../utils/emailService');

const router = express.Router();

// Get maintenance bills
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    
    if (req.user.role === 'resident') {
      // Residents can only see bills for their flat
      if (!req.user.flatNo || !req.user.wing) {
        return res.status(400).json({ 
          message: 'Flat information not found. Please contact admin to update your flat details.' 
        });
      }
      
      filter.flatNo = req.user.flatNo;
      filter.wing = req.user.wing;
      
      console.log(`🔍 Fetching bills for resident: ${req.user.wing}-${req.user.flatNo}`);
    }

    const bills = await Maintenance.find(filter)
      .sort({ year: -1, month: -1, createdAt: -1 });
    
    console.log(`📊 Found ${bills.length} maintenance bills for user ${req.user._id}`);
    
    res.json(bills);
  } catch (error) {
    console.error('❌ Error fetching maintenance bills:', error);
    res.status(500).json({ 
      message: 'Failed to fetch maintenance bills',
      error: error.message 
    });
  }
});

// Create single maintenance bill (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { wing, flatNo, amount, month, year, dueDate, description } = req.body;

    // Verify the flat exists
    const flat = await Flat.findOne({ wing, flatNo });
    if (!flat) {
      return res.status(404).json({ 
        message: `Flat ${wing}-${flatNo} not found. Please add the flat first.` 
      });
    }

    // Find resident for this flat
    const resident = await User.findOne({ wing, flatNo, role: 'resident' });

    const billData = {
      wing,
      flatNo,
      amount: parseFloat(amount),
      month: month.toLowerCase(),
      year: parseInt(year),
      dueDate: new Date(dueDate),
      description: description || `Maintenance for ${month} ${year}`,
      status: 'pending',
      resident: resident?._id
    };

    const bill = new Maintenance(billData);
    await bill.save();
    
    console.log(`✅ Created maintenance bill for ${wing}-${flatNo}`);
    
    res.status(201).json(bill);
  } catch (error) {
    console.error('❌ Error creating maintenance bill:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Maintenance bill already exists for this flat and period' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create maintenance bill',
      error: error.message 
    });
  }
});

// Bulk create maintenance bills (admin only)
router.post('/bulk', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { bills } = req.body;
    
    if (!bills || !Array.isArray(bills) || bills.length === 0) {
      return res.status(400).json({ message: 'Bills array is required' });
    }

    // Get all residents for efficient lookup
    const residents = await User.find({ role: 'resident' });
    const residentMap = new Map();
    residents.forEach(resident => {
      residentMap.set(`${resident.wing}-${resident.flatNo}`, resident._id);
    });

    const formattedBills = bills.map(bill => ({
      ...bill,
      amount: parseFloat(bill.amount),
      year: parseInt(bill.year),
      status: 'pending',
      resident: residentMap.get(`${bill.wing}-${bill.flatNo}`) || null
    }));

    const createdBills = await Maintenance.insertMany(formattedBills, { ordered: false });
    
    console.log(`✅ Created ${createdBills.length} maintenance bills in bulk`);
    
    res.status(201).json(createdBills);
  } catch (error) {
    console.error('❌ Error creating bulk maintenance bills:', error);
    res.status(500).json({ 
      message: 'Failed to create maintenance bills',
      error: error.message 
    });
  }
});

// Update payment status
router.put('/:id/pay', auth, async (req, res) => {
  try {
    const bill = await Maintenance.findById(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Maintenance bill not found' });
    }

    // Residents can only pay their own bills
    if (req.user.role === 'resident') {
      if (!req.user.flatNo || !req.user.wing) {
        return res.status(400).json({ 
          message: 'Flat information not found. Please contact admin.' 
        });
      }
      
      if (bill.flatNo !== req.user.flatNo || bill.wing !== req.user.wing) {
        return res.status(403).json({ 
          message: 'Access denied - you can only pay bills for your flat' 
        });
      }
    }

    // Update bill status
    bill.status = 'paid';
    bill.paidDate = new Date();
    bill.paymentMethod = req.body.paymentMethod || 'online';
    
    await bill.save();

    console.log(`✅ Payment recorded for bill ${bill._id} by user ${req.user._id}`);

    // Send payment confirmation email
    try {
      const user = await User.findOne({ 
        wing: bill.wing, 
        flatNo: bill.flatNo,
        role: 'resident'
      });
      
      if (user && user.email) {
        await sendPaymentConfirmation(user.email, bill.amount, bill.month, bill.year);
        console.log(`📧 Payment confirmation email sent to ${user.email}`);
      }
    } catch (emailError) {
      console.error('❌ Failed to send payment email:', emailError);
    }

    res.json(bill);
  } catch (error) {
    console.error('❌ Error updating payment status:', error);
    res.status(500).json({ 
      message: 'Payment failed',
      error: error.message 
    });
  }
});

// Delete maintenance bill (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const bill = await Maintenance.findByIdAndDelete(req.params.id);
    
    if (!bill) {
      return res.status(404).json({ message: 'Maintenance bill not found' });
    }

    console.log(`🗑️ Deleted maintenance bill ${req.params.id}`);
    
    res.json({ message: 'Maintenance bill deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting maintenance bill:', error);
    res.status(500).json({ 
      message: 'Failed to delete maintenance bill',
      error: error.message 
    });
  }
});

// Get maintenance statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const totalBills = await Maintenance.countDocuments();
    const paidBills = await Maintenance.countDocuments({ status: 'paid' });
    const pendingBills = await Maintenance.countDocuments({ status: 'pending' });
    const overdueBills = await Maintenance.countDocuments({ status: 'overdue' });

    const totalAmount = await Maintenance.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const paidAmount = await Maintenance.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalBills,
      paidBills,
      pendingBills,
      overdueBills,
      totalAmount: totalAmount[0]?.total || 0,
      paidAmount: paidAmount[0]?.total || 0,
      pendingAmount: (totalAmount[0]?.total || 0) - (paidAmount[0]?.total || 0),
      collectionRate: totalAmount[0]?.total ? 
        ((paidAmount[0]?.total || 0) / totalAmount[0]?.total * 100).toFixed(2) : 0
    });
  } catch (error) {
    console.error('❌ Error fetching maintenance stats:', error);
    res.status(500).json({ 
      message: 'Failed to fetch maintenance statistics',
      error: error.message 
    });
  }
});

module.exports = router;