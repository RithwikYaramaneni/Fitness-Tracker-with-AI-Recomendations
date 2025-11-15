const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/streak
// @desc    Get current streak information
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('streak');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        current: user.streak?.current || 0,
        longest: user.streak?.longest || 0,
        lastWorkoutDate: user.streak?.lastWorkoutDate
      }
    });
  } catch (error) {
    console.error('Get streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/streak/update
// @desc    Update streak after workout
// @access  Private
router.post('/update', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWorkoutDate = user.streak?.lastWorkoutDate 
      ? new Date(user.streak.lastWorkoutDate)
      : null;

    if (lastWorkoutDate) {
      lastWorkoutDate.setHours(0, 0, 0, 0);
    }

    // Initialize streak if not exists
    if (!user.streak) {
      user.streak = {
        current: 0,
        longest: 0,
        lastWorkoutDate: null
      };
    }

    // Check if workout was already logged today
    if (lastWorkoutDate && lastWorkoutDate.getTime() === today.getTime()) {
      return res.json({
        success: true,
        message: 'Workout already logged today',
        data: {
          current: user.streak.current,
          longest: user.streak.longest,
          lastWorkoutDate: user.streak.lastWorkoutDate
        }
      });
    }

    // Calculate days difference
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (!lastWorkoutDate) {
      // First workout ever
      user.streak.current = 1;
      user.streak.longest = 1;
    } else if (lastWorkoutDate.getTime() === yesterday.getTime()) {
      // Continuing streak
      user.streak.current += 1;
      if (user.streak.current > user.streak.longest) {
        user.streak.longest = user.streak.current;
      }
    } else if (lastWorkoutDate.getTime() < yesterday.getTime()) {
      // Streak broken, reset to 1
      user.streak.current = 1;
    }

    user.streak.lastWorkoutDate = new Date();
    await user.save();

    res.json({
      success: true,
      message: 'Streak updated successfully',
      data: {
        current: user.streak.current,
        longest: user.streak.longest,
        lastWorkoutDate: user.streak.lastWorkoutDate
      }
    });
  } catch (error) {
    console.error('Update streak error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/streak/leaderboard
// @desc    Get streak leaderboard
// @access  Private
router.get('/leaderboard', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const users = await User.find()
      .select('name streak.current streak.longest')
      .sort({ 'streak.current': -1 })
      .limit(parseInt(limit));

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      name: user.name,
      currentStreak: user.streak?.current || 0,
      longestStreak: user.streak?.longest || 0,
      isCurrentUser: user._id.toString() === req.userId
    }));

    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
