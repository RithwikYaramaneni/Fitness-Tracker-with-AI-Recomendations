import React, { useState, useEffect } from 'react';
import { FaTrophy, FaPlus, FaChartLine, FaTrash } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { prAPI } from '../services/api';
import { format } from 'date-fns';

const PRTracking = () => {
  const [prs, setPRs] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [prHistory, setPRHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    exercise: '',
    weight: '',
    reps: 1,
    muscleGroup: 'other',
    notes: '',
    unit: 'kg'
  });

  useEffect(() => {
    fetchAllPRs();
  }, []);

  const fetchAllPRs = async () => {
    try {
      const response = await prAPI.getAllPRs();
      if (response.data.success) {
        setPRs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching PRs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPRHistory = async (exercise) => {
    try {
      const response = await prAPI.getPRHistory(exercise);
      if (response.data.success) {
        setPRHistory(response.data.data.prHistory || []);
        setSelectedExercise(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching PR history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await prAPI.addPR(formData);
      if (response.data.success) {
        setShowAddModal(false);
        setFormData({
          exercise: '',
          weight: '',
          reps: 1,
          muscleGroup: 'other',
          notes: '',
          unit: 'kg'
        });
        fetchAllPRs();
        alert('PR added successfully! 🎉');
      }
    } catch (error) {
      console.error('Error adding PR:', error);
      alert('Failed to add PR. Please try again.');
    }
  };

  const handleDelete = async (exercise) => {
    if (!confirm(`Are you sure you want to delete all PRs for ${exercise}?`)) return;

    try {
      await prAPI.deletePR(exercise);
      fetchAllPRs();
      if (selectedExercise?.exercise === exercise) {
        setSelectedExercise(null);
        setPRHistory([]);
      }
    } catch (error) {
      console.error('Error deleting PR:', error);
    }
  };

  // Format data for chart
  const chartData = prHistory.map(entry => ({
    date: format(new Date(entry.date), 'MMM d'),
    weight: entry.weight,
    reps: entry.reps
  })).reverse();

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FaTrophy className="mr-3 text-yellow-500" />
            Personal Records
          </h1>
          <p className="text-gray-600 mt-2">Track your strength progress</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center"
        >
          <FaPlus className="mr-2" />
          Add PR
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PRs List */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Your PRs</h2>
          {prs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No PRs yet. Add your first one!</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {prs.map((pr) => (
                <div
                  key={pr._id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedExercise?.exercise === pr.exercise
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                  onClick={() => fetchPRHistory(pr.exercise)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold capitalize">{pr.exercise}</h3>
                      <p className="text-sm text-gray-600 capitalize">{pr.muscleGroup}</p>
                      {pr.currentPR && (
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-primary-600">
                            {pr.currentPR.weight} {pr.unit}
                          </span>
                          <span className="text-sm text-gray-500 ml-2">
                            × {pr.currentPR.reps} reps
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(pr.currentPR.date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(pr.exercise);
                      }}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PR Progress Chart */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <FaChartLine className="mr-2" />
            Progress Chart
          </h2>
          {selectedExercise && chartData.length > 0 ? (
            <div>
              <h3 className="text-lg font-medium capitalize mb-4">
                {selectedExercise.exercise}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis label={{ value: `Weight (${selectedExercise.unit})`, angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 5 }}
                    name={`Weight (${selectedExercise.unit})`}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-4">
                <h4 className="font-medium mb-2">History</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {prHistory.map((entry, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{format(new Date(entry.date), 'MMM d, yyyy')}</span>
                      <span className="font-medium">
                        {entry.weight} {selectedExercise.unit} × {entry.reps}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Select a PR to view progress chart
            </div>
          )}
        </div>
      </div>

      {/* Add PR Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-semibold mb-4">Add Personal Record</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Exercise Name</label>
                <input
                  type="text"
                  value={formData.exercise}
                  onChange={(e) => setFormData({ ...formData, exercise: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Bench Press"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Weight</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="input-field"
                  >
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Reps</label>
                <input
                  type="number"
                  value={formData.reps}
                  onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                  className="input-field"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="label">Muscle Group</label>
                <select
                  value={formData.muscleGroup}
                  onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
                  className="input-field"
                >
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="arms">Arms</option>
                  <option value="legs">Legs</option>
                  <option value="core">Core</option>
                  <option value="full_body">Full Body</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows="2"
                  placeholder="Any notes about this PR..."
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add PR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PRTracking;
