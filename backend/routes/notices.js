const express = require('express');
const Notice = require('../models/Notice');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all notices
router.get('/', auth, async (req, res) => {
  try {
    const notices = await Notice.find({ isActive: true })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create notice (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const notice = new Notice({
      ...req.body,
      createdBy: req.user._id
    });
    await notice.save();
    
    await notice.populate('createdBy', 'name');
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update notice (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('createdBy', 'name');
    res.json(notice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete notice (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Notice.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;