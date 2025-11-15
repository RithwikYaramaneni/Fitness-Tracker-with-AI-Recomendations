const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Meal = require('../models/Nutrition');
const User = require('../models/User');

// Helper: sanitize food items coming from client
function sanitizeFoods(foods) {
  if (!Array.isArray(foods)) return [];
  return foods.map(f => ({
    name: (f.name || '').toString(),
    calories: Number(f.calories) || 0,
    protein: Number(f.protein) || 0,
    carbs: Number(f.carbs) || 0,
    fat: Number(f.fat) || 0,
    fiber: f.fiber ? Number(f.fiber) || 0 : undefined,
    servingSize: f.servingSize || '100g',
    quantity: Number(f.quantity) > 0 ? Number(f.quantity) : 1
  }));
}

// @route   GET /api/nutrition
// @desc    Get user's meal logs
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, mealType } = req.query;
    
    const query = { userId: req.userId };
    
    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // Filter by meal type
    if (mealType) query.mealType = mealType;
    
    const meals = await Meal.find(query).sort({ date: -1 });
    
    res.json({
      success: true,
      data: meals
    });
  } catch (error) {
    console.error('Get nutrition error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/nutrition
// @desc    Log a meal
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { mealType, foods, notes } = req.body;
    
    const sanitizedFoods = sanitizeFoods(foods);

    if (!sanitizedFoods || sanitizedFoods.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one food item is required'
      });
    }
    
    const meal = new Meal({
      userId: req.userId,
      mealType,
      foods: sanitizedFoods,
      notes
    });

    await meal.save();

    res.status(201).json({
      success: true,
      message: 'Meal logged successfully',
      data: meal
    });
  } catch (error) {
    console.error('Create meal error:', error);
    // Return validation errors as 400 so frontend can show them
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('; ') });
    }
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/nutrition/:id
// @desc    Update meal
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findOne({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }
    
    // Update fields
    const updates = req.body;
    // If foods are provided, sanitize them
    if (updates.foods) {
      updates.foods = sanitizeFoods(updates.foods);
    }
    Object.keys(updates).forEach(key => {
      meal[key] = updates[key];
    });
    
    await meal.save();
    
    res.json({
      success: true,
      message: 'Meal updated successfully',
      data: meal
    });
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/nutrition/:id
// @desc    Delete meal
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const meal = await Meal.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });
    
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: 'Meal not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Meal deleted successfully'
    });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/nutrition/daily-summary
// @desc    Get daily nutrition summary
// @access  Private
router.get('/daily-summary', auth, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Set date range for the day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const meals = await Meal.find({
      userId: req.userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const summary = {
      date: targetDate,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      mealCount: meals.length,
      mealsByType: {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        snack: 0
      }
    };
    
    meals.forEach(meal => {
      summary.totalCalories += meal.totalCalories;
      summary.totalProtein += meal.totalProtein;
      summary.totalCarbs += meal.totalCarbs;
      summary.totalFat += meal.totalFat;
      summary.mealsByType[meal.mealType] += 1;
    });
    
    // Get user's daily calorie target; prefer per-day nutrition goal if set
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Look for nutrition goal for this date
    const goalDate = new Date(targetDate);
    goalDate.setHours(0,0,0,0);
    let dailyCalories = null;
    if (user.nutritionGoals && user.nutritionGoals.length > 0) {
      const goalEntry = user.nutritionGoals.find(g => { const d = new Date(g.date); d.setHours(0,0,0,0); return d.getTime() === goalDate.getTime(); });
      if (goalEntry) dailyCalories = goalEntry.calories;
    }
    if (dailyCalories === null) {
      dailyCalories = typeof user.calculateDailyCalories === 'function' ? user.calculateDailyCalories() : 0;
    }
    
    summary.calorieGoal = dailyCalories;
    summary.caloriesRemaining = dailyCalories - summary.totalCalories;
    summary.percentageOfGoal = dailyCalories > 0 
      ? Math.round((summary.totalCalories / dailyCalories) * 100)
      : 0;
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get daily summary error:', error.stack || error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/nutrition/stats
// @desc    Get nutrition statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = '7' } = req.query;
    const days = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const meals = await Meal.find({
      userId: req.userId,
      date: { $gte: startDate }
    });
    
    const stats = {
      totalMeals: meals.length,
      averageCalories: meals.length > 0
        ? Math.round(meals.reduce((sum, m) => sum + m.totalCalories, 0) / meals.length)
        : 0,
      averageProtein: meals.length > 0
        ? Math.round(meals.reduce((sum, m) => sum + m.totalProtein, 0) / meals.length)
        : 0,
      averageCarbs: meals.length > 0
        ? Math.round(meals.reduce((sum, m) => sum + m.totalCarbs, 0) / meals.length)
        : 0,
      averageFat: meals.length > 0
        ? Math.round(meals.reduce((sum, m) => sum + m.totalFat, 0) / meals.length)
        : 0
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get nutrition stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
