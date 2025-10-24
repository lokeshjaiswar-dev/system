import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'resident',
    wing: '',
    flatNo: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate resident fields
    if (formData.role === 'resident' && (!formData.wing || !formData.flatNo)) {
      toast.error('Wing and Flat No are required for residents');
      return;
    }

    setLoading(true);

    try {
      // Prepare data for API
      const submitData = { ...formData };
      
      // Remove confirmPassword as it's not needed for backend
      delete submitData.confirmPassword;

      // If role is admin, remove wing and flatNo
      if (submitData.role === 'admin') {
        submitData.wing = undefined;
        submitData.flatNo = undefined;
      }

      await authAPI.register(submitData);
      toast.success('Registration successful! Please check your email for verification code.');
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800/50 backdrop-blur-lg p-8 rounded-2xl border border-purple-500/20 shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              sign in to existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input
                name="name"
                type="text"
                required
                className="relative block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                name="email"
                type="email"
                required
                className="relative block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Register as
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.role === 'resident'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-purple-500/50'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="resident"
                    checked={formData.role === 'resident'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="flex items-center">
                    <span className="mr-2">👤</span>
                    Resident
                  </span>
                </label>
                <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-all ${
                  formData.role === 'admin'
                    ? 'bg-purple-600/20 border-purple-500 text-white'
                    : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:border-purple-500/50'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="flex items-center">
                    <span className="mr-2">👑</span>
                    Admin
                  </span>
                </label>
              </div>
            </div>

            {/* Resident-specific fields */}
            {formData.role === 'resident' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      name="wing"
                      type="text"
                      required={formData.role === 'resident'}
                      className="relative block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Wing (e.g., A)"
                      value={formData.wing}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <input
                      name="flatNo"
                      type="text"
                      required={formData.role === 'resident'}
                      className="relative block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      placeholder="Flat No (e.g., 101)"
                      value={formData.flatNo}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-400 text-sm text-center">
                    💡 Please enter your correct wing and flat number. This will be verified during registration.
                  </p>
                </div>
              </>
            )}

            {/* Admin notice */}
            {formData.role === 'admin' && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-purple-400 text-sm text-center">
                  ⚠️ Only one admin account is allowed. If admin already exists, registration will fail.
                </p>
              </div>
            )}

            <div>
              <input
                name="phone"
                type="tel"
                required
                className="relative block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                name="password"
                type="password"
                required
                className="relative block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                name="confirmPassword"
                type="password"
                required
                className="relative block w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/login"
                className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                Already have an account? Sign in
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;