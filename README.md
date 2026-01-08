# Social Fitness Tracker with AI Recommendations

A comprehensive MERN stack application that combines fitness tracking with social networking and AI-powered personalization. This platform enables users to track their fitness journey, receive intelligent workout plans tailored to their specific needs, and engage with a supportive community.

## Key Features

### AI-Powered Customization
-   **Personalized Workout Plans**: Utilizes the Google Gemini API to generate weekly workout routines. The system adapts to your specific experience level (Beginner, Intermediate, Advanced), available equipment, and primary fitness goals.
-   **Smart Progression**: Plans evolve as you track your progress, ensuring continuous improvement.

### Social Networking
-   **Community Feed**: Share workout achievements, photos, and status updates with your network.
-   **Interaction**: Follow friends, like posts, and comment to provide motivation and support.
-   **Media Integration**: Seamless image uploading and hosting via Cloudinary.

### Advanced Tracking & Analytics
-   **Workout Logging**: Record detailed exercise data including sets, reps, and weight load.
-   **Personal Records (PRs)**: Automatically tracks and updates your personal bests for every exercise.
-   **Nutrition Management**: Log daily meals to monitor calorie intake and macronutrient distribution (Protein, Carbs, Fats).
-   **Visual Analytics**: Interactive charts provided by Recharts visualize your weight trends, workout frequency, and strength progress over time.

### Gamification
-   **Streak System**: Maintains a daily streak counter to encourage consistency.
-   **Leaderboards**: Compare your consistency and progress with friends.

## Tech Stack

The application is built on a modern, robust technology stack ensuring performance and scalability.

-   **Frontend**: React.js, Tailwind CSS, Vite, Recharts, Framer Motion, Axios
-   **Backend**: Node.js, Express.js, MongoDB, Mongoose
-   **Authentication**: JSON Web Tokens (JWT) for secure stateless authentication
-   **AI Engine**: Google Gemini API
-   **Cloud Storage**: Cloudinary for optimized media management

## Project Structure

```
Fitness-Tracker/
├── backend/
│   ├── models/         # Database schemas (User, Workout, Nutrition, etc.)
│   ├── routes/         # API endpoints definitions
│   ├── middleware/     # Auth and error handling middleware
│   ├── utils/          # AI sevice and Cloudinary configuration
│   └── server.js       # Entry point and app configuration
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Main application views/routes
│   │   ├── services/   # API integration services
│   │   ├── context/    # Global state management (Auth)
│   │   └── App.jsx     # Main application layout
└── README.md
```

## Getting Started

### Prerequisites

Ensure you have the following installed and configured:
-   **Node.js** (v14 or higher)
-   **MongoDB** (Local instance or Atlas connection string)
-   **Cloudinary Account** (for media capabilities)
-   **Google Gemini API Key** (for AI features)

### Environment Configuration

Create a `.env` file in the `backend` directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=5001

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key
```

### Installation & Execution

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Ravenclawz1/Fitness-Tracker-with-AI-Recomendations.git
    cd Fitness-Tracker-with-AI-Recomendations
    ```

2.  **Install Dependencies**
    ```bash
    # Backend
    cd backend
    npm install

    # Frontend
    cd ../frontend
    npm install
    ```

3.  **Start the Application**
    Run the backend and frontend servers in separate terminal windows:

    **Backend:**
    ```bash
    cd backend
    npm start
    ```

    **Frontend:**
    ```bash
    cd frontend
    npm run dev
    ```

    The application will be accessible at `http://localhost:3000` (or the port specified by Vite).

## API Overview

The backend exposes a RESTful API for client interaction. Key resource endpoints include:

| Resource | Base Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | `/api/auth` | User registration and login |
| **Workouts** | `/api/workouts` | Log workouts and retrieve history |
| **AI Plans** | `/api/ai` | Generate and manage workout plans |
| **Social** | `/api/posts` | Create posts, feed, and interactions |
| **Friends** | `/api/friends` | Manage friend requests and connections |
| **PRs** | `/api/pr` | Track personal records |
| **Nutrition** | `/api/nutrition` | Log and retrieve nutrition data |

## Troubleshooting

-   **Images not loading**: Verify your Cloudinary credentials in the `.env` file.
-   **AI plans not generating**: Ensure your Gemini API quota is not exceeded and the key is valid.
-   **Connection Refused**: Confirm MongoDB is running and the `MONGODB_URI` is correct.
