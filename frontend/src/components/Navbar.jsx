import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaDumbbell, FaAppleAlt, FaChartLine, FaUser, FaSignOutAlt, FaHome, FaTrophy, FaUsers, FaUserFriends, FaRobot } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard' },
    { path: '/workouts', icon: FaDumbbell, label: 'Workouts' },
    { path: '/nutrition', icon: FaAppleAlt, label: 'Nutrition' },
    { path: '/progress', icon: FaChartLine, label: 'Progress' },
    { path: '/pr-tracking', icon: FaTrophy, label: 'PR Tracking' },
    { path: '/social', icon: FaUsers, label: 'Social' },
    { path: '/friends', icon: FaUserFriends, label: 'Friends' },
    { path: '/profile', icon: FaUser, label: 'Profile' }
  ];

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <FaDumbbell className="text-primary-600 text-3xl mr-2" />
              <span className="text-xl font-bold text-gray-900">Fitness Tracker</span>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <item.icon className="mr-2" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={logout}
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <FaSignOutAlt className="mr-2" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <span className="text-sm text-gray-700">{user?.name}</span>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden bg-white border-t border-gray-200">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                isActive(item.path)
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="mr-3" />
              {item.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="w-full flex items-center px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
          >
            <FaSignOutAlt className="mr-3" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
