const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const workoutRoutes = require('./routes/workout');
const nutritionRoutes = require('./routes/nutrition');
const progressRoutes = require('./routes/progress');
const prRoutes = require('./routes/pr');
const postsRoutes = require('./routes/posts');
const streakRoutes = require('./routes/streak');
const friendsRoutes = require('./routes/friends');
const uploadRoutes = require('./routes/upload');
const aiFoodRoutes = require('./routes/aiFood');
const aiWorkoutRoutes = require('./routes/aiWorkout');

// Initialize Express app
const app = express();

const normalizeOrigin = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    return new URL(value.trim()).origin;
  } catch (error) {
    return value.trim().replace(/\/$/, '');
  }
};

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  ...(process.env.FRONTEND_URLS ? process.env.FRONTEND_URLS.split(',') : []),
  process.env.FRONTEND_URL
].map(normalizeOrigin).filter(Boolean);

const isAllowedOrigin = (origin) => {
  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) {
    return true;
  }

  if (allowedOrigins.includes(normalizedOrigin)) {
    return true;
  }

  return normalizedOrigin.endsWith('.vercel.app');
};

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps, curl) or if origin is in the whitelist
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
// Explicitly enable preflight across-the-board
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/pr', prRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/streak', streakRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiFoodRoutes);
app.use('/api/ai/workout', aiWorkoutRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Database connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitness-nutrition';

let mongoConnectionPromise;

const connectToMongo = () => {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve();
  }

  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(MONGODB_URI)
      .then(() => {
        console.log('✅ Connected to MongoDB');
      })
      .catch((error) => {
        mongoConnectionPromise = undefined;
        throw error;
      });
  }

  return mongoConnectionPromise;
};

const startServer = async () => {
  try {
    await connectToMongo();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
} else {
  connectToMongo().catch((error) => {
    console.error('❌ MongoDB connection error:', error);
  });
}

module.exports = app;
