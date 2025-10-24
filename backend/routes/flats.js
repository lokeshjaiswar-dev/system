const express = require('express');
const Flat = require('../models/Flat');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all flats (with filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { wing } = req.query;
    const filter = wing ? { wing } : {};
    
    const flats = await Flat.find(filter).sort({ wing: 1, flatNo: 1 });
    res.json(flats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create flat (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const flat = new Flat(req.body);
    await flat.save();
    res.status(201).json(flat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update flat (admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const flat = await Flat.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(flat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get wings
router.get('/wings', auth, async (req, res) => {
  try {
    const wings = await Flat.distinct('wing');
    res.json(wings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;