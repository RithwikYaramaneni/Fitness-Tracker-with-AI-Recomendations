const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateWorkoutPlan } = require('../utils/aiService');
const WorkoutPlan = require('../models/WorkoutPlan');
const User = require('../models/User');
const Workout = require('../models/Workout');
const PR = require('../models/PR');

// POST /api/ai/workout/generate - generate new AI workout plan
router.post('/generate', auth, async (req, res) => {
  try {
    console.log('[AI Workout] Generate request from user:', req.userId);
    
    // Get user with full profile
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if profile is complete
    const { age, gender, weight, height, fitnessGoal, activityLevel } = user.profile || {};
    if (!age || !gender || !weight || !height || !fitnessGoal) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile (age, gender, weight, height, fitness goal) to generate a workout plan'
      });
    }

    // Get workout frequency from preferences (default to 3)
    const workoutFrequency = user.preferences?.workoutFrequency || 3;
    const equipmentAvailable = user.preferences?.equipmentAvailable || ['none'];
    const experienceLevel = user.profile?.experienceLevel || 'beginner';

    console.log('[AI Workout] User preferences:', {
      workoutFrequency,
      equipmentAvailable,
      experienceLevel,
      rawPreferences: user.preferences
    });

    // Get recent workout history (last 5)
    const recentWorkouts = await Workout.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(5)
      .select('type exercises duration date');

    // Get personal records
    const prs = await PR.find({ userId: req.userId })
      .sort({ achievedAt: -1 })
      .limit(10);
    
    const personalRecords = {};
    prs.forEach(pr => {
      personalRecords[pr.exercise] = {
        weight: pr.weight,
        reps: pr.reps,
        achievedAt: pr.achievedAt
      };
    });

    // Build user profile for AI
    const userProfile = {
      age,
      gender,
      weight,
      height,
      fitnessGoal,
      equipmentAvailable,
      experienceLevel,
      workoutFrequency,
      injuries: user.profile?.injuries || [],
      previousWorkouts: recentWorkouts.map(w => ({
        type: w.type,
        exercises: w.exercises,
        date: w.date
      })),
      personalRecords,
      streak: user.streak
    };

    console.log('[AI Workout] Generating plan for:', {
      goal: fitnessGoal,
      level: experienceLevel,
      frequency: workoutFrequency,
      equipment: equipmentAvailable
    });

    // Generate workout plan using AI
    const aiPlan = await generateWorkoutPlan(userProfile);
    console.log('[AI Workout] Generated plan with', aiPlan.dailyWorkouts?.length, 'workout days');

    // Deactivate previous active plans
    await WorkoutPlan.updateMany(
      { userId: req.userId, active: true },
      { $set: { active: false } }
    );

    // Save workout plan to database
    const workoutPlan = new WorkoutPlan({
      userId: req.userId,
      weekNumber: 1,
      weeklyGoal: aiPlan.weeklyGoal,
      dailyWorkouts: aiPlan.dailyWorkouts,
      motivation: aiPlan.motivation,
      generatedFor: {
        fitnessGoal,
        experienceLevel,
        workoutFrequency,
        equipmentAvailable
      }
    });

    await workoutPlan.save();
    console.log('[AI Workout] Plan saved with ID:', workoutPlan._id);

    res.json({
      success: true,
      data: {
        planId: workoutPlan._id,
        weeklyGoal: workoutPlan.weeklyGoal,
        dailyWorkouts: workoutPlan.dailyWorkouts,
        motivation: workoutPlan.motivation,
        adherenceRate: 0
      }
    });
  } catch (error) {
    console.error('[AI Workout] Error generating plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate workout plan',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/ai/workout/active - get current active workout plan
router.get('/active', auth, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({
      userId: req.userId,
      active: true
    }).sort({ createdAt: -1 });

    if (!plan) {
      return res.json({ success: true, data: null });
    }

    // Calculate adherence
    plan.calculateAdherence();
    await plan.save();

    res.json({
      success: true,
      data: {
        planId: plan._id,
        weekNumber: plan.weekNumber,
        weeklyGoal: plan.weeklyGoal,
        dailyWorkouts: plan.dailyWorkouts,
        motivation: plan.motivation,
        adherenceRate: plan.adherenceRate,
        createdAt: plan.createdAt,
        expiresAt: plan.expiresAt
      }
    });
  } catch (error) {
    console.error('[AI Workout] Error fetching active plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout plan'
    });
  }
});

// POST /api/ai/workout/complete-exercise - mark exercise as completed
router.post('/complete-exercise', auth, async (req, res) => {
  try {
    const { planId, dayIndex, exerciseIndex } = req.body;

    if (planId === undefined || dayIndex === undefined || exerciseIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'planId, dayIndex, and exerciseIndex are required'
      });
    }

    const plan = await WorkoutPlan.findOne({
      _id: planId,
      userId: req.userId
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Mark exercise as completed
    plan.completeExercise(dayIndex, exerciseIndex);
    await plan.save();

    res.json({
      success: true,
      data: {
        adherenceRate: plan.adherenceRate,
        dailyWorkouts: plan.dailyWorkouts
      }
    });
  } catch (error) {
    console.error('[AI Workout] Error completing exercise:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark exercise as completed'
    });
  }
});

// POST /api/ai/workout/complete-day - mark entire day as completed
router.post('/complete-day', auth, async (req, res) => {
  try {
    const { planId, dayIndex } = req.body;

    if (planId === undefined || dayIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'planId and dayIndex are required'
      });
    }

    const plan = await WorkoutPlan.findOne({
      _id: planId,
      userId: req.userId
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    // Mark all exercises in the day as completed
    if (plan.dailyWorkouts[dayIndex]) {
      plan.dailyWorkouts[dayIndex].exercises.forEach((exercise) => {
        exercise.completed = true;
        exercise.completedAt = new Date();
      });
      plan.dailyWorkouts[dayIndex].completed = true;
      plan.dailyWorkouts[dayIndex].completedAt = new Date();
      
      plan.calculateAdherence();
      await plan.save();
    }

    res.json({
      success: true,
      data: {
        adherenceRate: plan.adherenceRate,
        dailyWorkouts: plan.dailyWorkouts
      }
    });
  } catch (error) {
    console.error('[AI Workout] Error completing day:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark day as completed'
    });
  }
});

// DELETE /api/ai/workout/:planId - delete a workout plan
router.delete('/:planId', auth, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOneAndDelete({
      _id: req.params.planId,
      userId: req.userId
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Workout plan not found'
      });
    }

    res.json({ success: true, message: 'Workout plan deleted' });
  } catch (error) {
    console.error('[AI Workout] Error deleting plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workout plan'
    });
  }
});

module.exports = router;
