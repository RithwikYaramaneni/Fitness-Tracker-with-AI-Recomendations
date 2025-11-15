const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Progress = require('../models/Progress');
const User = require('../models/User');
const PR = require('../models/PR');

// @route   GET /api/progress
// @desc    Get user's progress entries
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    const query = { userId: req.userId };
    
    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    let progressQuery = Progress.find(query).sort({ date: -1 });
    
    if (limit) {
      progressQuery = progressQuery.limit(parseInt(limit));
    }
    
    const progress = await progressQuery;
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/progress
// @desc    Log progress entry
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { weight, bodyFat, measurements, notes, mood, energyLevel } = req.body;
    
    if (!weight) {
      return res.status(400).json({
        success: false,
        message: 'Weight is required'
      });
    }
    
    const progress = new Progress({
      userId: req.userId,
      weight,
      bodyFat,
      measurements,
      notes,
      mood,
      energyLevel
    });
    
    await progress.save();
    
    // Update user's current weight
    await User.findByIdAndUpdate(req.userId, {
      'profile.weight': weight
    });
    
    res.status(201).json({
      success: true,
      message: 'Progress logged successfully',
      data: progress
    });
  } catch (error) {
    console.error('Create progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/progress/:id
// @desc    Update progress entry
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const progress = await Progress.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress entry not found'
      });
    }
    
    // Update fields
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      if (key === 'measurements' && typeof updates[key] === 'object') {
        progress.measurements = { ...progress.measurements, ...updates[key] };
      } else {
        progress[key] = updates[key];
      }
    });
    
    await progress.save();
    
    res.json({
      success: true,
      message: 'Progress updated successfully',
      data: progress
    });
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/progress/:id
// @desc    Delete progress entry
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const progress = await Progress.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Progress entry not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Progress entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete progress error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/progress/stats
// @desc    Get progress statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = '90' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const progressEntries = await Progress.find({
      userId: req.userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });
    
    if (progressEntries.length === 0) {
      return res.json({
        success: true,
        data: {
          totalEntries: 0,
          weightChange: 0,
          averageWeight: 0
        }
      });
    }
    
    const firstEntry = progressEntries[0];
    const lastEntry = progressEntries[progressEntries.length - 1];
    
    const stats = {
      totalEntries: progressEntries.length,
      startWeight: firstEntry.weight,
      currentWeight: lastEntry.weight,
      weightChange: (lastEntry.weight - firstEntry.weight).toFixed(1),
      averageWeight: (progressEntries.reduce((sum, p) => sum + p.weight, 0) / progressEntries.length).toFixed(1),
      startDate: firstEntry.date,
      lastUpdate: lastEntry.date
    };
    
    // Calculate body fat change if available
    const entriesWithBodyFat = progressEntries.filter(p => p.bodyFat);
    if (entriesWithBodyFat.length > 0) {
      stats.startBodyFat = entriesWithBodyFat[0].bodyFat;
      stats.currentBodyFat = entriesWithBodyFat[entriesWithBodyFat.length - 1].bodyFat;
      stats.bodyFatChange = (stats.currentBodyFat - stats.startBodyFat).toFixed(1);
    }
    
    // Calculate average mood and energy
    const entriesWithMood = progressEntries.filter(p => p.mood);
    const entriesWithEnergy = progressEntries.filter(p => p.energyLevel);
    
    if (entriesWithEnergy.length > 0) {
      stats.averageEnergy = (entriesWithEnergy.reduce((sum, p) => sum + p.energyLevel, 0) / entriesWithEnergy.length).toFixed(1);
    }
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get progress stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/progress/chart-data
// @desc    Get data formatted for charts
// @access  Private
router.get('/chart-data', auth, async (req, res) => {
  try {
    const { period = '30', metric = 'weight' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const progressEntries = await Progress.find({
      userId: req.userId,
      date: { $gte: startDate }
    }).sort({ date: 1 });
    
    const chartData = progressEntries.map(entry => ({
      date: entry.date,
      value: metric === 'bodyFat' ? entry.bodyFat : entry.weight
    })).filter(item => item.value != null);
    
    res.json({
      success: true,
      data: chartData
    });
  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// -------------------- PR Endpoints --------------------

// @route   POST /api/progress/pr
// @desc    Log a personal record (PR) for a muscle group/exercise
// @access  Private
router.post('/pr', auth, async (req, res) => {
  try {
    const { muscleGroup, exercise, value, unit, date, notes } = req.body;

    if (!muscleGroup || !exercise || value == null) {
      return res.status(400).json({ success: false, message: 'muscleGroup, exercise and value are required' });
    }

    const pr = new PR({
      userId: req.userId,
      muscleGroup,
      exercise,
      value: Number(value),
      unit: unit || 'kg',
      date: date ? new Date(date) : undefined,
      notes
    });

    await pr.save();

    res.status(201).json({ success: true, message: 'PR logged', data: pr });
  } catch (error) {
    console.error('Create PR error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/progress/pr
// @desc    Get PRs for a muscle group or exercise
// @access  Private
router.get('/pr', auth, async (req, res) => {
  try {
    const { muscleGroup, exercise, startDate, endDate } = req.query;
    const query = { userId: req.userId };
    if (muscleGroup) query.muscleGroup = muscleGroup;
    if (exercise) query.exercise = exercise;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const prs = await PR.find(query).sort({ date: 1 });
    res.json({ success: true, data: prs });
  } catch (error) {
    console.error('Get PRs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/progress/pr-chart
// @desc    Get PR chart data for a muscle group/exercise (date,value[])
// @access  Private
router.get('/pr-chart', auth, async (req, res) => {
  try {
    const { muscleGroup, exercise, period = '90' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query = { userId: req.userId, date: { $gte: startDate } };
    if (muscleGroup) query.muscleGroup = muscleGroup;
    if (exercise) query.exercise = exercise;

    const prs = await PR.find(query).sort({ date: 1 });

    const chartData = prs.map(p => ({ date: p.date, value: p.value, unit: p.unit, exercise: p.exercise }));

    res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('Get PR chart data error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

