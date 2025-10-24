const express = require('express');
const Complaint = require('../models/Complaint');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all complaints (admin sees all, residents see only theirs)
router.get('/', auth, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'resident') {
      filter.raisedBy = req.user._id;
    }

    const complaints = await Complaint.find(filter)
      .populate('raisedBy', 'name wing flatNo')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create complaint
router.post('/', auth, async (req, res) => {
  try {
    const complaint = new Complaint({
      ...req.body,
      raisedBy: req.user._id
    });
    await complaint.save();
    
    await complaint.populate('raisedBy', 'name wing flatNo');
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update complaint status (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    // Residents can only update their own complaints if pending
    if (req.user.role === 'resident' && complaint.raisedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('raisedBy', 'name wing flatNo').populate('assignedTo', 'name');

    res.json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;