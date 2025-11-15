const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  profile: {
    age: {
      type: Number,
      min: 13,
      max: 120
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    },
    height: {
      type: Number, // in cm
      min: 50,
      max: 300
    },
    weight: {
      type: Number, // in kg
      min: 20,
      max: 500
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
      default: 'moderate'
    },
    fitnessGoal: {
      type: String,
      enum: ['lose_weight', 'maintain', 'gain_muscle', 'improve_endurance'],
      default: 'maintain'
    },
    targetWeight: {
      type: Number,
      min: 20,
      max: 500
    },
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    dietaryPreferences: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free', 'none']
    }],
    medicalConditions: [String],
    injuries: [String]
  },
  preferences: {
    workoutDuration: {
      type: Number, // in minutes
      default: 45
    },
    workoutFrequency: {
      type: Number, // days per week
      default: 3
    },
    preferredWorkoutTypes: [{
      type: String,
      enum: ['strength', 'cardio', 'yoga', 'hiit', 'pilates', 'sports']
    }],
    equipmentAvailable: [{
      type: String,
      enum: ['none', 'dumbbells', 'barbell', 'resistance_bands', 'kettlebell', 'pull_up_bar', 'gym_access']
    }]
  },
  // Optional per-day nutrition goals
  nutritionGoals: [
    {
      date: { type: Date, required: true },
      calories: { type: Number, required: true }
    }
  ],
  // Social features
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Streak tracking
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastWorkoutDate: {
      type: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to calculate BMI
userSchema.methods.calculateBMI = function() {
  if (this.profile.height && this.profile.weight) {
    const heightInMeters = this.profile.height / 100;
    return (this.profile.weight / (heightInMeters * heightInMeters)).toFixed(1);
  }
  return null;
};

// Method to calculate daily calorie needs based on CURRENT weight
userSchema.methods.calculateDailyCalories = function() {
  if (!this.profile.weight || !this.profile.height || !this.profile.age || !this.profile.gender) {
    return null;
  }

  // Mifflin-St Jeor Equation (using CURRENT weight)
  let bmr;
  if (this.profile.gender === 'male') {
    bmr = 10 * this.profile.weight + 6.25 * this.profile.height - 5 * this.profile.age + 5;
  } else {
    bmr = 10 * this.profile.weight + 6.25 * this.profile.height - 5 * this.profile.age - 161;
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const tdee = bmr * (activityMultipliers[this.profile.activityLevel] || 1.55);

  // Adjust for fitness goal: -300 to lose, +300 to gain, 0 to maintain
  let targetCalories = tdee;
  switch (this.profile.fitnessGoal) {
    case 'lose_weight':
      targetCalories = tdee - 300; // 300 calorie deficit
      break;
    case 'gain_muscle':
      targetCalories = tdee + 300; // 300 calorie surplus
      break;
    default:
      targetCalories = tdee; // maintain - no change
  }

  return Math.round(targetCalories);
};

module.exports = mongoose.model('User', userSchema);
