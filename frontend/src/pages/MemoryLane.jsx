import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { memoryLaneAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const MemoryLane = () => {
  const [memories, setMemories] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    title: '',
    description: '',
    images: []
  });
  const [comment, setComment] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchMemories();
  }, [selectedDate]);

  const fetchMemories = async () => {
    try {
      const response = await memoryLaneAPI.getAll(selectedDate);
      setMemories(response.data);
    } catch (error) {
      toast.error('Failed to fetch memories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await memoryLaneAPI.create(formData);
      toast.success('Memory added successfully');
      setShowForm(false);
      setFormData({ date: '', title: '', description: '', images: [] });
      fetchMemories();
    } catch (error) {
      toast.error('Failed to add memory');
    }
  };

  const handleAddComment = async (memoryId) => {
    if (!comment.trim()) return;
    
    try {
      await memoryLaneAPI.addComment(memoryId, comment);
      setComment('');
      fetchMemories();
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleLike = async (memoryId) => {
    try {
      await memoryLaneAPI.toggleLike(memoryId);
      fetchMemories();
    } catch (error) {
      toast.error('Failed to like memory');
    }
  };

  const isLiked = (memory) => {
    return memory.likes.some(like => like._id === user?._id);
  };

  return (
    <Layout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Memory Lane</h1>
          <p className="text-gray-400">Share and relive society memories</p>
        </div>
        <div className="flex gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105"
          >
            + Add Memory
          </button>
        </div>
      </div>

      {/* Add Memory Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Add New Memory</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  required
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-6 py-3 rounded-lg text-white font-medium transition-all duration-200"
                >
                  Add Memory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Memories Grid */}
      <div className="grid gap-6">
        {memories.map((memory) => (
          <div
            key={memory._id}
            className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-white">{memory.title}</h3>
                <p className="text-gray-400 text-sm">
                  By {memory.createdBy?.name} • {new Date(memory.date).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(memory._id)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                    isLiked(memory)
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600 hover:border-red-500/30'
                  }`}
                >
                  ❤️ {memory.likes.length}
                </button>
              </div>
            </div>
            
            <p className="text-gray-300 mb-4 whitespace-pre-wrap">{memory.description}</p>

            {/* Images */}
            {memory.images.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {memory.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Memory ${index + 1}`}
                    className="rounded-lg h-32 w-full object-cover"
                  />
                ))}
              </div>
            )}

            {/* Comments */}
            <div className="border-t border-purple-500/20 pt-4">
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleAddComment(memory._id)}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white transition-colors"
                >
                  Comment
                </button>
              </div>
              
              {memory.comments.map((commentObj, index) => (
                <div key={index} className="flex gap-3 mb-3 last:mb-0">
                  <div className="flex-1 bg-gray-700/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm">
                        {commentObj.user?.name}
                      </span>
                      <span className="text-gray-400 text-xs">
                        {new Date(commentObj.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{commentObj.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {memories.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">
              {selectedDate ? 'No memories found for this date' : 'No memories found'}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MemoryLane;