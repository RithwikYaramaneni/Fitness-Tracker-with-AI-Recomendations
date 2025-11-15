import React, { useState, useEffect, useContext } from 'react';
import { FaDumbbell, FaAppleAlt, FaChartLine, FaFire, FaBullseye } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { userAPI, workoutAPI, nutritionAPI, progressAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [metrics, setMetrics] = useState(null);
  const [workoutStats, setWorkoutStats] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [progressStats, setProgressStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, workoutsRes, nutritionRes, progressRes] = await Promise.all([
        userAPI.getMetrics(),
        workoutAPI.getStats({ period: 30 }),
        nutritionAPI.getDailySummary(),
        progressAPI.getStats({ period: 30 })
      ]);

      setMetrics(metricsRes.data.data);
      setWorkoutStats(workoutsRes.data.data);
      setNutritionSummary(nutritionRes.data.data);
      setProgressStats(progressRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}! 👋</h1>
        <p className="text-gray-600 mt-2">Here's your fitness overview for today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Daily Calories */}
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Today's Calories</p>
              <p className="text-3xl font-bold text-gray-900">
                {nutritionSummary?.totalCalories || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Goal: {metrics?.dailyCalories || 0} cal
              </p>
            </div>
            <FaAppleAlt className="text-4xl text-orange-500" />
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((nutritionSummary?.percentageOfGoal || 0), 100)}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* Workouts This Month */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Workouts (30d)</p>
              <p className="text-3xl font-bold text-gray-900">
                {workoutStats?.totalWorkouts || 0}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {workoutStats?.totalDuration || 0} min total
              </p>
            </div>
            <FaDumbbell className="text-4xl text-blue-500" />
          </div>
        </div>

        {/* Weight Progress */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Weight</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics?.currentWeight || 0} kg
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Target: {metrics?.targetWeight || metrics?.currentWeight || 0} kg
              </p>
            </div>
            <FaChartLine className="text-4xl text-green-500" />
          </div>
        </div>

        {/* BMI */}
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">BMI</p>
              <p className="text-3xl font-bold text-gray-900">
                {metrics?.bmi || '--'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {metrics?.bmiCategory || 'Not available'}
              </p>
            </div>
            <FaBullseye className="text-4xl text-purple-500" />
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Nutrition */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Nutrition</h2>
          {nutritionSummary && nutritionSummary.totalCalories > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Calories</span>
                <span className="font-semibold">{nutritionSummary.totalCalories} cal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Protein</span>
                <span className="font-semibold">{Math.round(nutritionSummary.totalProtein)}g</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Carbs</span>
                <span className="font-semibold">{Math.round(nutritionSummary.totalCarbs)}g</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fat</span>
                <span className="font-semibold">{Math.round(nutritionSummary.totalFat)}g</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-600">Meals logged</span>
                <span className="font-semibold">{nutritionSummary.mealCount}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No meals logged today</p>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Workout Summary</h2>
          {workoutStats && workoutStats.totalWorkouts > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Workouts</span>
                <span className="font-semibold">{workoutStats.totalWorkouts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Duration</span>
                <span className="font-semibold">{workoutStats.totalDuration} min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Calories Burned</span>
                <span className="font-semibold">{workoutStats.totalCalories} cal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Duration</span>
                <span className="font-semibold">{workoutStats.averageDuration} min</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-gray-600">Weekly Frequency</span>
                <span className="font-semibold">{workoutStats.weeklyFrequency}x/week</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No workouts logged yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => window.location.href = '/workouts'}
          className="card hover:shadow-lg transition-shadow text-center cursor-pointer"
        >
          <FaDumbbell className="text-4xl text-primary-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Log Workout</h3>
          <p className="text-sm text-gray-600 mt-1">Track your exercise</p>
        </button>

        <button
          onClick={() => window.location.href = '/nutrition'}
          className="card hover:shadow-lg transition-shadow text-center cursor-pointer"
        >
          <FaAppleAlt className="text-4xl text-green-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Log Meal</h3>
          <p className="text-sm text-gray-600 mt-1">Track your nutrition</p>
        </button>

        <button
          onClick={() => window.location.href = '/progress'}
          className="card hover:shadow-lg transition-shadow text-center cursor-pointer"
        >
          <FaChartLine className="text-4xl text-purple-600 mx-auto mb-2" />
          <h3 className="font-semibold text-gray-900">Update Progress</h3>
          <p className="text-sm text-gray-600 mt-1">Log your measurements</p>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
