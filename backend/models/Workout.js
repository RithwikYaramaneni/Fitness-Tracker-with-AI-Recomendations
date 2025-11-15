const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sets: {
    type: Number,
    required: true
  },
  reps: {
    type: Number
  },
  duration: {
    type: Number // in seconds
  },
  weight: {
    type: Number // in kg
  },
  notes: String,
  completed: {
    type: Boolean,
    default: false
  }
});

const workoutSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['strength', 'cardio', 'yoga', 'hiit', 'pilates', 'sports', 'custom'],
    required: true
  },
  exercises: [exerciseSchema],
  duration: {
    type: Number, // total duration in minutes
    required: true
  },
  caloriesBurned: {
    type: Number
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  date: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  notes: String,
  aiGenerated: {
    type: Boolean,
    default: false
  }
});

// Calculate estimated calories burned
workoutSchema.methods.estimateCalories = function(userWeight) {
  const metValues = {
    strength: 6,
    cardio: 8,
    yoga: 3,
    hiit: 10,
    pilates: 4,
    sports: 7,
    custom: 5
  };

  const met = metValues[this.type] || 5;
  const hours = this.duration / 60;
  return Math.round(met * userWeight * hours);
};

module.exports = mongoose.model('Workout', workoutSchema);
