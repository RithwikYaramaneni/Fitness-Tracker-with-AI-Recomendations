import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaDumbbell, FaRedo, FaCheck, FaTrophy, FaChartLine, FaArrowLeft } from 'react-icons/fa';
import api from '../services/api';

const AIWorkoutPlan = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    fetchActivePlan();
  }, []);

  const fetchActivePlan = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai/workout/active');
      if (response.data.success && response.data.data) {
        setPlan(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching plan:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError('');
      setMessage('');

      const response = await api.post('/ai/workout/generate');
      if (response.data.success) {
        setPlan(response.data.data);
        setMessage('✅ New workout plan generated successfully!');
        setExpandedDay(0); // Expand first day
      }
    } catch (err) {
      console.error('Error generating plan:', err);
      setError(err.response?.data?.message || 'Failed to generate workout plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCompleteExercise = async (dayIndex, exerciseIndex) => {
    try {
      const response = await api.post('/ai/workout/complete-exercise', {
        planId: plan.planId,
        dayIndex,
        exerciseIndex
      });

      if (response.data.success) {
        setPlan(prev => ({
          ...prev,
          dailyWorkouts: response.data.data.dailyWorkouts,
          adherenceRate: response.data.data.adherenceRate
        }));
      }
    } catch (err) {
      console.error('Error completing exercise:', err);
      setError('Failed to mark exercise as completed');
    }
  };

  const handleCompleteDay = async (dayIndex) => {
    try {
      const response = await api.post('/ai/workout/complete-day', {
        planId: plan.planId,
        dayIndex
      });

      if (response.data.success) {
        setPlan(prev => ({
          ...prev,
          dailyWorkouts: response.data.data.dailyWorkouts,
          adherenceRate: response.data.data.adherenceRate
        }));
        setMessage(`✅ ${plan.dailyWorkouts[dayIndex].day} workout completed!`);
      }
    } catch (err) {
      console.error('Error completing day:', err);
      setError('Failed to mark day as completed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/workouts')}
              className="btn btn-circle btn-ghost"
            >
              <FaArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FaDumbbell className="text-primary" />
              AI Workout Plans
            </h1>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn btn-primary"
          >
            {generating ? (
              <>
                <span className="loading loading-spinner"></span>
                Generating...
              </>
            ) : (
              <>
                <FaRedo />
                {plan ? 'Regenerate Plan' : 'Generate Plan'}
              </>
            )}
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="alert alert-success mb-4">
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        {!plan && !generating && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body text-center py-16">
              <FaDumbbell className="text-6xl text-primary mx-auto mb-4" />
              <h2 className="card-title text-2xl justify-center mb-2">
                No Active Workout Plan
              </h2>
              <p className="text-base-content/70 mb-6">
                Generate a personalized AI workout plan based on your profile, goals, and equipment
              </p>
              <button onClick={handleGenerate} className="btn btn-primary btn-wide mx-auto">
                Generate My Plan
              </button>
            </div>
          </div>
        )}

        {plan && (
          <>
            {/* Plan Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center gap-3">
                    <FaTrophy className="text-3xl text-warning" />
                    <div>
                      <p className="text-sm text-base-content/70">Weekly Goal</p>
                      <p className="font-bold">{plan.weeklyGoal}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center gap-3">
                    <FaChartLine className="text-3xl text-success" />
                    <div>
                      <p className="text-sm text-base-content/70">Adherence Rate</p>
                      <p className="font-bold text-2xl">{plan.adherenceRate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <div className="flex items-center gap-3">
                    <FaDumbbell className="text-3xl text-info" />
                    <div>
                      <p className="text-sm text-base-content/70">Workouts</p>
                      <p className="font-bold">
                        {plan.dailyWorkouts.filter(d => d.completed).length} / {plan.dailyWorkouts.length} days
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Motivation */}
            {plan.motivation && (
              <div className="alert alert-info mb-6">
                <div>
                  <p className="font-semibold">💪 Motivation</p>
                  <p>{plan.motivation}</p>
                </div>
              </div>
            )}

            {/* Daily Workouts */}
            <div className="space-y-4">
              {plan.dailyWorkouts.map((day, dayIndex) => (
                <div key={dayIndex} className="card bg-base-100 shadow-md">
                  <div className="card-body">
                    {/* Day Header */}
                    <div
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedDay(expandedDay === dayIndex ? null : dayIndex)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`badge ${day.completed ? 'badge-success' : 'badge-ghost'}`}>
                          {day.completed ? <FaCheck /> : dayIndex + 1}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            {day.day}
                            {day.completed && <FaCheck className="text-success" />}
                          </h3>
                          <p className="text-sm text-base-content/70">{day.goal}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!day.completed && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteDay(dayIndex);
                            }}
                            className="btn btn-success btn-sm"
                          >
                            <FaCheck /> Complete Day
                          </button>
                        )}
                        <button className="btn btn-circle btn-ghost btn-sm">
                          {expandedDay === dayIndex ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedDay === dayIndex && (
                      <div className="mt-4 space-y-4">
                        {/* Warm-up */}
                        <div className="bg-warning/10 p-3 rounded-lg">
                          <p className="font-semibold text-sm mb-1">🔥 Warm-up</p>
                          <p className="text-sm">{day.warmup}</p>
                        </div>

                        {/* Exercises */}
                        <div className="space-y-2">
                          {day.exercises.map((exercise, exIndex) => (
                            <div
                              key={exIndex}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                exercise.completed
                                  ? 'bg-success/10 border-success/30'
                                  : 'bg-base-200 border-base-300'
                              }`}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className="form-control">
                                  <input
                                    type="checkbox"
                                    checked={exercise.completed || false}
                                    onChange={() => handleCompleteExercise(dayIndex, exIndex)}
                                    className="checkbox checkbox-success"
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className={`font-semibold ${exercise.completed ? 'line-through text-base-content/50' : ''}`}>
                                    {exercise.name}
                                  </p>
                                  <p className="text-sm text-base-content/70">
                                    {exercise.sets} sets × {exercise.reps} reps
                                    {exercise.restSeconds && ` • Rest: ${exercise.restSeconds}s`}
                                  </p>
                                  {exercise.notes && (
                                    <p className="text-xs text-info mt-1">💡 {exercise.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Cool-down */}
                        <div className="bg-info/10 p-3 rounded-lg">
                          <p className="font-semibold text-sm mb-1">❄️ Cool-down</p>
                          <p className="text-sm">{day.cooldown}</p>
                        </div>

                        {/* Day Notes */}
                        {day.notes && (
                          <div className="bg-base-200 p-3 rounded-lg">
                            <p className="text-sm">
                              <span className="font-semibold">📝 Notes:</span> {day.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIWorkoutPlan;
