import React, { useEffect, useState } from 'react';
import { FaFire, FaTrophy } from 'react-icons/fa';
import { streakAPI } from '../services/api';

const StreakBadge = () => {
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreak();
  }, []);

  const fetchStreak = async () => {
    try {
      const response = await streakAPI.getStreak();
      if (response.data.success) {
        setStreak(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching streak:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Current Streak */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Current Streak</p>
            <div className="flex items-baseline mt-2">
              <span className="text-4xl font-bold">{streak.current}</span>
              <span className="text-xl ml-2">days</span>
            </div>
          </div>
          <FaFire className="text-5xl opacity-90" />
        </div>
        {streak.current > 0 && (
          <p className="text-xs mt-3 opacity-90">
            Keep it up! You're on fire! 🔥
          </p>
        )}
      </div>

      {/* Longest Streak */}
      <div className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white rounded-lg p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Longest Streak</p>
            <div className="flex items-baseline mt-2">
              <span className="text-4xl font-bold">{streak.longest}</span>
              <span className="text-xl ml-2">days</span>
            </div>
          </div>
          <FaTrophy className="text-5xl opacity-90" />
        </div>
        {streak.longest > 7 && (
          <p className="text-xs mt-3 opacity-90">
            Personal best! 🏆
          </p>
        )}
      </div>
    </div>
  );
};

export default StreakBadge;
