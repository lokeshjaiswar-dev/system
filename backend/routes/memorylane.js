const express = require('express');
const MemoryLane = require('../models/MemoryLane');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all memories with date filter
router.get('/', auth, async (req, res) => {
  try {
    const { date } = req.query;
    let filter = {};
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      filter.date = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const memories = await MemoryLane.find(filter)
      .populate('createdBy', 'name')
      .populate('comments.user', 'name')
      .populate('likes', 'name')
      .sort({ date: -1, createdAt: -1 });
    
    res.json(memories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create memory
router.post('/', auth, async (req, res) => {
  try {
    const memory = new MemoryLane({
      ...req.body,
      createdBy: req.user._id
    });
    await memory.save();
    
    await memory.populate('createdBy', 'name');
    res.status(201).json(memory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const memory = await MemoryLane.findById(req.params.id);
    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    memory.comments.push({
      user: req.user._id,
      comment: req.body.comment
    });

    await memory.save();
    await memory.populate('comments.user', 'name');
    res.json(memory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Toggle like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const memory = await MemoryLane.findById(req.params.id);
    if (!memory) {
      return res.status(404).json({ message: 'Memory not found' });
    }

    const likeIndex = memory.likes.indexOf(req.user._id);
    if (likeIndex > -1) {
      memory.likes.splice(likeIndex, 1);
    } else {
      memory.likes.push(req.user._id);
    }

    await memory.save();
    await memory.populate('likes', 'name');
    res.json(memory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;