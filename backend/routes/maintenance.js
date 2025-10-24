const express = require('express');
const Maintenance = require('../models/Maintenance');
const auth = require('../middleware/auth');

const router = express.Router();

// Get maintenance bills
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'resident') {
      filter.flatNo = req.user.flatNo;
    }

    const bills = await Maintenance.find(filter).sort({ year: -1, month: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create maintenance bill (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bill = new Maintenance(req.body);
    await bill.save();
    res.status(201).json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Bulk create maintenance bills (admin only)
router.post('/bulk', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { bills } = req.body;
    const createdBills = await Maintenance.insertMany(bills);
    res.status(201).json(createdBills);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update payment status
router.put('/:id/pay', auth, async (req, res) => {
  try {
    const bill = await Maintenance.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }

    // Residents can only pay their own bills
    if (req.user.role === 'resident' && bill.flatNo !== req.user.flatNo) {
      return res.status(403).json({ message: 'Access denied' });
    }

    bill.status = 'paid';
    bill.paidDate = new Date();
    bill.paymentMethod = req.body.paymentMethod || 'online';
    
    await bill.save();
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;