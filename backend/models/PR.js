const mongoose = require('mongoose');

const prHistorySchema = new mongoose.Schema({
  weight: {
    type: Number,
    required: true
  },
  reps: {
    type: Number,
    default: 1
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: String
});

const prSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exercise: {
    type: String,
    required: true,
    trim: true
  },
  muscleGroup: {
    type: String,
    enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'full_body', 'other']
  },
  prHistory: [prHistorySchema],
  currentPR: {
    weight: Number,
    reps: Number,
    date: Date
  },
  unit: {
    type: String,
    default: 'kg',
    enum: ['kg', 'lbs']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
prSchema.index({ userId: 1, exercise: 1 });
prSchema.index({ userId: 1 });

// Method to update PR and history
prSchema.methods.addPREntry = function(weight, reps = 1, notes = '') {
  this.prHistory.push({ weight, reps, notes, date: new Date() });
  
  // Sort history by date
  this.prHistory.sort((a, b) => b.date - a.date);
  
  // Update current PR if this is the highest weight
  if (!this.currentPR || weight > this.currentPR.weight) {
    this.currentPR = {
      weight,
      reps,
      date: new Date()
    };
  }
};

module.exports = mongoose.model('PR', prSchema);
