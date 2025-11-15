# 🏋️‍♀️ Social Fitness Tracker with AI Recommendations````markdown

# Fitness and Nutrition Companion

> **Built with the assistance of AI** - This project was developed with AI-powered coding assistance to accelerate development and implement best practices.

A comprehensive web application for tracking fitness and nutrition.

A comprehensive MERN stack fitness application featuring social networking, AI-powered workout plans, personal record tracking, streak monitoring, and nutrition management. Track your fitness journey, connect with friends, and get personalized AI workout recommendations!

## Features

[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=flat)](https://expressjs.com/)- 📊 **Progress Tracking**: Visual analytics of your fitness journey

[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)- 🥗 **Nutrition Tracking**: Calorie and macro tracking

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)- 💪 **Workout Logging**: Track exercises with sets, reps, and weights

[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)- 🎯 **Goal Setting**: Set and track fitness goals

- 📱 **Responsive Design**: Works on all devices

---- 🔐 **Secure Authentication**: User accounts with JWT



## ✨ Key Features## Tech Stack



### 🤖 AI-Powered Workout Plans (Gemini API)### Frontend

- Generate personalized weekly workout plans based on your profile- React.js

- Adapts to experience level, available equipment, and fitness goals- Tailwind CSS

- Includes warm-up/cool-down routines and exercise notes- Chart.js for visualizations

- Track adherence rate and completion status- Axios for API calls

- Smart progression based on workout history and PRs

### Backend

### 🏆 Personal Record (PR) Tracking- Node.js

- Log and track PRs for any exercise- Express.js

- Interactive charts showing progress over time (Recharts)- MongoDB with Mongoose

- Automatic current PR calculation- JWT for authentication

- Full history tracking with dates and notes

- Delete/manage exercises## Getting Started



### 📱 Social Feed with Image Sharing### Prerequisites

- Share workout posts with images (Cloudinary integration)- Node.js (v14 or higher)

- Like and comment on friends' posts- MongoDB

- Workout type tags and captions

- View friends-only feed### Installation

- Mobile-responsive image gallery

1. Clone the repository

### 🔥 Workout Streak System```bash

- Automatic streak tracking on workout logginggit clone <repository-url>

- Current streak and longest streak displaycd "Web_Tech project"

- Fire and trophy badges```

- Motivation based on consistency

- Leaderboard (API ready)2. Install all dependencies

```bash

### 👥 Friends Systemnpm run install-all

- Search users by name or email```

- Send/receive friend requests

- Accept/reject requests with notifications3. Set up environment variables

- View friends list```bash

- Remove friends functionality# In backend folder, create .env file

cp backend/.env.example backend/.env

### 📊 Progress & Nutrition Tracking# Add your MongoDB URI

- Visual analytics of fitness journey```

- Calorie and macro tracking

- Weight progress monitoring4. Run the application

- Goal setting and tracking```bash

- Exercise history with sets, reps, weights# Start both servers

npm start

### 🎯 User Profile Management```

- Experience level selection (beginner/intermediate/advanced)

- Fitness goals (weight loss, muscle gain, maintenance)## Project Structure

- Equipment availability tracking

- Workout frequency preferences```

- Personalized calorie and macro goals├── backend/

│   ├── models/          # MongoDB models

---│   ├── routes/          # API routes

│   ├── middleware/      # Custom middleware

## 🚀 Quick Start│   └── server.js        # Entry point

├── frontend/

### Prerequisites│   └── src/

- **Node.js** (v14 or higher)│       ├── components/  # React components

- **MongoDB** (local or Atlas)│       ├── pages/       # Page components

- **Cloudinary Account** (free tier for image uploads)│       ├── services/    # API services

- **Gemini API Key** (free tier for AI workout plans)│       └── App.jsx      # Main app component

└── README.md

### Installation```



1. **Clone the repository**## API Endpoints

```bash

git clone https://github.com/Ravenclawz1/Fitness-Tracker-with-AI-Recomendations.git### Authentication

cd Fitness-Tracker-with-AI-Recomendations- POST `/api/auth/register` - Register new user

```- POST `/api/auth/login` - Login user



2. **Install backend dependencies**### User Profile

```bash- GET `/api/user/profile` - Get user profile

cd backend- PUT `/api/user/profile` - Update profile

npm install

```### Workouts

- GET `/api/workouts` - Get user workouts

3. **Install frontend dependencies**- POST `/api/workouts` - Log workout

```bash- GET `/api/workouts/exercise-history/:name` - Get exercise history

cd ../frontend

npm install### Nutrition

```- GET `/api/nutrition` - Get meal logs

