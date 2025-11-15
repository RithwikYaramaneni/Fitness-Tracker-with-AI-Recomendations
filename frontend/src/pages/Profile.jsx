import React, { useState, useEffect, useContext } from 'react';
import { FaSave, FaUser } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { userAPI } from '../services/api';
import StreakBadge from '../components/StreakBadge';

const Profile = () => {
  const { user, login } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: '',
    profile: {
      age: '',
      gender: '',
      height: '',
      weight: '',
      activityLevel: 'moderate',
      fitnessGoal: 'maintain',
      experienceLevel: 'beginner',
      targetWeight: '',
      dietaryPreferences: [],
      medicalConditions: [],
      injuries: []
    },
    preferences: {
      workoutDuration: 45,
      workoutFrequency: 3,
      preferredWorkoutTypes: [],
      equipmentAvailable: []
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await userAPI.getProfile();
      if (response.data.success) {
        const userData = response.data.data.user;
        setFormData({
          name: userData.name || '',
          profile: {
            age: userData.profile?.age || '',
            gender: userData.profile?.gender || '',
            height: userData.profile?.height || '',
            weight: userData.profile?.weight || '',
            activityLevel: userData.profile?.activityLevel || 'moderate',
            fitnessGoal: userData.profile?.fitnessGoal || 'maintain',
            experienceLevel: userData.profile?.experienceLevel || 'beginner',
            targetWeight: userData.profile?.targetWeight || '',
            dietaryPreferences: userData.profile?.dietaryPreferences || [],
            medicalConditions: userData.profile?.medicalConditions || [],
            injuries: userData.profile?.injuries || []
          },
          preferences: {
            workoutDuration: userData.preferences?.workoutDuration || 45,
            workoutFrequency: userData.preferences?.workoutFrequency || 3,
            preferredWorkoutTypes: userData.preferences?.preferredWorkoutTypes || [],
            equipmentAvailable: userData.preferences?.equipmentAvailable || []
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e, section) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => {
        const currentArray = section ? prev[section][name] : prev[name];
        const newArray = checked
          ? [...currentArray, value]
          : currentArray.filter(item => item !== value);
        
        return section
          ? { ...prev, [section]: { ...prev[section], [name]: newArray } }
          : { ...prev, [name]: newArray };
      });
    } else {
      if (section) {
        setFormData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [name]: value
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const response = await userAPI.updateProfile(formData);
      if (response.data.success) {
        setMessage('Profile updated successfully!');
        // Update user context
        const token = localStorage.getItem('token');
        login(response.data.data.user, token);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaUser className="mr-3 text-primary-600" />
          My Profile
        </h1>
        <p className="text-gray-600 mt-2">Manage your personal information and preferences</p>
      </div>

      {/* Streak Badge */}
      <StreakBadge />

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={(e) => handleChange(e)}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="label">Age</label>
              <input
                type="number"
                name="age"
                value={formData.profile.age}
                onChange={(e) => handleChange(e, 'profile')}
                className="input-field"
                min="13"
                max="120"
              />
            </div>
            <div>
              <label className="label">Gender</label>
              <select
                name="gender"
                value={formData.profile.gender}
                onChange={(e) => handleChange(e, 'profile')}
                className="input-field"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.profile.height}
                onChange={(e) => handleChange(e, 'profile')}
                className="input-field"
                min="50"
                max="300"
              />
            </div>
            <div>
              <label className="label">Current Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.profile.weight}
                onChange={(e) => handleChange(e, 'profile')}
                className="input-field"
                min="20"
                max="500"
                step="0.1"
              />
            </div>
            <div>
              <label className="label">Target Weight (kg)</label>
              <input
                type="number"
                name="targetWeight"
                value={formData.profile.targetWeight}
                onChange={(e) => handleChange(e, 'profile')}
                className="input-field"
                min="20"
                max="500"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Fitness Goals */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Fitness Goals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Activity Level</label>
              <select
                name="activityLevel"
                value={formData.profile.activityLevel}
                onChange={(e) => handleChange(e, 'profile')}
                className="input-field"
              >
                <option value="sedentary">Sedentary (little or no exercise)</option>
                <option value="light">Light (exercise 1-3 days/week)</option>
                <option value="moderate">Moderate (exercise 3-5 days/week)</option>
                <option value="active">Active (exercise 6-7 days/week)</option>
                <option value="very_active">Very Active (intense exercise daily)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Used to calculate your daily calorie needs</p>
            </div>
            <div>
              <label className="label">Fitness Goal</label>
              <select
                name="fitnessGoal"
                value={formData.profile.fitnessGoal}
                onChange={(e) => handleChange(e, 'profile')}
                className="input-field"
              >
                <option value="lose_weight">Lose Weight (-300 cal/day)</option>
                <option value="maintain">Maintain Weight</option>
                <option value="gain_muscle">Gain Muscle (+300 cal/day)</option>
                <option value="improve_endurance">Improve Endurance</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Adjusts your daily calorie target</p>
            </div>
            <div>
              <label className="label">Experience Level</label>
              <select
                name="experienceLevel"
                value={formData.profile.experienceLevel || 'beginner'}
                onChange={(e) => handleChange(e, 'profile')}
                className="input-field"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Used for AI workout plan generation</p>
            </div>
          </div>

          <div className="mt-6">
            <label className="label">Dietary Preferences</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {['vegetarian', 'vegan', 'keto', 'paleo', 'gluten_free', 'dairy_free'].map(pref => (
                <label key={pref} className="flex items-center">
                  <input
                    type="checkbox"
                    name="dietaryPreferences"
                    value={pref}
                    checked={formData.profile.dietaryPreferences.includes(pref)}
                    onChange={(e) => handleChange(e, 'profile')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">{pref.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Workout Preferences */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Workout Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Preferred Workout Duration (minutes)</label>
              <input
                type="number"
                name="workoutDuration"
                value={formData.preferences.workoutDuration}
                onChange={(e) => handleChange(e, 'preferences')}
                className="input-field"
                min="15"
                max="180"
              />
            </div>
            <div>
              <label className="label">Workout Frequency (days/week)</label>
              <input
                type="number"
                name="workoutFrequency"
                value={formData.preferences.workoutFrequency}
                onChange={(e) => handleChange(e, 'preferences')}
                className="input-field"
                min="1"
                max="7"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="label">Preferred Workout Types</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {['strength', 'cardio', 'yoga', 'hiit', 'pilates', 'sports'].map(type => (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    name="preferredWorkoutTypes"
                    value={type}
                    checked={formData.preferences.preferredWorkoutTypes.includes(type)}
                    onChange={(e) => handleChange(e, 'preferences')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <label className="label">Equipment Available</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              {['none', 'dumbbells', 'barbell', 'resistance_bands', 'kettlebell', 'pull_up_bar', 'gym_access'].map(equip => (
                <label key={equip} className="flex items-center">
                  <input
                    type="checkbox"
                    name="equipmentAvailable"
                    value={equip}
                    checked={formData.preferences.equipmentAvailable.includes(equip)}
                    onChange={(e) => handleChange(e, 'preferences')}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 capitalize">{equip.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaSave className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Profile;
