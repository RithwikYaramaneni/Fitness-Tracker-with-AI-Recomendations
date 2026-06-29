import React, { useState, useEffect } from 'react';
import { FaHeart, FaRegHeart, FaComment, FaTrash, FaImage, FaSpinner, FaUserFriends } from 'react-icons/fa';
import { postsAPI, uploadAPI } from '../services/api';
import { format } from 'date-fns';

const SocialFeed = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentText, setCommentText] = useState({});
  const [newPost, setNewPost] = useState({
    imageFile: null,
    imagePreview: null,
    caption: '',
    workoutType: 'other'
  });
  const [uploading, setUploading] = useState(false);
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

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
      }
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      setNewPost({ ...newPost, imageFile: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPost(prev => ({ ...prev, imagePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.imageFile) {
      alert('Please select an image');
      return;
    }

    try {
      setUploading(true);
      
      // Upload image to Cloudinary
      const uploadResponse = await uploadAPI.uploadImage(newPost.imageFile);
      
      if (!uploadResponse.data.success) {
        console.error('Upload response:', uploadResponse.data);
        alert('Failed to upload image: ' + (uploadResponse.data.message || 'Unknown error'));
        setUploading(false);
        return;
      }

      const imageUrl = uploadResponse.data.data.url;

      // Create post with uploaded image URL
      const response = await postsAPI.createPost({
        imageUrl,
        caption: newPost.caption,
        workoutType: newPost.workoutType
      });
      
      if (response.data.success) {
        setShowCreateModal(false);
        setNewPost({
          imageFile: null,
          imagePreview: null,
          caption: '',
          workoutType: 'other'
        });
        fetchFeed();
      } else {
        alert('Failed to create post: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Error: ' + (error.response?.data?.message || error.message || 'Failed to create post'));
    } finally {
      setUploading(false);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Social Feed</h1>
          <p className="text-sm text-gray-500 mt-1">Your posts and your friends' posts</p>
        </div>
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{post.userId?.name || 'User'}</h3>
                    {post.userId?._id !== currentUser?._id && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        <FaUserFriends size={12} />
                        Friend
                      </span>
                    )}
                  </div>
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
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-96 overflow-y-auto">
            <h2 className="text-2xl font-semibold mb-4">Create Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="label">Select Image</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="imageInput"
                    required
                  />
                  <label htmlFor="imageInput" className="cursor-pointer">
                    <FaImage className="mx-auto text-3xl text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">Click to select an image</p>
                    <p className="text-xs text-gray-500 mt-1">Max size: 5MB</p>
                  </label>
                </div>
                {newPost.imageFile && (
                  <p className="text-sm text-green-600 mt-2">✓ {newPost.imageFile.name}</p>
                )}
              </div>

              {newPost.imagePreview && (
                <div>
                  <label className="label">Preview</label>
                  <img
                    src={newPost.imagePreview}
                    alt="Preview"
                    className="w-full rounded-lg max-h-48 object-cover"
                  />
                </div>
              )}

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
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewPost({
                      imageFile: null,
                      imagePreview: null,
                      caption: '',
                      workoutType: 'other'
                    });
                  }}
                  className="btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex items-center" disabled={uploading}>
                  {uploading ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    'Create Post'
                  )}
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
