import axios from 'axios';

// Prefer Vite env var if provided, otherwise use relative '/api' to work with Vite dev proxy
const API_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getMetrics: () => api.get('/user/metrics')
};

// Workout APIs
export const workoutAPI = {
  getWorkouts: (params) => api.get('/workouts', { params }),
  createWorkout: (data) => api.post('/workouts', data),
  updateWorkout: (id, data) => api.put(`/workouts/${id}`, data),
  deleteWorkout: (id) => api.delete(`/workouts/${id}`),
  getStats: (params) => api.get('/workouts/stats', { params }),
  getExerciseHistory: (exerciseName) => api.get(`/workouts/exercise-history/${encodeURIComponent(exerciseName)}`),
  getAllExercises: () => api.get('/workouts/all-exercises')
};

// Nutrition APIs
export const nutritionAPI = {
  getMeals: (params) => api.get('/nutrition', { params }),
  createMeal: (data) => api.post('/nutrition', data),
  updateMeal: (id, data) => api.put(`/nutrition/${id}`, data),
  deleteMeal: (id) => api.delete(`/nutrition/${id}`),
  getDailySummary: (params) => api.get('/nutrition/daily-summary', { params }),
  getStats: (params) => api.get('/nutrition/stats', { params })
};

// Progress APIs
export const progressAPI = {
  getProgress: (params) => api.get('/progress', { params }),
  createProgress: (data) => api.post('/progress', data),
  updateProgress: (id, data) => api.put(`/progress/${id}`, data),
  deleteProgress: (id) => api.delete(`/progress/${id}`),
  getStats: (params) => api.get('/progress/stats', { params }),
  getChartData: (params) => api.get('/progress/chart-data', { params }),
  createPR: (data) => api.post('/progress/pr', data),
  getPRs: (params) => api.get('/progress/pr', { params }),
  getPRChart: (params) => api.get('/progress/pr-chart', { params })
};

// PR APIs
export const prAPI = {
  addPR: (data) => api.post('/pr/add', data),
  getPRHistory: (exercise) => api.get(`/pr/${encodeURIComponent(exercise)}`),
  getAllPRs: () => api.get('/pr'),
  getStats: () => api.get('/pr/stats/summary'),
  deletePR: (exercise) => api.delete(`/pr/${encodeURIComponent(exercise)}`)
};

// Posts/Social Feed APIs
export const postsAPI = {
  createPost: (data) => api.post('/posts', data),
  getFeed: (params) => api.get('/posts/feed', { params }),
  getUserPosts: (userId, params) => api.get(`/posts/user/${userId}`, { params }),
  toggleLike: (postId) => api.put(`/posts/${postId}/like`),
  addComment: (postId, text) => api.post(`/posts/${postId}/comment`, { text }),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comment/${commentId}`)
};

// Streak APIs
export const streakAPI = {
  getStreak: () => api.get('/streak'),
  updateStreak: () => api.post('/streak/update'),
  getLeaderboard: (params) => api.get('/streak/leaderboard', { params })
};

// Friends APIs
export const friendsAPI = {
  sendRequest: (friendId) => api.post('/friends/request', { friendId }),
  getRequests: () => api.get('/friends/requests'),
  acceptRequest: (requestId) => api.put(`/friends/request/${requestId}/accept`),
  rejectRequest: (requestId) => api.put(`/friends/request/${requestId}/reject`),
  getFriends: () => api.get('/friends'),
  removeFriend: (friendId) => api.delete(`/friends/${friendId}`),
  searchUsers: (query) => api.get('/friends/search', { params: { query } })
};

// AI Food APIs
export const aiAPI = {
  generateFood: (prefs) => api.post('/ai/food', prefs),
  saveFood: (meal) => api.post('/ai/food/save', meal)
};

export default api;
