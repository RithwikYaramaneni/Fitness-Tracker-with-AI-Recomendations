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
    type: String, // Can be "8-12" or "10" or "30 seconds"
    required: true
  },
  restSeconds: {
    type: Number,
    default: 90
  },
  notes: String,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date
});

const dailyWorkoutSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  },
  goal: {
    type: String,
    required: true
  },
  exercises: [exerciseSchema],
  warmup: {
    type: String,
    default: '5-10 minutes of light cardio and dynamic stretching'
  },
  cooldown: {
    type: String,
    default: '5-10 minutes of static stretching and light cardio'
  },
  notes: String,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date
});

const workoutPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  weekNumber: {
    type: Number,
    default: 1
  },
  weeklyGoal: {
    type: String,
    required: true
  },
  dailyWorkouts: [dailyWorkoutSchema],
  motivation: {
    type: String,
    default: 'Stay consistent! Every workout counts toward your goal.'
  },
  // User profile snapshot when plan was generated
  generatedFor: {
    fitnessGoal: String,
    experienceLevel: String,
    workoutFrequency: Number,
    availableEquipment: [String]
  },
  adherenceRate: {
    type: Number,
    default: 0 // Percentage of workouts completed
  },
  aiGenerated: {
    type: Boolean,
    default: true
  },
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  }
});

// Index for finding active plans
workoutPlanSchema.index({ userId: 1, active: 1, createdAt: -1 });

// Method to calculate adherence rate
workoutPlanSchema.methods.calculateAdherence = function() {
  const totalWorkouts = this.dailyWorkouts.length;
  if (totalWorkouts === 0) return 0;
  
  const completedWorkouts = this.dailyWorkouts.filter(w => w.completed).length;
  this.adherenceRate = Math.round((completedWorkouts / totalWorkouts) * 100);
  return this.adherenceRate;
};

// Method to mark exercise as completed
workoutPlanSchema.methods.completeExercise = function(dayIndex, exerciseIndex) {
  if (this.dailyWorkouts[dayIndex] && this.dailyWorkouts[dayIndex].exercises[exerciseIndex]) {
    this.dailyWorkouts[dayIndex].exercises[exerciseIndex].completed = true;
    this.dailyWorkouts[dayIndex].exercises[exerciseIndex].completedAt = new Date();
    
    // Check if all exercises in the day are completed
    const allCompleted = this.dailyWorkouts[dayIndex].exercises.every(ex => ex.completed);
    if (allCompleted) {
      this.dailyWorkouts[dayIndex].completed = true;
      this.dailyWorkouts[dayIndex].completedAt = new Date();
    }
    
    this.calculateAdherence();
  }
};

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
