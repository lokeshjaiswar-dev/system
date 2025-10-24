const express = require('express');
const Flat = require('../models/Flat');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all flats (with filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { wing } = req.query;
    const filter = wing ? { wing } : {};
    
    const flats = await Flat.find(filter)
      .populate('resident', 'name email phone')
      .sort({ wing: 1, flatNo: 1 });
    
    res.json(flats);
  } catch (error) {
    console.error('Error fetching flats:', error);
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
    
    console.log(`✅ Flat created: ${flat.wing}-${flat.flatNo}`);
    
    res.status(201).json(flat);
  } catch (error) {
    console.error('Error creating flat:', error);
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
    
    // If flat status is changed to vacant, remove resident association
    if (req.body.status === 'vacant') {
      await User.updateMany(
        { wing: flat.wing, flatNo: flat.flatNo },
        { 
          $unset: { flat: "" },
          $set: { wing: "", flatNo: "" }
        }
      );
      
      // Also update the flat document
      flat.residentName = undefined;
      flat.phone = undefined;
      flat.resident = undefined;
      await flat.save();
    }
    
    res.json(flat);
  } catch (error) {
    console.error('Error updating flat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete flat (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const flat = await Flat.findByIdAndDelete(req.params.id);
    
    if (!flat) {
      return res.status(404).json({ message: 'Flat not found' });
    }

    // Remove flat association from users
    await User.updateMany(
      { wing: flat.wing, flatNo: flat.flatNo },
      { 
        $unset: { flat: "" },
        $set: { wing: "", flatNo: "" }
      }
    );

    console.log(`🗑️ Flat deleted: ${flat.wing}-${flat.flatNo}`);
    
    res.json({ message: 'Flat deleted successfully' });
  } catch (error) {
    console.error('Error deleting flat:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get wings
router.get('/wings', auth, async (req, res) => {
  try {
    const wings = await Flat.distinct('wing');
    res.json(wings);
  } catch (error) {
    console.error('Error fetching wings:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;