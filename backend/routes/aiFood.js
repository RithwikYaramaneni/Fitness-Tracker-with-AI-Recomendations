const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateFoodRecommendations } = require('../utils/aiService');
const Meal = require('../models/Nutrition');
const User = require('../models/User');

/**
 * Macro Distribution Formulas (Based on CURRENT WEIGHT):
 * 
 * All macros calculated based on CURRENT WEIGHT.
 * Calorie adjustment for goals: -300 for weight loss, +300 for gain, 0 for maintain
 * 
 * PROTEIN: 2g per kg of CURRENT body weight
 * FAT: 0.8-1g per kg of CURRENT body weight (0.8 for weight loss, 1.0 for maintain/gain)
 * CARBS: Remaining calories after protein and fat
 * 
 * Conversion: Protein=4cal/g, Carbs=4cal/g, Fat=9cal/g
 */
function calculateMacros(calories, fitnessGoal, currentWeight, targetWeight) {
  // Always use CURRENT weight for macro calculations
  const weightForCalculation = currentWeight;
  
  // Calculate protein as 2g per kg TARGET body weight
  const proteinGrams = Math.round(weightForCalculation * 2);
  const proteinCalories = proteinGrams * 4; // 4 cal per gram protein
  
  // Calculate fat as 0.8-1g per kg TARGET body weight (essential for hormones)
  // Use 0.8g/kg for weight loss, 1.0g/kg for maintenance/gain
  let fatGrams;
  if (fitnessGoal === 'lose_weight') {
    fatGrams = Math.round(weightForCalculation * 0.8);
  } else {
    fatGrams = Math.round(weightForCalculation * 1.0);
  }
  const fatCalories = fatGrams * 9; // 9 cal per gram fat
  
  // Remaining calories go to carbs (primary energy source)
  const carbsCalories = calories - proteinCalories - fatCalories;
  const carbsGrams = Math.round(carbsCalories / 4); // 4 cal per gram carbs
  
  // Calculate percentages for display
  const proteinPct = Math.round((proteinCalories / calories) * 100);
  const carbsPct = Math.round((carbsCalories / calories) * 100);
  const fatPct = Math.round((fatCalories / calories) * 100);
  
  return {
    proteinGrams,
    carbsGrams,
    fatGrams,
    proteinPct,
    carbsPct,
    fatPct,
    usingTargetWeight: !!targetWeight
  };
}

// POST /api/ai/food - generate recommendations
router.post('/food', auth, async (req, res) => {
  try {
    const { dietary = [] } = req.body;
    
    console.log('[AI Food] Request received from user:', req.userId);
    
    // Get user profile to calculate calories and macros
    const user = await User.findById(req.userId);
    if (!user) {
      console.log('[AI Food] User not found:', req.userId);
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate daily calories based on user profile
    const dailyCalories = user.calculateDailyCalories();
    console.log('[AI Food] Calculated calories:', dailyCalories, 'for user:', user.name);
    
    if (!dailyCalories) {
      console.log('[AI Food] Missing profile data for user:', user.name);
      return res.status(400).json({ 
        success: false, 
        message: 'Please complete your profile (age, gender, height, weight, activity level) to get recommendations' 
      });
    }

    // Get fitness goal, current weight, and target weight
    const fitnessGoal = user.profile?.fitnessGoal || 'maintain';
    const currentWeight = user.profile?.weight;
    const targetWeight = user.profile?.targetWeight;
    
    if (!currentWeight) {
      console.log('[AI Food] Missing current weight for user:', user.name);
      return res.status(400).json({ 
        success: false, 
        message: 'Please add your current body weight in your profile to get accurate recommendations' 
      });
    }
    
    console.log('[AI Food] Fitness goal:', fitnessGoal, 'Current weight:', currentWeight, 'kg', 'Target weight:', targetWeight || 'not set', 'kg');
    
    // Calculate macros based on goal and target weight (or current if target not set)
    const macros = calculateMacros(dailyCalories, fitnessGoal, currentWeight, targetWeight);
    console.log('[AI Food] Calculated macros (using', macros.usingTargetWeight ? 'TARGET' : 'CURRENT', 'weight):', macros);

    // Build preferences for AI
    const prefs = {
      goal: fitnessGoal,
      dietary: dietary.length > 0 ? dietary : (user.profile?.dietaryPreferences || []),
      calories: dailyCalories,
      macros: {
        proteinPct: macros.proteinPct,
        carbsPct: macros.carbsPct,
        fatPct: macros.fatPct
      },
      targetMacros: {
        protein: macros.proteinGrams,
        carbs: macros.carbsGrams,
        fat: macros.fatGrams
      }
    };

    console.log('[AI Food] Generating recommendations with prefs:', JSON.stringify(prefs, null, 2));
    const recommendations = await generateFoodRecommendations(prefs);
    console.log('[AI Food] Generated recommendations with', recommendations?.meals?.length, 'meals');

    res.json({ 
      success: true, 
      data: {
        ...recommendations,
        calculatedCalories: dailyCalories,
        macros: {
          protein: `${macros.proteinGrams}g (${macros.proteinPct}%)`,
          carbs: `${macros.carbsGrams}g (${macros.carbsPct}%)`,
          fat: `${macros.fatGrams}g (${macros.fatPct}%)`
        }
      }
    });
  } catch (error) {
    console.error('[AI Food] ERROR:', error);
    console.error('[AI Food] Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// POST /api/ai/food/save - save a recommended meal to user's nutrition log
router.post('/food/save', auth, async (req, res) => {
  try {
    const { mealType = 'meal', foods = [], date, notes } = req.body;
    if (!Array.isArray(foods) || foods.length === 0) {
      return res.status(400).json({ success: false, message: 'Foods array is required' });
    }

    const meal = new Meal({
      userId: req.userId,
      date: date ? new Date(date) : Date.now(),
      mealType,
      foods,
      notes,
      aiGenerated: true
    });

    await meal.save();

    res.status(201).json({ success: true, data: meal });
  } catch (error) {
    console.error('Save AI meal error:', error);
    res.status(500).json({ success: false, message: 'Failed to save meal' });
  }
});

module.exports = router;
