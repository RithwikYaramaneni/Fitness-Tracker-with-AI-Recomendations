const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/user/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate additional metrics
    const bmi = user.calculateBMI();
    const dailyCalories = user.calculateDailyCalories();

    // Check if user has a nutrition goal for today
    const today = new Date();
    today.setHours(0,0,0,0);
    const goalEntry = (user.nutritionGoals || []).find(g => {
      const d = new Date(g.date);
      d.setHours(0,0,0,0);
      return d.getTime() === today.getTime();
    });
    const nutritionGoal = goalEntry ? goalEntry.calories : null;

    res.json({
      success: true,
      data: {
        user,
        metrics: {
          bmi,
          dailyCalories,
          nutritionGoal
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/user/nutrition-goal?date=YYYY-MM-DD
// @desc    Get user's nutrition goal for a date (defaults to today)
// @access  Private
router.get('/nutrition-goal', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0,0,0,0);

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const entry = (user.nutritionGoals || []).find(g => {
      const d = new Date(g.date); d.setHours(0,0,0,0); return d.getTime() === targetDate.getTime();
    });

    res.json({ success: true, data: { date: targetDate, calories: entry ? entry.calories : null } });
  } catch (error) {
    console.error('Get nutrition goal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/user/nutrition-goal
// @desc    Set or update user's nutrition goal for a date
// @access  Private
router.put('/nutrition-goal', auth, async (req, res) => {
  try {
    const { date, calories } = req.body;
    if (!calories || isNaN(Number(calories))) return res.status(400).json({ success: false, message: 'Valid calories required' });

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0,0,0,0);

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Upsert goal
    user.nutritionGoals = user.nutritionGoals || [];
    const idx = user.nutritionGoals.findIndex(g => { const d = new Date(g.date); d.setHours(0,0,0,0); return d.getTime() === targetDate.getTime(); });
    if (idx >= 0) {
      user.nutritionGoals[idx].calories = Number(calories);
    } else {
      user.nutritionGoals.push({ date: targetDate, calories: Number(calories) });
    }

    await user.save();

    res.json({ success: true, message: 'Nutrition goal set', data: { date: targetDate, calories: Number(calories) } });
  } catch (error) {
    console.error('Set nutrition goal error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/user/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    
    // Fields that can be updated
    const allowedUpdates = [
      'name',
      'profile',
      'preferences'
    ];

    // Check if updates are valid
    const isValidUpdate = Object.keys(updates).every(key => 
      allowedUpdates.includes(key)
    );

    if (!isValidUpdate) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates'
      });
    }

    // Update user
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Apply updates
    Object.keys(updates).forEach(key => {
      if (key === 'profile' && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
        // Merge profile fields
        user.profile = user.profile || {};
        Object.keys(updates.profile).forEach(profileKey => {
          user.profile[profileKey] = updates.profile[profileKey];
        });
        user.markModified('profile');
      } else if (key === 'preferences' && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
        // Merge preferences fields
        user.preferences = user.preferences || {};
        Object.keys(updates.preferences).forEach(prefKey => {
          user.preferences[prefKey] = updates.preferences[prefKey];
        });
        user.markModified('preferences');
        console.log('[Profile Update] Preferences updated:', user.preferences);
      } else {
        user[key] = updates[key];
      }
    });

    await user.save();
    console.log('[Profile Update] User saved, workoutFrequency:', user.preferences?.workoutFrequency);

    // Calculate metrics
    const bmi = user.calculateBMI();
    const dailyCalories = user.calculateDailyCalories();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          profile: user.profile,
          preferences: user.preferences
        },
        metrics: {
          bmi,
          dailyCalories
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @route   GET /api/user/metrics
// @desc    Get user health metrics
// @access  Private
router.get('/metrics', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const bmi = user.calculateBMI();
    const dailyCalories = user.calculateDailyCalories();

    // BMI category
    let bmiCategory = 'Normal';
    if (bmi) {
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi >= 18.5 && bmi < 25) bmiCategory = 'Normal';
      else if (bmi >= 25 && bmi < 30) bmiCategory = 'Overweight';
      else bmiCategory = 'Obese';
    }

    res.json({
      success: true,
      data: {
        bmi,
        bmiCategory,
        dailyCalories,
        currentWeight: user.profile.weight,
        targetWeight: user.profile.targetWeight,
        height: user.profile.height,
        age: user.profile.age,
        fitnessGoal: user.profile.fitnessGoal
      }
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
