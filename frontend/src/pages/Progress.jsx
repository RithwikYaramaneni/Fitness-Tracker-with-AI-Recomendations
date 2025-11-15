import React, { useState, useEffect } from 'react';
import { FaChartLine, FaPlus, FaTrash, FaDumbbell, FaTrophy, FaWeight } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { progressAPI, workoutAPI } from '../services/api';
import { format } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Progress = () => {
  const [progressEntries, setProgressEntries] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  // Exercise progress states
  const [allExercises, setAllExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('exercises'); // 'exercises', 'body'
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    measurements: {
      chest: '',
      waist: '',
      hips: '',
      arms: '',
      thighs: ''
    },
    mood: '',
    energyLevel: '',
    notes: ''
  });

  useEffect(() => {
    fetchProgressData();
    fetchAllExercises();
  }, []);

  const fetchProgressData = async () => {
    try {
      const [entriesRes, chartRes, statsRes] = await Promise.all([
        progressAPI.getProgress({ limit: 10 }),
        progressAPI.getChartData({ period: 90, metric: 'weight' }),
        progressAPI.getStats({ period: 90 })
      ]);

      if (entriesRes.data.success) {
        setProgressEntries(entriesRes.data.data);
      }
      if (chartRes.data.success) {
        setChartData(chartRes.data.data);
      }
      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllExercises = async () => {
    try {
      const response = await workoutAPI.getAllExercises();
      if (response.data.success) {
        setAllExercises(response.data.data);
        // Auto-select first exercise if available
        if (response.data.data.length > 0) {
          fetchExerciseHistory(response.data.data[0].name);
        }
      }
    } catch (error) {
      console.error('Error fetching exercises:', error);
    }
  };

  const fetchExerciseHistory = async (exerciseName) => {
    try {
      setSelectedExercise(exerciseName);
      const response = await workoutAPI.getExerciseHistory(exerciseName);
      if (response.data.success) {
        setExerciseHistory(response.data.data.history);
      }
    } catch (error) {
      console.error('Error fetching exercise history:', error);
      setExerciseHistory([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Filter out empty measurements
    const cleanedMeasurements = Object.entries(formData.measurements).reduce((acc, [key, value]) => {
      if (value !== '') {
        acc[key] = parseFloat(value);
      }
      return acc;
    }, {});

    const dataToSubmit = {
      weight: parseFloat(formData.weight),
      bodyFat: formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
      measurements: Object.keys(cleanedMeasurements).length > 0 ? cleanedMeasurements : undefined,
      mood: formData.mood || undefined,
      energyLevel: formData.energyLevel ? parseInt(formData.energyLevel) : undefined,
      notes: formData.notes || undefined
    };

    try {
      const response = await progressAPI.createProgress(dataToSubmit);
      if (response.data.success) {
        setShowModal(false);
        fetchProgressData();
        resetForm();
      }
    } catch (error) {
      console.error('Error creating progress entry:', error);
      alert('Failed to log progress. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this progress entry?')) {
      try {
        await progressAPI.deleteProgress(id);
        fetchProgressData();
      } catch (error) {
        console.error('Error deleting progress:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      weight: '',
      bodyFat: '',
      measurements: {
        chest: '',
        waist: '',
        hips: '',
        arms: '',
        thighs: ''
      },
      mood: '',
      energyLevel: '',
      notes: ''
    });
  };

  const weightChartData = {
    labels: chartData.map(entry => format(new Date(entry.date), 'MMM d')),
    datasets: [
      {
        label: 'Weight (kg)',
        data: chartData.map(entry => entry.value),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Weight Progress (Last 90 Days)'
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FaChartLine className="mr-3 text-purple-600" />
            Progress
          </h1>
          <p className="text-gray-600 mt-2">Track your fitness journey</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Log Progress
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('exercises')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'exercises'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaDumbbell className="mr-2" />
            Exercise Progress
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'body'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaWeight className="mr-2" />
            Body Metrics
          </button>
        </nav>
      </div>

      {/* Exercise Progress Tab */}
      {activeTab === 'exercises' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Exercise History</h2>
            
            {allExercises.length === 0 ? (
              <div className="text-center py-12">
                <FaDumbbell className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No exercises logged yet.</p>
                <p className="text-gray-400 text-sm mt-2">Start by logging workouts in the Workouts page!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {/* Exercise List */}
                <div className="md:col-span-1">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Your Exercises</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {allExercises.map((exercise, index) => (
                      <button
                        key={index}
                        onClick={() => fetchExerciseHistory(exercise.name)}
                        className={`w-full text-left p-3 rounded-lg transition-colors ${
                          selectedExercise === exercise.name
                            ? 'bg-primary-50 border-2 border-primary-500'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-gray-900">{exercise.name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Logged {exercise.count} times
                        </div>
                        <div className="text-xs text-gray-400">
                          Last: {format(new Date(exercise.lastPerformed), 'MMM d, yyyy')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercise History Details */}
                <div className="md:col-span-2">
                  {selectedExercise ? (
                    <>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedExercise}</h3>
                      
                      {exerciseHistory.length === 0 ? (
                        <p className="text-gray-500">No history available for this exercise.</p>
                      ) : (
                        <div className="space-y-3">
                          {exerciseHistory.map((entry, index) => (
                            <div
                              key={index}
                              className={`p-4 rounded-lg border-2 ${
                                entry.completed
                                  ? 'bg-green-50 border-green-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {format(new Date(entry.date), 'MMMM d, yyyy')}
                                  </div>
                                  <div className="text-sm text-gray-600">{entry.workoutName}</div>
                                </div>
                                {entry.completed && (
                                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                                    ✓ Completed
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-3 gap-4 mt-3">
                                <div className="text-center p-2 bg-white rounded">
                                  <div className="text-2xl font-bold text-primary-600">{entry.sets}</div>
                                  <div className="text-xs text-gray-500">Sets</div>
                                </div>
                                <div className="text-center p-2 bg-white rounded">
                                  <div className="text-2xl font-bold text-primary-600">{entry.reps || '-'}</div>
                                  <div className="text-xs text-gray-500">Reps</div>
                                </div>
                                <div className="text-center p-2 bg-white rounded">
                                  <div className="text-2xl font-bold text-primary-600">
                                    {entry.weight ? `${entry.weight}kg` : '-'}
                                  </div>
                                  <div className="text-xs text-gray-500">Weight</div>
                                </div>
                              </div>
                              
                              {entry.notes && (
                                <div className="mt-3 text-sm text-gray-600 italic">
                                  {entry.notes}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-500">Select an exercise to view history</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Body Metrics Tab */}
      {activeTab === 'body' && (
        <>
      {/* Stats Cards */}
      {stats && stats.totalEntries > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
            <p className="text-sm text-gray-600 mb-1">Start Weight</p>
            <p className="text-3xl font-bold text-gray-900">{stats.startWeight} kg</p>
            <p className="text-xs text-gray-500 mt-1">{format(new Date(stats.startDate), 'MMM d, yyyy')}</p>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100">
            <p className="text-sm text-gray-600 mb-1">Current Weight</p>
            <p className="text-3xl font-bold text-gray-900">{stats.currentWeight} kg</p>
            <p className="text-xs text-gray-500 mt-1">{format(new Date(stats.lastUpdate), 'MMM d, yyyy')}</p>
          </div>
          <div className={`card bg-gradient-to-br ${parseFloat(stats.weightChange) < 0 ? 'from-green-50 to-green-100' : 'from-orange-50 to-orange-100'}`}>
            <p className="text-sm text-gray-600 mb-1">Weight Change</p>
            <p className={`text-3xl font-bold ${parseFloat(stats.weightChange) < 0 ? 'text-green-700' : 'text-orange-700'}`}>
              {stats.weightChange > 0 ? '+' : ''}{stats.weightChange} kg
            </p>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
            <p className="text-sm text-gray-600 mb-1">Avg Weight</p>
            <p className="text-3xl font-bold text-gray-900">{stats.averageWeight} kg</p>
            <p className="text-xs text-gray-500 mt-1">{stats.totalEntries} entries</p>
          </div>
        </div>
      )}

      {/* Weight Chart */}
      {chartData.length > 0 && (
        <div className="card mb-8">
          <div style={{ height: '400px' }}>
            <Line data={weightChartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Progress Entries List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Recent Entries</h2>
        {progressEntries.length === 0 ? (
          <div className="text-center py-12 card">
            <FaChartLine className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">No progress entries yet. Start tracking your progress!</p>
          </div>
        ) : (
          progressEntries.map(entry => (
            <div key={entry._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <span className="text-lg font-semibold text-gray-900 mr-3">
                      {format(new Date(entry.date), 'MMM d, yyyy')}
                    </span>
                    {entry.mood && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full capitalize">
                        {entry.mood}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600">Weight</p>
                      <p className="text-lg font-semibold">{entry.weight} kg</p>
                    </div>
                    {entry.bodyFat && (
                      <div>
                        <p className="text-xs text-gray-600">Body Fat</p>
                        <p className="text-lg font-semibold">{entry.bodyFat}%</p>
                      </div>
                    )}
                    {entry.energyLevel && (
                      <div>
                        <p className="text-xs text-gray-600">Energy Level</p>
                        <p className="text-lg font-semibold">{entry.energyLevel}/10</p>
                      </div>
                    )}
                    {entry.measurements && Object.keys(entry.measurements).length > 0 && (
                      <div>
                        <p className="text-xs text-gray-600">Measurements</p>
                        <p className="text-sm text-gray-700">{Object.keys(entry.measurements).length} tracked</p>
                      </div>
                    )}
                  </div>

                  {entry.notes && (
                    <p className="text-sm text-gray-600 italic">{entry.notes}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDelete(entry._id)}
                  className="ml-4 text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
        </>
      )}

      {/* Log Progress Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Log Progress</h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Weight (kg) *</label>
                    <input
                      type="number"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      className="input-field"
                      step="0.1"
                      min="20"
                      max="500"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Body Fat %</label>
                    <input
                      type="number"
                      value={formData.bodyFat}
                      onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                      className="input-field"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Measurements (cm)</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Object.keys(formData.measurements).map(key => (
                      <input
                        key={key}
                        type="number"
                        placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                        value={formData.measurements[key]}
                        onChange={(e) => setFormData({
                          ...formData,
                          measurements: { ...formData.measurements, [key]: e.target.value }
                        })}
                        className="input-field"
                        step="0.1"
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Mood</label>
                    <select
                      value={formData.mood}
                      onChange={(e) => setFormData({ ...formData, mood: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select mood</option>
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="okay">Okay</option>
                      <option value="poor">Poor</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Energy Level (1-10)</label>
                    <input
                      type="number"
                      value={formData.energyLevel}
                      onChange={(e) => setFormData({ ...formData, energyLevel: e.target.value })}
                      className="input-field"
                      min="1"
                      max="10"
                    />
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
                    Save Progress
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

export default Progress;
