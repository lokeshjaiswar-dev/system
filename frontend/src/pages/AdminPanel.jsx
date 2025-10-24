import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { adminAPI, flatsAPI, complaintsAPI, maintenanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [bills, setBills] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showFlatForm, setShowFlatForm] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }),
    year: new Date().getFullYear(),
    amount: '',
    dueDate: '',
    description: ''
  });
  const [flatForm, setFlatForm] = useState({
    wing: '',
    flatNo: '',
    status: 'vacant',
    ownerName: '',
    residentName: '',
    phone: '',
    email: '',
    area: '',
    parkingSlots: 1
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsResponse, usersResponse, flatsResponse, complaintsResponse, billsResponse] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getUsers(),
        flatsAPI.getAll(),
        complaintsAPI.getAll(),
        maintenanceAPI.getAll()
      ]);

      setStats(statsResponse.data);
      setUsers(usersResponse.data);
      setFlats(flatsResponse.data);
      setComplaints(complaintsResponse.data);
      setBills(billsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMaintenance = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.bulkGenerateMaintenance(maintenanceForm);
      toast.success('Maintenance bills generated successfully');
      setShowMaintenanceForm(false);
      setMaintenanceForm({
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        amount: '',
        dueDate: '',
        description: ''
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to generate maintenance bills');
    }
  };

  const handleCreateFlat = async (e) => {
    e.preventDefault();
    try {
      await flatsAPI.create(flatForm);
      toast.success('Flat created successfully');
      setShowFlatForm(false);
      setFlatForm({
        wing: '',
        flatNo: '',
        status: 'vacant',
        ownerName: '',
        residentName: '',
        phone: '',
        email: '',
        area: '',
        parkingSlots: 1
      });
      fetchData();
    } catch (error) {
      toast.error('Failed to create flat');
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      await adminAPI.updateUserStatus(userId, isActive);
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <div className="text-red-400 text-xl">Access Denied</div>
          <p className="text-gray-400 mt-2">Admin privileges required to access this page.</p>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-white text-xl">Loading Admin Panel...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Panel 👑</h1>
        <p className="text-gray-400">Manage society operations and residents</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1">
          {['dashboard', 'users', 'flats', 'complaints', 'maintenance', 'financials'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Residents</p>
                <p className="text-3xl font-bold text-white">{stats.totalResidents || 0}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl p-6 border border-blue-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Flats</p>
                <p className="text-3xl font-bold text-white">{stats.totalFlats || 0}</p>
              </div>
              <div className="text-3xl">🏢</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 rounded-xl p-6 border border-green-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Vacant Flats</p>
                <p className="text-3xl font-bold text-white">{stats.vacantFlats || 0}</p>
              </div>
              <div className="text-3xl">🚪</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-xl p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Complaints</p>
                <p className="text-3xl font-bold text-white">{stats.pendingComplaints || 0}</p>
              </div>
              <div className="text-3xl">📝</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 rounded-xl p-6 border border-red-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Payments</p>
                <p className="text-3xl font-bold text-white">{stats.pendingPayments || 0}</p>
              </div>
              <div className="text-3xl">💰</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-6 border border-indigo-500/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Notices</p>
                <p className="text-3xl font-bold text-white">{stats.totalNotices || 0}</p>
              </div>
              <div className="text-3xl">📢</div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl border border-purple-500/20 overflow-hidden">
          <div className="p-6 border-b border-purple-500/20">
            <h3 className="text-xl font-semibold text-white">Manage Users</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Wing/Flat</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-purple-500/5 transition-colors">
                    <td className="px-6 py-4 text-sm text-white">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-white">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {user.role}
                        {user.role === 'admin' && ' 👑'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white">
                      {user.wing && user.flatNo ? `${user.wing}-${user.flatNo}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => updateUserStatus(user._id, !user.isActive)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          user.isActive
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Flats Tab */}
      {activeTab === 'flats' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Manage Flats</h3>
            <button
              onClick={() => setShowFlatForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200"
            >
              + Add Flat
            </button>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-500/20">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Wing</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Flat No</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Owner</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Resident</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {flats.map((flat) => (
                    <tr key={flat._id} className="hover:bg-purple-500/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{flat.wing}</td>
                      <td className="px-6 py-4 text-sm text-white font-medium">{flat.flatNo}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          flat.status === 'permanent' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : flat.status === 'rented'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {flat.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-white">{flat.ownerName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-white">{flat.residentName || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{flat.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          {complaints.map((complaint) => (
            <div key={complaint._id} className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">{complaint.title}</h4>
                  <p className="text-gray-400 text-sm">
                    By {complaint.raisedBy?.name} ({complaint.raisedBy?.wing}-{complaint.raisedBy?.flatNo}) • {new Date(complaint.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  complaint.status === 'pending' 
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : complaint.status === 'in-progress'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-green-500/20 text-green-400 border border-green-500/30'
                }`}>
                  {complaint.status}
                </span>
              </div>
              <p className="text-gray-300 mb-4">{complaint.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Category: {complaint.category}</span>
                <span className="text-sm text-gray-400">Priority: {complaint.priority}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-white">Maintenance Management</h3>
            <button
              onClick={() => setShowMaintenanceForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200"
            >
              Generate Bills
            </button>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-500/20">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Flat</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Period</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Amount</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Due Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-purple-500/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{bill.wing}-{bill.flatNo}</td>
                      <td className="px-6 py-4 text-sm text-white capitalize">{bill.month} {bill.year}</td>
                      <td className="px-6 py-4 text-sm text-white">₹{bill.amount}</td>
                      <td className="px-6 py-4 text-sm text-white">{new Date(bill.dueDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          bill.status === 'paid' 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : bill.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {bill.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Financials Tab */}
      {activeTab === 'financials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">Financial Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Revenue</span>
                <span className="text-white font-semibold">₹{stats.totalAmount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Collected Amount</span>
                <span className="text-green-400 font-semibold">₹{stats.paidAmount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Pending Amount</span>
                <span className="text-yellow-400 font-semibold">₹{stats.pendingAmount || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Collection Rate</span>
                <span className="text-white font-semibold">{stats.collectionRate?.toFixed(1) || 0}%</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
            <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => setShowMaintenanceForm(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-3 rounded-lg text-white font-medium transition-all duration-200"
              >
                Generate Maintenance Bills
              </button>
              <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 px-4 py-3 rounded-lg text-white font-medium transition-all duration-200">
                Export Financial Report
              </button>
              <button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-4 py-3 rounded-lg text-white font-medium transition-all duration-200">
                Send Payment Reminders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Generation Modal */}
      {showMaintenanceForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-4">Generate Maintenance Bills</h3>
            <form onSubmit={handleBulkMaintenance} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
                  <select
                    required
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={maintenanceForm.month}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, month: e.target.value })}
                  >
                    <option value="january">January</option>
                    <option value="february">February</option>
                    <option value="march">March</option>
                    <option value="april">April</option>
                    <option value="may">May</option>
                    <option value="june">June</option>
                    <option value="july">July</option>
                    <option value="august">August</option>
                    <option value="september">September</option>
                    <option value="october">October</option>
                    <option value="november">November</option>
                    <option value="december">December</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={maintenanceForm.year}
                    onChange={(e) => setMaintenanceForm({ ...maintenanceForm, year: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                <input
                  type="number"
                  required
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={maintenanceForm.amount}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, amount: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={maintenanceForm.dueDate}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, dueDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  value={maintenanceForm.description}
                  onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowMaintenanceForm(false)}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200"
                >
                  Generate Bills
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Flat Modal */}
      {showFlatForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-purple-500/30">
            <h3 className="text-xl font-bold text-white mb-4">Add New Flat</h3>
            <form onSubmit={handleCreateFlat} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Wing</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={flatForm.wing}
                    onChange={(e) => setFlatForm({ ...flatForm, wing: e.target.value.toUpperCase() })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Flat No</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={flatForm.flatNo}
                    onChange={(e) => setFlatForm({ ...flatForm, flatNo: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  required
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={flatForm.status}
                  onChange={(e) => setFlatForm({ ...flatForm, status: e.target.value })}
                >
                  <option value="vacant">Vacant</option>
                  <option value="permanent">Permanent</option>
                  <option value="rented">Rented</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Owner Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={flatForm.ownerName}
                    onChange={(e) => setFlatForm({ ...flatForm, ownerName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Resident Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={flatForm.residentName}
                    onChange={(e) => setFlatForm({ ...flatForm, residentName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={flatForm.phone}
                  onChange={(e) => setFlatForm({ ...flatForm, phone: e.target.value })}
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowFlatForm(false)}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200"
                >
                  Add Flat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminPanel;