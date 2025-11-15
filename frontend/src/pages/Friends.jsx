import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaUsers, FaSearch, FaCheck, FaTimes, FaUserMinus } from 'react-icons/fa';
import { friendsAPI } from '../services/api';

const Friends = () => {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'search'
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'friends') {
      fetchFriends();
    } else if (activeTab === 'requests') {
      fetchRequests();
    }
  }, [activeTab]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await friendsAPI.getFriends();
      setFriends(res.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await friendsAPI.getRequests();
      setRequests(res.data?.data || []);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const res = await friendsAPI.searchUsers(searchQuery);
      setSearchResults(res.data?.data || []);
      setMessage('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Search failed');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await friendsAPI.sendRequest(userId);
      setMessage('Friend request sent!');
      // Update search results to reflect sent request
      setSearchResults(searchResults.map(user => 
        user._id === userId ? { ...user, requestSent: true } : user
      ));
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await friendsAPI.acceptRequest(requestId);
      setMessage('Friend request accepted!');
      fetchRequests();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await friendsAPI.rejectRequest(requestId);
      setMessage('Friend request rejected');
      fetchRequests();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!window.confirm('Are you sure you want to remove this friend?')) return;

    try {
      await friendsAPI.removeFriend(friendId);
      setMessage('Friend removed');
      fetchFriends();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to remove friend');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <FaUsers className="mr-3 text-primary-600" />
          Friends
        </h1>
        <p className="text-gray-600 mt-2">Connect with other fitness enthusiasts</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('friends')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'friends'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaUsers className="inline mr-2" />
          My Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'requests'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaUserPlus className="inline mr-2" />
          Requests ({requests.length})
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`pb-3 px-4 font-medium transition-colors ${
            activeTab === 'search'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FaSearch className="inline mr-2" />
          Find Friends
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('success') || message.includes('accepted') || message.includes('sent')
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Friends List Tab */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : friends.length === 0 ? (
            <div className="card text-center py-12">
              <FaUsers className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No friends yet. Start by searching for users!</p>
            </div>
          ) : (
            friends.map((friend) => (
              <div key={friend._id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                      <span className="text-primary-600 font-bold text-lg">
                        {friend.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{friend.name}</h3>
                      <p className="text-sm text-gray-500">{friend.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend._id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center"
                  >
                    <FaUserMinus className="mr-2" />
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Friend Requests Tab */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="card text-center py-12">
              <FaUserPlus className="text-5xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending friend requests</p>
            </div>
          ) : (
            requests.map((request) => (
              <div key={request._id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                      <span className="text-primary-600 font-bold text-lg">
                        {request.from.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{request.from.name}</h3>
                      <p className="text-sm text-gray-500">{request.from.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(request._id)}
                      className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center"
                    >
                      <FaCheck className="mr-2" />
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request._id)}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center"
                    >
                      <FaTimes className="mr-2" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div>
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <FaSearch />
              </button>
            </div>
          </form>

          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="card text-center py-12">
                <FaSearch className="text-5xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Search for users to add as friends</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <div key={user._id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                        <span className="text-primary-600 font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    {user.isFriend ? (
                      <span className="px-4 py-2 bg-green-50 text-green-600 rounded-lg">
                        Friends
                      </span>
                    ) : user.requestSent || user.hasPendingRequest ? (
                      <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                        Request Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user._id)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center"
                      >
                        <FaUserPlus className="mr-2" />
                        Add Friend
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Friends;
