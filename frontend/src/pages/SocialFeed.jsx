import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaTrash, FaImage } from 'react-icons/fa';
import { postsAPI } from '../services/api';
import { format } from 'date-fns';

const SocialFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [newPost, setNewPost] = useState({
    imageUrl: '',
    caption: '',
    workoutType: 'other'
  });
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    try {
      const response = await postsAPI.getFeed({ page: 1, limit: 20 });
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.imageUrl) {
      alert('Please provide an image URL');
      return;
    }

    try {
      const response = await postsAPI.createPost(newPost);
      if (response.data.success) {
        setShowCreateModal(false);
        setNewPost({ imageUrl: '', caption: '', workoutType: 'other' });
        fetchFeed();
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post');
    }
  };

  const handleToggleLike = async (postId) => {
    try {
      const response = await postsAPI.toggleLike(postId);
      if (response.data.success) {
        setPosts(posts.map(post =>
          post._id === postId ? response.data.data : post
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentText[postId]?.trim();
    if (!text) return;

    try {
      const response = await postsAPI.addComment(postId, text);
      if (response.data.success) {
        setPosts(posts.map(post =>
          post._id === postId ? response.data.data : post
        ));
        setCommentText({ ...commentText, [postId]: '' });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsAPI.deletePost(postId);
      setPosts(posts.filter(post => post._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading feed...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Social Feed</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <FaImage className="mr-2" />
          Create Post
        </button>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500">No posts yet. Add friends and start sharing!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="card">
              {/* Post Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{post.userId?.name || 'User'}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(post.createdAt), 'MMM d, yyyy • h:mm a')}
                  </p>
                </div>
                {post.userId?._id === currentUser?._id && (
                  <button
                    onClick={() => handleDeletePost(post._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              {/* Post Image */}
              <img
                src={post.imageUrl}
                alt="Workout"
                className="w-full rounded-lg mb-4 max-h-96 object-cover"
              />

              {/* Post Caption */}
              {post.caption && (
                <p className="text-gray-800 mb-4">{post.caption}</p>
              )}

              {/* Post Type Tag */}
              {post.workoutType && (
                <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm mb-4">
                  {post.workoutType}
                </span>
              )}

              {/* Likes and Actions */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-6 mb-4">
                  <button
                    onClick={() => handleToggleLike(post._id)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-500"
                  >
                    {post.likes?.includes(currentUser?._id) ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FaRegHeart />
                    )}
                    <span>{post.likes?.length || 0}</span>
                  </button>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <FaComment />
                    <span>{post.comments?.length || 0}</span>
                  </div>
                </div>

                {/* Comments */}
                {post.comments && post.comments.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {post.comments.map((comment) => (
                      <div key={comment._id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-semibold text-sm">
                              {comment.userId?.name || 'User'}
                            </span>
                            <p className="text-gray-800 text-sm mt-1">{comment.text}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(new Date(comment.createdAt), 'MMM d • h:mm a')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={commentText[post._id] || ''}
                    onChange={(e) => setCommentText({ ...commentText, [post._id]: e.target.value })}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post._id)}
                    placeholder="Add a comment..."
                    className="input-field flex-1"
                  />
                  <button
                    onClick={() => handleAddComment(post._id)}
                    className="btn-primary"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-2xl font-semibold mb-4">Create Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="label">Image URL</label>
                <input
                  type="url"
                  value={newPost.imageUrl}
                  onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com/image.jpg"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tip: Upload your image to imgur.com and paste the URL here
                </p>
              </div>
              <div>
                <label className="label">Caption</label>
                <textarea
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Share your workout experience..."
                />
              </div>
              <div>
                <label className="label">Workout Type</label>
                <select
                  value={newPost.workoutType}
                  onChange={(e) => setNewPost({ ...newPost, workoutType: e.target.value })}
                  className="input-field"
                >
                  <option value="strength">Strength</option>
                  <option value="cardio">Cardio</option>
                  <option value="yoga">Yoga</option>
                  <option value="hiit">HIIT</option>
                  <option value="pilates">Pilates</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
