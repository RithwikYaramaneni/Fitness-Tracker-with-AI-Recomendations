const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  bodyFat: {
    type: Number // percentage
  },
  measurements: {
    chest: Number, // in cm
    waist: Number,
    hips: Number,
    arms: Number,
    thighs: Number
  },
  photos: [{
    url: String,
    type: {
      type: String,
      enum: ['front', 'side', 'back']
    }
  }],
  notes: String,
  mood: {
    type: String,
    enum: ['excellent', 'good', 'okay', 'poor']
  },
  energyLevel: {
    type: Number,
    min: 1,
    max: 10
  }
});

// Index for efficient date-based queries
progressSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Progress', progressSchema);
