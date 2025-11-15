const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  calories: {
    type: Number,
    required: true
  },
  protein: {
    type: Number, // in grams
    required: true
  },
  carbs: {
    type: Number, // in grams
    required: true
  },
  fat: {
    type: Number, // in grams
    required: true
  },
  fiber: {
    type: Number // in grams
  },
  servingSize: {
    type: String,
    default: '100g'
  },
  quantity: {
    type: Number,
    default: 1
  }
});

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack'],
    required: true
  },
  foods: [foodItemSchema],
  totalCalories: {
    type: Number,
    required: true,
    default: 0
  },
  totalProtein: {
    type: Number,
    required: true,
    default: 0
  },
  totalCarbs: {
    type: Number,
    required: true,
    default: 0
  },
  totalFat: {
    type: Number,
    required: true,
    default: 0
  },
  notes: String,
  aiGenerated: {
    type: Boolean,
    default: false
  }
});

// Calculate totals before validation so required validators see computed values
mealSchema.pre('validate', function(next) {
  if (this.foods && this.foods.length > 0) {
    this.totalCalories = this.foods.reduce((sum, food) => sum + (Number(food.calories || 0) * Number(food.quantity || 1)), 0);
    this.totalProtein = this.foods.reduce((sum, food) => sum + (Number(food.protein || 0) * Number(food.quantity || 1)), 0);
    this.totalCarbs = this.foods.reduce((sum, food) => sum + (Number(food.carbs || 0) * Number(food.quantity || 1)), 0);
    this.totalFat = this.foods.reduce((sum, food) => sum + (Number(food.fat || 0) * Number(food.quantity || 1)), 0);
  } else {
    // Ensure numeric defaults
    this.totalCalories = this.totalCalories || 0;
    this.totalProtein = this.totalProtein || 0;
    this.totalCarbs = this.totalCarbs || 0;
    this.totalFat = this.totalFat || 0;
  }
  next();
});

module.exports = mongoose.model('Meal', mealSchema);