- POST `/api/nutrition` - Log meal

4. **Configure environment variables**

### Progress

Create `backend/.env`:- GET `/api/progress` - Get progress data

```bash- POST `/api/progress` - Log progress

# Database

MONGODB_URI=your_mongodb_connection_string## License



# AuthenticationMIT

JWT_SECRET=your_jwt_secret_key
PORT=5001

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Gemini AI (for workout plans)
GEMINI_API_KEY=your_gemini_api_key
```

**Get Cloudinary credentials:** [https://cloudinary.com](https://cloudinary.com) → Dashboard → Copy credentials

**Get Gemini API key:** [https://ai.google.dev](https://ai.google.dev) → Get API Key

5. **Start the application**

```bash
# Terminal 1 - Start backend (from backend folder)
cd backend
npm start

# Terminal 2 - Start frontend (from frontend folder)
cd frontend
npm run dev
```

6. **Access the app**
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001

---

## 📁 Project Structure

```
Fitness-Tracker-with-AI-Recomendations/
├── backend/
│   ├── models/
│   │   ├── User.js              # User schema with friends, streak
│   │   ├── Workout.js           # Workout logging
│   │   ├── WorkoutPlan.js       # AI-generated plans
│   │   ├── PR.js                # Personal records
│   │   ├── Post.js              # Social posts
│   │   ├── Nutrition.js         # Meal tracking
│   │   └── Progress.js          # Progress tracking
│   ├── routes/
│   │   ├── auth.js              # Authentication
│   │   ├── aiWorkout.js         # AI workout generation
│   │   ├── workout.js           # Workout logging
│   │   ├── pr.js                # PR tracking
│   │   ├── posts.js             # Social feed
│   │   ├── friends.js           # Friend management
│   │   ├── streak.js            # Streak tracking
│   │   ├── nutrition.js         # Nutrition logging
│   │   ├── progress.js          # Progress tracking
│   │   ├── user.js              # User profile
│   │   └── upload.js            # Cloudinary upload
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── utils/
│   │   ├── aiService.js         # Gemini AI integration
│   │   └── cloudinary.js        # Cloudinary config
│   └── server.js                # Express server
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Navbar.jsx       # Navigation bar
│       │   └── StreakBadge.jsx  # Streak display
│       ├── pages/
│       │   ├── Dashboard.jsx    # Main dashboard
│       │   ├── AIWorkoutPlan.jsx # AI workout plans
│       │   ├── Workouts.jsx     # Workout logging
│       │   ├── PRTracking.jsx   # PR tracking
│       │   ├── SocialFeed.jsx   # Social posts
│       │   ├── Friends.jsx      # Friend management
│       │   ├── Profile.jsx      # User profile
│       │   ├── Nutrition.jsx    # Nutrition tracking
│       │   ├── Progress.jsx     # Progress charts
│       │   ├── Login.jsx        # Login page
│       │   └── Register.jsx     # Registration
│       ├── services/
│       │   └── api.js           # API service layer
│       ├── context/
│       │   └── AuthContext.js   # Auth state management
│       ├── App.jsx              # Main app component
│       └── main.jsx             # Entry point
└── README.md
```

---

## 🎯 How to Use

### 1️⃣ Complete Your Profile
- Navigate to **Profile** page
- Fill in: age, gender, weight, height, fitness goal
- Select experience level (beginner/intermediate/advanced)
- Choose available equipment
- Set workout frequency preference

### 2️⃣ Generate AI Workout Plan
- Go to **AI Plans** in navbar
- Click **"Generate Plan"** button
- AI creates personalized weekly workout plan
- Follow daily workouts with exercises, sets, reps
- Check off exercises as you complete them
- Track adherence rate

### 3️⃣ Log Workouts & Build Streaks
- Navigate to **Workouts** page
- Log exercises with sets, reps, weights
- **Streak automatically updates** on consecutive days
- View streak badge in Profile

### 4️⃣ Track Personal Records
- Go to **PR Tracking** page
- Add PRs for any exercise
- View interactive progress charts
- Click on PR cards to see full history

### 5️⃣ Connect with Friends
- Navigate to **Friends** page
- **Find Friends:** Search by name/email
- **Send Requests:** Add friends
- **Manage Requests:** Accept/reject incoming requests
- **View Friends List:** See all connections

### 6️⃣ Share on Social Feed
- Go to **Social** page
- Create posts with images, captions, workout types
- Like and comment on friends' posts
- View friends-only feed

### 7️⃣ Track Nutrition & Progress
- **Nutrition:** Log meals, track calories and macros
- **Progress:** Monitor weight changes and analytics

---

## 🔧 API Reference

### Authentication
```
POST   /api/auth/register          - Register new user
POST   /api/auth/login             - Login user
```

### AI Workout Plans
```
POST   /api/ai/workout/generate           - Generate AI workout plan
GET    /api/ai/workout/active             - Get active plan
POST   /api/ai/workout/complete-exercise  - Mark exercise complete
POST   /api/ai/workout/complete-day       - Mark day complete
DELETE /api/ai/workout/:planId            - Delete plan
```

### PR Tracking
```
POST   /api/pr/add                 - Add/update PR
GET    /api/pr/:exercise           - Get PR history
GET    /api/pr                     - Get all PRs
GET    /api/pr/stats/summary       - Get PR stats
DELETE /api/pr/:exercise           - Delete PR
```

### Social Feed
```
POST   /api/posts                  - Create post
GET    /api/posts/feed             - Get friends' feed
GET    /api/posts/user/:userId     - Get user posts
PUT    /api/posts/:id/like         - Toggle like
POST   /api/posts/:id/comment      - Add comment
DELETE /api/posts/:id              - Delete post
DELETE /api/posts/:postId/comment/:commentId - Delete comment
```

### Friends System
```
POST   /api/friends/request        - Send friend request
GET    /api/friends/requests       - Get pending requests
PUT    /api/friends/request/:id/accept - Accept request
PUT    /api/friends/request/:id/reject - Reject request
GET    /api/friends                - Get friends list
DELETE /api/friends/:friendId      - Remove friend
GET    /api/friends/search?q=      - Search users
```

### Streak Tracking
```
GET    /api/streak                 - Get current streak
POST   /api/streak/update          - Manual streak update
GET    /api/streak/leaderboard     - Get leaderboard
```

### Workouts
```
GET    /api/workout                - Get user workouts
POST   /api/workout                - Log workout (auto-updates streak)
GET    /api/workout/exercise-history/:name - Get exercise history
```

### Nutrition
```
GET    /api/nutrition              - Get meal logs
POST   /api/nutrition              - Log meal
```

### Progress
```
GET    /api/progress               - Get progress data
POST   /api/progress               - Log progress
```

### User Profile
```
GET    /api/user/profile           - Get user profile
PUT    /api/user/profile           - Update profile
```

### Image Upload
```
POST   /api/upload                 - Upload image to Cloudinary
```

---

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization for PR tracking
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Icons** - Icon library
- **date-fns** - Date formatting

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Cloudinary** - Image hosting
- **Multer** - File upload middleware
- **Google Gemini AI** - Workout plan generation

---

## 📸 Screenshots

*(Add screenshots here of key features like AI Workout Plans, PR Tracking charts, Social Feed, Friends page, etc.)*

---

## 🐛 Troubleshooting

### Cloudinary Images Not Loading
- Verify `.env` credentials are correct
- Ensure all three variables are set: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Restart backend server after updating `.env`

### Streak Not Updating
- Ensure workouts are logged via **Workouts** page
- Workout must have valid date
- Streak updates automatically on `POST /api/workout`

### AI Workout Plans Not Generating
- Check `GEMINI_API_KEY` is valid in `.env`
- Verify API quota hasn't been exceeded
- Falls back to local generator if API fails

### Friend Requests Not Working
- Ensure both users are registered
- Check MongoDB connection is active
- Search by exact email for best results

### Charts Not Displaying
- Ensure `recharts` is installed: `npm install recharts`
- PR needs at least 2 data points for line chart
- Check browser console for errors

---

## 🚀 Future Enhancements

- [ ] Weekly progression in AI workout plans
- [ ] Exercise video demonstrations
- [ ] Alternative exercise suggestions
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Integration with fitness wearables
- [ ] Community workout templates
- [ ] Meal planning with AI
- [ ] Export data to CSV/PDF
- [ ] Dark mode toggle

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- **AI Development Assistance** - This project was built with the help of AI-powered coding assistants, which accelerated development, improved code quality, and helped implement best practices.
- **Google Gemini AI** - For powering personalized workout recommendations
- **Cloudinary** - For reliable image hosting and optimization
- **MongoDB Atlas** - For database hosting
- **React & Tailwind Communities** - For excellent documentation and resources

---

## 📞 Support

If you encounter issues:
1. Check browser console for frontend errors
2. Check backend terminal for API errors
3. Verify MongoDB connection is active
4. Ensure all dependencies are installed
5. Clear browser cache and restart servers

---

**Happy Training! 💪🏋️‍♀️**

Made with ❤️ and 🤖 AI assistance
