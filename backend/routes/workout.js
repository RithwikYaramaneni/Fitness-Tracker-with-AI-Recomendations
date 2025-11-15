const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Workout = require('../models/Workout');
const User = require('../models/User');

// @route   GET /api/workouts
// @desc    Get user's workouts
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, type, completed } = req.query;
    
    const query = { userId: req.userId };
    
    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Filter by type
    if (type) query.type = type;
    
    // Filter by completion status
    if (completed !== undefined) query.completed = completed === 'true';
    
    const workouts = await Workout.find(query).sort({ date: -1 });
    
    res.json({
      success: true,
      data: workouts
    });
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/workouts
// @desc    Create/log a workout
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, exercises, duration, difficulty, notes } = req.body;
    
    const user = await User.findById(req.userId);
    const caloriesBurned = Math.round(duration * (user.profile.weight || 70) * 0.1);
    
    const workout = new Workout({
      userId: req.userId,
      name,
      type,
      exercises,
      duration,
      caloriesBurned,
      difficulty,
      notes
    });
    
    await workout.save();
    
    // Update streak
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastWorkoutDate = user.streak?.lastWorkoutDate 
      ? new Date(user.streak.lastWorkoutDate)
      : null;
    
    if (lastWorkoutDate) {
      lastWorkoutDate.setHours(0, 0, 0, 0);
    }
    
    if (!user.streak) {
      user.streak = { current: 0, longest: 0 };
    }
    
    if (!lastWorkoutDate || lastWorkoutDate.getTime() !== today.getTime()) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (!lastWorkoutDate) {
        user.streak.current = 1;
        user.streak.longest = 1;
      } else if (lastWorkoutDate.getTime() === yesterday.getTime()) {
        user.streak.current += 1;
        if (user.streak.current > user.streak.longest) {
          user.streak.longest = user.streak.current;
        }
      } else if (lastWorkoutDate.getTime() < yesterday.getTime()) {
        user.streak.current = 1;
      }
      
      user.streak.lastWorkoutDate = new Date();
      await user.save();
    }
    
    res.status(201).json({
      success: true,
      message: 'Workout logged successfully',
      data: workout,
      streak: {
        current: user.streak.current,
        longest: user.streak.longest
      }
    });
  } catch (error) {
    console.error('Create workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/workouts/:id
// @desc    Update workout
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    // Update fields
    const updates = req.body;
    Object.keys(updates).forEach(key => {
      workout[key] = updates[key];
    });
    
    // Update completed timestamp if marking as complete
    if (updates.completed && !workout.completedAt) {
      workout.completedAt = new Date();
    }
    
    await workout.save();
    
    res.json({
      success: true,
      message: 'Workout updated successfully',
      data: workout
    });
  } catch (error) {
    console.error('Update workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/workouts/:id
// @desc    Delete workout
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Workout deleted successfully'
    });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/workouts/stats
// @desc    Get workout statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const workouts = await Workout.find({
      userId: req.userId,
      date: { $gte: startDate },
      completed: true
    });
    
    const stats = {
      totalWorkouts: workouts.length,
      totalDuration: workouts.reduce((sum, w) => sum + w.duration, 0),
      totalCalories: workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
      averageDuration: workouts.length > 0 
        ? Math.round(workouts.reduce((sum, w) => sum + w.duration, 0) / workouts.length)
        : 0,
      workoutsByType: {},
      weeklyFrequency: Math.round((workouts.length / days) * 7)
    };
    
    // Count workouts by type
    workouts.forEach(workout => {
      stats.workoutsByType[workout.type] = (stats.workoutsByType[workout.type] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get workout stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/workouts/exercise-history/:exerciseName
// @desc    Get history for a specific exercise (last 5 entries)
// @access  Private
router.get('/exercise-history/:exerciseName', auth, async (req, res) => {
  try {
    const exerciseName = req.params.exerciseName.toLowerCase().trim();
    
    if (!exerciseName) {
      return res.status(400).json({
        success: false,
        message: 'Exercise name is required'
      });
    }

    // Find workouts containing this exercise
    const workouts = await Workout.find({
      userId: req.userId,
      'exercises.name': { $regex: new RegExp(exerciseName, 'i') }
    })
    .sort({ date: -1 })
    .limit(10);

    // Extract the specific exercise data
    const history = [];
    workouts.forEach(workout => {
      const exercise = workout.exercises.find(
        ex => ex.name.toLowerCase().includes(exerciseName)
      );
      if (exercise) {
        history.push({
          date: workout.date,
          workoutName: workout.name,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          duration: exercise.duration,
          notes: exercise.notes,
          completed: workout.completed
        });
      }
    });

    // Get the most recent completed workout for "last time" data
    const lastCompleted = history.find(h => h.completed);

    res.json({
      success: true,
      data: {
        exerciseName,
        history: history.slice(0, 5), // Return last 5 entries
        lastCompleted
      }
    });
  } catch (error) {
    console.error('Get exercise history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/workouts/all-exercises
// @desc    Get list of all unique exercises user has done
// @access  Private
router.get('/all-exercises', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ userId: req.userId });
    
    // Extract all unique exercise names
    const exerciseMap = new Map();
    
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const name = exercise.name.toLowerCase().trim();
        if (name && !exerciseMap.has(name)) {
          exerciseMap.set(name, {
            name: exercise.name,
            count: 1,
            lastPerformed: workout.date
          });
        } else if (name) {
          const existing = exerciseMap.get(name);
          existing.count++;
          if (workout.date > existing.lastPerformed) {
            existing.lastPerformed = workout.date;
          }
        }
      });
    });

    const exercises = Array.from(exerciseMap.values())
      .sort((a, b) => b.lastPerformed - a.lastPerformed);

    res.json({
      success: true,
      data: exercises
    });
  } catch (error) {
    console.error('Get all exercises error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
