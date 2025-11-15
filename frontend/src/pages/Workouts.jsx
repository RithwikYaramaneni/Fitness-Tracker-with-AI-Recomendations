import React, { useState, useEffect } from 'react';
import { FaDumbbell, FaPlus, FaTrash, FaCheck, FaHistory, FaChartLine, FaRobot, FaTrophy } from 'react-icons/fa';
import { workoutAPI } from '../services/api';
import api from '../services/api';
import { format } from 'date-fns';

const Workouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exerciseHistory, setExerciseHistory] = useState({}); // Store history for each exercise
  const [showAIPlan, setShowAIPlan] = useState(false);
  const [aiPlan, setAIPlan] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [expandedDay, setExpandedDay] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'strength',
    duration: 45,
    difficulty: 'intermediate',
    exercises: [],
    notes: ''
  });

  useEffect(() => {
    fetchWorkouts();
    fetchActivePlan();
  }, []);

  const fetchActivePlan = async () => {
    try {
      const response = await api.get('/ai/workout/active');
      if (response.data.success && response.data.data) {
        setAIPlan(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching AI plan:', err);
    }
  };

  const handleGenerateAIPlan = async () => {
    try {
      setGeneratingPlan(true);
      const response = await api.post('/ai/workout/generate');
      if (response.data.success) {
        setAIPlan(response.data.data);
        setShowAIPlan(true);
        setExpandedDay(0);
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      alert(err.response?.data?.message || 'Failed to generate workout plan. Please complete your profile first.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleCompleteExercise = async (dayIndex, exerciseIndex) => {
    try {
      const response = await api.post('/ai/workout/complete-exercise', {
        planId: aiPlan.planId,
        dayIndex,
        exerciseIndex
      });

      if (response.data.success) {
        setAIPlan(prev => ({
          ...prev,
          dailyWorkouts: response.data.data.dailyWorkouts,
          adherenceRate: response.data.data.adherenceRate
        }));
      }
    } catch (err) {
      console.error('Error completing exercise:', err);
    }
  };

  const handleCompleteDay = async (dayIndex) => {
    try {
      const response = await api.post('/ai/workout/complete-day', {
        planId: aiPlan.planId,
        dayIndex
      });

      if (response.data.success) {
        setAIPlan(prev => ({
          ...prev,
          dailyWorkouts: response.data.data.dailyWorkouts,
          adherenceRate: response.data.data.adherenceRate
        }));
      }
    } catch (err) {
      console.error('Error completing day:', err);
    }
  };

  const fetchWorkouts = async () => {
    try {
      const response = await workoutAPI.getWorkouts({ limit: 20 });
      if (response.data.success) {
        setWorkouts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        { name: '', sets: 3, reps: 12, duration: null, weight: null }
      ]
    }));
  };

  const handleExerciseChange = async (index, field, value) => {
    setFormData(prev => {
      const newExercises = [...prev.exercises];
      newExercises[index] = { ...newExercises[index], [field]: value };
      return { ...prev, exercises: newExercises };
    });

    // Fetch exercise history when user types exercise name (after 2+ characters)
    if (field === 'name' && value && value.length >= 2) {
      try {
        const response = await workoutAPI.getExerciseHistory(value);
        if (response.data.success && response.data.data.history.length > 0) {
          setExerciseHistory(prev => ({
            ...prev,
            [index]: response.data.data
          }));
        } else {
          // Clear history if no results
          setExerciseHistory(prev => {
            const newHistory = { ...prev };
            delete newHistory[index];
            return newHistory;
          });
        }
      } catch (error) {
        console.error('Error fetching exercise history:', error);
      }
    }
  };

  const handleRemoveExercise = (index) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await workoutAPI.createWorkout(formData);
      if (response.data.success) {
        setShowModal(false);
        fetchWorkouts();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating workout:', error);
      alert('Failed to log workout. Please try again.');
    }
  };

  const handleCompleteWorkout = async (id) => {
    try {
      await workoutAPI.updateWorkout(id, { completed: true });
      fetchWorkouts();
    } catch (error) {
      console.error('Error completing workout:', error);
    }
  };

  const handleDeleteWorkout = async (id) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      try {
        await workoutAPI.deleteWorkout(id);
        fetchWorkouts();
      } catch (error) {
        console.error('Error deleting workout:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'strength',
      duration: 45,
      difficulty: 'intermediate',
      exercises: [],
      notes: ''
    });
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FaDumbbell className="mr-3 text-primary-600" />
            Workouts
          </h1>
          <p className="text-gray-600 mt-2">Track and manage your workouts</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAIPlan(!showAIPlan)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <FaRobot className="mr-2" />
            {showAIPlan ? 'Hide' : 'Show'} AI Plan
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <FaPlus className="mr-2" />
            Log Workout
          </button>
        </div>
      </div>

      {/* AI Workout Plan Section */}
      {showAIPlan && (
        <div className="mb-8">
          {!aiPlan ? (
            <div className="card text-center py-12">
              <FaRobot className="text-6xl text-purple-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate AI Workout Plan</h2>
              <p className="text-gray-600 mb-6">
                Get a personalized workout plan based on your profile, goals, and equipment
              </p>
              <button
                onClick={handleGenerateAIPlan}
                disabled={generatingPlan}
                className="btn-primary mx-auto"
              >
                {generatingPlan ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⚙️</span>
                    Generating...
                  </>
                ) : (
                  <>
                    <FaRobot className="mr-2 inline" />
                    Generate My Plan
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Plan Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card">
                  <div className="flex items-center gap-3">
                    <FaTrophy className="text-3xl text-warning" />
                    <div>
                      <p className="text-sm text-gray-600">Weekly Goal</p>
                      <p className="font-bold text-gray-900">{aiPlan.weeklyGoal}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center gap-3">
                    <FaChartLine className="text-3xl text-green-500" />
                    <div>
                      <p className="text-sm text-gray-600">Adherence Rate</p>
                      <p className="font-bold text-2xl text-gray-900">{aiPlan.adherenceRate}%</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center gap-3">
                    <FaDumbbell className="text-3xl text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-600">Progress</p>
                      <p className="font-bold text-gray-900">
                        {aiPlan.dailyWorkouts.filter(d => d.completed).length} / {aiPlan.dailyWorkouts.length} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Regenerate Button */}
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">💪 {aiPlan.motivation}</p>
                <button
                  onClick={handleGenerateAIPlan}
                  disabled={generatingPlan}
                  className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
                >
                  <FaRobot className="mr-1" />
                  {generatingPlan ? 'Regenerating...' : 'Regenerate Plan'}
                </button>
              </div>

              {/* Daily Workouts */}
              <div className="space-y-3">
                {aiPlan.dailyWorkouts.map((day, dayIndex) => (
                  <div key={dayIndex} className="card">
                    {/* Day Header */}
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedDay(expandedDay === dayIndex ? null : dayIndex)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${day.completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {day.completed ? <FaCheck /> : dayIndex + 1}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{day.day}</h3>
                          <p className="text-sm text-gray-600">{day.goal}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!day.completed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteDay(dayIndex);
                            }}
                            className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 text-sm flex items-center"
                          >
                            <FaCheck className="mr-1" /> Complete
                          </button>
                        )}
                        <button className="text-gray-500">
                          {expandedDay === dayIndex ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedDay === dayIndex && (
                      <div className="mt-4 space-y-3 border-t pt-4">
                        {/* Warm-up */}
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <p className="font-semibold text-sm text-orange-800 mb-1">🔥 Warm-up</p>
                          <p className="text-sm text-orange-700">{day.warmup}</p>
                        </div>

                        {/* Exercises */}
                        <div className="space-y-2">
                          {day.exercises.map((exercise, exIndex) => (
                            <div
                              key={exIndex}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                exercise.completed
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={exercise.completed || false}
                                  onChange={() => handleCompleteExercise(dayIndex, exIndex)}
                                  className="w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                />
                                <div className="flex-1">
                                  <p className={`font-semibold ${exercise.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    {exercise.name}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {exercise.sets} sets × {exercise.reps} reps
                                    {exercise.restSeconds && ` • Rest: ${exercise.restSeconds}s`}
                                  </p>
                                  {exercise.notes && (
                                    <p className="text-xs text-blue-600 mt-1">💡 {exercise.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Cool-down */}
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                          <p className="font-semibold text-sm text-blue-800 mb-1">❄️ Cool-down</p>
                          <p className="text-sm text-blue-700">{day.cooldown}</p>
                        </div>

                        {/* Day Notes */}
                        {day.notes && (
                          <div className="bg-gray-100 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">
                              <span className="font-semibold">📝 Notes:</span> {day.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Workouts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.length === 0 ? (
          <div className="col-span-full text-center py-12 card">
            <FaDumbbell className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No workouts yet. Start by logging your first workout!</p>
          </div>
        ) : (
          workouts.map(workout => (
            <div key={workout._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{workout.name}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(workout.date), 'MMM d, yyyy')}
                  </p>
                </div>
                {workout.completed && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                    Completed
                  </span>
                )}
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{workout.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{workout.duration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Difficulty:</span>
                  <span className="font-medium capitalize">{workout.difficulty}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Exercises:</span>
                  <span className="font-medium">{workout.exercises?.length || 0}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                {!workout.completed && (
                  <button
                    onClick={() => handleCompleteWorkout(workout._id)}
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors text-sm flex items-center justify-center"
                  >
                    <FaCheck className="mr-1" />
                    Complete
                  </button>
                )}
                <button
                  onClick={() => handleDeleteWorkout(workout._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Workout Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Log Workout</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Workout Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="input-field"
                    >
                      <option value="strength">Strength</option>
                      <option value="cardio">Cardio</option>
                      <option value="yoga">Yoga</option>
                      <option value="hiit">HIIT</option>
                      <option value="pilates">Pilates</option>
                      <option value="sports">Sports</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                      className="input-field"
                      min="5"
                      max="300"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                      className="input-field"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field"
                    rows="3"
                  ></textarea>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="label mb-0">Exercises</label>
                    <button
                      type="button"
                      onClick={handleAddExercise}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      <FaPlus className="mr-1" />
                      Add Exercise
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {formData.exercises.map((exercise, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start mb-2">
                          <input
                            type="text"
                            placeholder="Exercise name (e.g., Bench Press, Squats)"
                            value={exercise.name}
                            onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                            className="input-field text-sm flex-1"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <FaTrash />
                          </button>
                        </div>

                        {/* Show previous workout data if available */}
                        {exerciseHistory[index]?.lastCompleted && (
                          <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                            <div className="flex items-center text-blue-700 font-medium mb-1">
                              <FaHistory className="mr-1" />
                              Last time ({format(new Date(exerciseHistory[index].lastCompleted.date), 'MMM d')})
                            </div>
                            <div className="text-blue-600">
                              {exerciseHistory[index].lastCompleted.sets} sets × {exerciseHistory[index].lastCompleted.reps} reps
                              {exerciseHistory[index].lastCompleted.weight && (
                                <span> @ {exerciseHistory[index].lastCompleted.weight}kg</span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <input
                              type="number"
                              placeholder="Sets"
                              value={exercise.sets || ''}
                              onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                              className="input-field text-sm"
                              min="1"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Reps"
                              value={exercise.reps || ''}
                              onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))}
                              className="input-field text-sm"
                              min="1"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              step="0.5"
                              placeholder="Weight (kg)"
                              value={exercise.weight || ''}
                              onChange={(e) => handleExerciseChange(index, 'weight', parseFloat(e.target.value))}
                              className="input-field text-sm"
                              min="0"
                            />
                          </div>
                        </div>

                        {/* Show exercise history timeline */}
                        {exerciseHistory[index]?.history && exerciseHistory[index].history.length > 1 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <div className="text-xs text-gray-600 font-medium mb-1 flex items-center">
                              <FaChartLine className="mr-1" />
                              Recent Progress
                            </div>
                            <div className="space-y-1">
                              {exerciseHistory[index].history.slice(0, 3).map((entry, i) => (
                                <div key={i} className="text-xs text-gray-500 flex justify-between">
                                  <span>{format(new Date(entry.date), 'MMM d')}</span>
                                  <span>
                                    {entry.sets}×{entry.reps}
                                    {entry.weight && ` @ ${entry.weight}kg`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    Save Workout
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Workouts;
