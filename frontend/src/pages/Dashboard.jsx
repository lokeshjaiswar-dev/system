import React from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  const residentFeatures = [
    {
      title: 'Flat Management',
      description: 'View all society flats, their status and owner information',
      icon: '🏢',
      path: '/flats'
    },
    {
      title: 'Notices',
      description: 'Stay updated with society announcements and important notices',
      icon: '📢',
      path: '/notices'
    },
    {
      title: 'Complaints',
      description: 'Raise and track maintenance complaints and issues',
      icon: '📝',
      path: '/complaints'
    },
    {
      title: 'Maintenance',
      description: 'View and pay maintenance bills online',
      icon: '💰',
      path: '/maintenance'
    },
    {
      title: 'Memory Lane',
      description: 'Share and relive society memories and events',
      icon: '📅',
      path: '/memory-lane'
    }
  ];

  const adminFeatures = [
    {
      title: 'Admin Panel',
      description: 'Manage society operations, residents, and financials',
      icon: '⚙️',
      path: '/admin'
    },
    {
      title: 'Flat Management',
      description: 'Add and manage society flats and resident information',
      icon: '🏢',
      path: '/flats'
    },
    {
      title: 'Notices',
      description: 'Create and manage society announcements and notices',
      icon: '📢',
      path: '/notices'
    },
    {
      title: 'Complaints',
      description: 'Monitor and resolve resident complaints and issues',
      icon: '📝',
      path: '/complaints'
    },
    {
      title: 'Maintenance',
      description: 'Generate and track maintenance bills and payments',
      icon: '💰',
      path: '/maintenance'
    },
    {
      title: 'Memory Lane',
      description: 'Manage society memories and community events',
      icon: '📅',
      path: '/memory-lane'
    }
  ];

  const features = user?.role === 'admin' ? adminFeatures : residentFeatures;

  return (
    <Layout>
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          Welcome back, {user?.name}! {user?.role === 'admin' ? '👑' : '👋'}
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          {user?.role === 'admin' 
            ? 'Manage your society efficiently with complete administrative controls'
            : 'Manage your society activities efficiently with SocietyHub'
          }
        </p>
        {user?.role === 'admin' && (
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full">
            <span className="text-purple-400 text-sm">Administrator Access</span>
          </div>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 hover:transform hover:scale-105 group cursor-pointer"
            onClick={() => window.location.href = feature.path}
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Society Info */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-8 mb-12 border border-purple-500/30">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          About Our Society
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-gray-300 text-lg mb-4">
              Welcome to our vibrant community! Our society is designed to provide 
              a comfortable and secure living environment with modern amenities 
              and excellent maintenance services.
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl mb-2">🏊‍♂️</div>
                <div className="text-white">Swimming Pool</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl mb-2">🏋️‍♂️</div>
                <div className="text-white">Gymnasium</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl mb-2">🌳</div>
                <div className="text-white">Park & Garden</div>
              </div>
              <div className="text-center p-4 bg-gray-800/50 rounded-lg">
                <div className="text-2xl mb-2">🎯</div>
                <div className="text-white">Club House</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
              alt="Society Building"
              className="rounded-lg h-48 w-full object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1571624436279-b272aff752b5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
              alt="Society Amenities"
              className="rounded-lg h-48 w-full object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
              alt="Park Area"
              className="rounded-lg h-48 w-full object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1582407947304-fd86f028f716?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
              alt="Security"
              className="rounded-lg h-48 w-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900/50 rounded-2xl p-8 border border-purple-500/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Our Location</h3>
            <p className="text-gray-300 mb-4">
              Premium Residency<br />
              Sector 45, Gurugram<br />
              Haryana - 122003<br />
              Phone: +91 9876543210<br />
              Email: info@societyhub.com
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Find Us</h3>
            <div className="bg-gray-800 rounded-lg h-48 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">🗺️</div>
                <p>Google Maps Integration</p>
                <p className="text-sm">(Map would be embedded here)</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Developers Section */}
        <div className="border-t border-gray-700 pt-6 text-center">
          <p className="text-gray-400">
            Developed with ❤️ by SocietyHub Development Team
          </p>
        </div>
      </footer>
    </Layout>
  );
};

export default Dashboard;