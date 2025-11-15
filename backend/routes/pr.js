const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PR = require('../models/PR');

// @route   POST /api/pr/add
// @desc    Add or update a PR entry for an exercise
// @access  Private
router.post('/add', auth, async (req, res) => {
  try {
    const { exercise, weight, reps, muscleGroup, notes, unit } = req.body;

    if (!exercise || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Exercise name and weight are required'
      });
    }

    // Find existing PR record for this exercise
    let prRecord = await PR.findOne({
      userId: req.userId,
      exercise: exercise.trim().toLowerCase()
    });

    if (prRecord) {
      // Add new entry to history
      prRecord.addPREntry(weight, reps || 1, notes || '');
      
      // Update muscle group if provided
      if (muscleGroup) {
        prRecord.muscleGroup = muscleGroup;
      }
      
      // Update unit if provided
      if (unit) {
        prRecord.unit = unit;
      }
      
      await prRecord.save();
    } else {
      // Create new PR record
      prRecord = new PR({
        userId: req.userId,
        exercise: exercise.trim().toLowerCase(),
        muscleGroup: muscleGroup || 'other',
        unit: unit || 'kg',
        prHistory: [{
          weight,
          reps: reps || 1,
          notes: notes || '',
          date: new Date()
        }],
        currentPR: {
          weight,
          reps: reps || 1,
          date: new Date()
        }
      });
      
      await prRecord.save();
    }

    res.json({
      success: true,
      message: 'PR added successfully',
      data: prRecord
    });
  } catch (error) {
    console.error('Add PR error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/pr/:exercise
// @desc    Get all PR history for a specific exercise
// @access  Private
router.get('/:exercise', auth, async (req, res) => {
  try {
    const exercise = req.params.exercise.trim().toLowerCase();
    
    const prRecord = await PR.findOne({
      userId: req.userId,
      exercise
    });

    if (!prRecord) {
      return res.json({
        success: true,
        data: {
          exercise,
          prHistory: [],
          currentPR: null
        }
      });
    }

    res.json({
      success: true,
      data: prRecord
    });
  } catch (error) {
    console.error('Get PR error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/pr
// @desc    Get all PRs for the logged-in user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const prs = await PR.find({ userId: req.userId })
      .sort({ 'currentPR.weight': -1 });

    res.json({
      success: true,
      data: prs
    });
  } catch (error) {
    console.error('Get all PRs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/pr/stats/summary
// @desc    Get PR statistics summary
// @access  Private
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const prs = await PR.find({ userId: req.userId });
    
    const stats = {
      totalExercises: prs.length,
      totalPRs: prs.reduce((sum, pr) => sum + pr.prHistory.length, 0),
      recentPRs: [],
      topPRs: []
    };

    // Get recent PRs (last 5)
    const allEntries = [];
    prs.forEach(pr => {
      pr.prHistory.forEach(entry => {
        allEntries.push({
          exercise: pr.exercise,
          weight: entry.weight,
          reps: entry.reps,
          date: entry.date,
          unit: pr.unit
        });
      });
    });
    
    allEntries.sort((a, b) => b.date - a.date);
    stats.recentPRs = allEntries.slice(0, 5);

    // Get top PRs by weight
    stats.topPRs = prs
      .filter(pr => pr.currentPR)
      .sort((a, b) => b.currentPR.weight - a.currentPR.weight)
      .slice(0, 5)
      .map(pr => ({
        exercise: pr.exercise,
        weight: pr.currentPR.weight,
        reps: pr.currentPR.reps,
        date: pr.currentPR.date,
        unit: pr.unit
      }));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get PR stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/pr/:exercise
// @desc    Delete a PR record
// @access  Private
router.delete('/:exercise', auth, async (req, res) => {
  try {
    const exercise = req.params.exercise.trim().toLowerCase();
    
    const result = await PR.findOneAndDelete({
      userId: req.userId,
      exercise
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'PR record not found'
      });
    }

    res.json({
      success: true,
      message: 'PR record deleted successfully'
    });
  } catch (error) {
    console.error('Delete PR error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
