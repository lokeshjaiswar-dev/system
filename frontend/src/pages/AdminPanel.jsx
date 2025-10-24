import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { adminAPI, flatsAPI, complaintsAPI, maintenanceAPI, noticesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [flats, setFlats] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [bills, setBills] = useState([]);
  const [notices, setNotices] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [showFlatForm, setShowFlatForm] = useState(false);
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  
  const [maintenanceForm, setMaintenanceForm] = useState({
    month: new Date().toLocaleString('default', { month: 'long' }).toLowerCase(),
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
  
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium'
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
      console.log(`🔄 Fetching data for tab: ${activeTab}`);

      // Always fetch stats for dashboard
      if (activeTab === 'dashboard' || activeTab === 'financials') {
        try {
          const statsResponse = await adminAPI.getDashboardStats();
          setStats(statsResponse.data);
          console.log('✅ Stats loaded:', statsResponse.data);
        } catch (error) {
          console.error('❌ Failed to fetch stats:', error);
          toast.error('Failed to load dashboard statistics');
        }
      }

      // Fetch tab-specific data
      switch (activeTab) {
        case 'users':
          try {
            const usersResponse = await adminAPI.getUsers();
            setUsers(usersResponse.data);
            console.log('✅ Users loaded:', usersResponse.data.length);
          } catch (error) {
            console.error('❌ Failed to fetch users:', error);
            toast.error('Failed to load users');
          }
          break;

        case 'flats':
          try {
            const flatsResponse = await flatsAPI.getAll();
            setFlats(flatsResponse.data);
            console.log('✅ Flats loaded:', flatsResponse.data.length);
          } catch (error) {
            console.error('❌ Failed to fetch flats:', error);
            toast.error('Failed to load flats');
          }
          break;

        case 'complaints':
          try {
            const complaintsResponse = await complaintsAPI.getAll();
            setComplaints(complaintsResponse.data);
            console.log('✅ Complaints loaded:', complaintsResponse.data.length);
          } catch (error) {
            console.error('❌ Failed to fetch complaints:', error);
            toast.error('Failed to load complaints');
          }
          break;

        case 'maintenance':
          try {
            const billsResponse = await maintenanceAPI.getAll();
            setBills(billsResponse.data);
            console.log('✅ Maintenance bills loaded:', billsResponse.data.length);
          } catch (error) {
            console.error('❌ Failed to fetch maintenance bills:', error);
            toast.error('Failed to load maintenance bills');
          }
          break;

        case 'notices':
          try {
            const noticesResponse = await noticesAPI.getAll();
            setNotices(noticesResponse.data);
            console.log('✅ Notices loaded:', noticesResponse.data.length);
          } catch (error) {
            console.error('❌ Failed to fetch notices:', error);
            toast.error('Failed to load notices');
          }
          break;

        case 'financials':
          // Stats already loaded above
          break;
      }

    } catch (error) {
      console.error('❌ General fetch error:', error);
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkMaintenance = async (e) => {
    e.preventDefault();
    try {
      console.log('📤 Submitting maintenance form:', maintenanceForm);
      
      const response = await adminAPI.bulkGenerateMaintenance(maintenanceForm);
      
      toast.success(response.data.message || 'Maintenance bills generated successfully');
      setShowMaintenanceForm(false);
      setMaintenanceForm({
        month: new Date().toLocaleString('default', { month: 'long' }).toLowerCase(),
        year: new Date().getFullYear(),
        amount: '',
        dueDate: '',
        description: ''
      });
      
      // Refresh maintenance data
      if (activeTab === 'maintenance') {
        const billsResponse = await maintenanceAPI.getAll();
        setBills(billsResponse.data);
      }
      
      // Refresh stats
      const statsResponse = await adminAPI.getDashboardStats();
      setStats(statsResponse.data);
      
    } catch (error) {
      console.error('❌ Error generating maintenance bills:', error);
      toast.error(error.response?.data?.message || 'Failed to generate maintenance bills');
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
      toast.error(error.response?.data?.message || 'Failed to create flat');
    }
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    try {
      await noticesAPI.create(noticeForm);
      toast.success('Notice created successfully');
      setShowNoticeForm(false);
      setNoticeForm({
        title: '',
        content: '',
        category: 'general',
        priority: 'medium'
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create notice');
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

  const deleteMaintenanceBill = async (billId) => {
    if (!window.confirm('Are you sure you want to delete this maintenance bill?')) {
      return;
    }
    
    try {
      await maintenanceAPI.delete(billId);
      toast.success('Maintenance bill deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete maintenance bill');
    }
  };

  const deleteNotice = async (noticeId) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) {
      return;
    }
    
    try {
      await noticesAPI.delete(noticeId);
      toast.success('Notice deleted successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete notice');
    }
  };

  const updateComplaintStatus = async (complaintId, status) => {
    try {
      await complaintsAPI.update(complaintId, { status });
      toast.success('Complaint status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update complaint status');
    }
  };

  // Debug function to check API connectivity
  const testAPIConnection = async () => {
    try {
      const response = await adminAPI.getDebugData();
      console.log('🔧 Debug data:', response.data);
      toast.success('API connection working! Check console for details.');
    } catch (error) {
      console.error('🔧 Debug failed:', error);
      toast.error('API connection failed. Check console for details.');
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
          <div className="text-white text-xl">Loading {activeTab}...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel 👑</h1>
            <p className="text-gray-400">Manage society operations and residents</p>
          </div>
          <button
            onClick={testAPIConnection}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm transition-colors"
          >
            Test Connection
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-800/50 rounded-lg p-1 overflow-x-auto">
          {['dashboard', 'users', 'flats', 'complaints', 'maintenance', 'notices', 'financials'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all whitespace-nowrap ${
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
          <StatCard 
            title="Total Residents" 
            value={stats.totalResidents || 0} 
            icon="👥"
            color="from-purple-600/20 to-pink-600/20"
          />
          <StatCard 
            title="Total Flats" 
            value={stats.totalFlats || 0} 
            icon="🏢"
            color="from-blue-600/20 to-cyan-600/20"
          />
          <StatCard 
            title="Vacant Flats" 
            value={stats.vacantFlats || 0} 
            icon="🚪"
            color="from-green-600/20 to-emerald-600/20"
          />
          <StatCard 
            title="Pending Complaints" 
            value={stats.pendingComplaints || 0} 
            icon="📝"
            color="from-yellow-600/20 to-orange-600/20"
          />
          <StatCard 
            title="Pending Payments" 
            value={stats.pendingPayments || 0} 
            icon="💰"
            color="from-red-600/20 to-pink-600/20"
          />
          <StatCard 
            title="Active Notices" 
            value={stats.totalNotices || 0} 
            icon="📢"
            color="from-indigo-600/20 to-purple-600/20"
          />
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl border border-purple-500/20 overflow-hidden">
          <div className="p-6 border-b border-purple-500/20">
            <h3 className="text-xl font-semibold text-white">Manage Users</h3>
            <p className="text-gray-400 text-sm mt-1">{users.length} users found</p>
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
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30'
                            : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No users found</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Flats Tab */}
      {activeTab === 'flats' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Manage Flats</h3>
              <p className="text-gray-400 text-sm">{flats.length} flats found</p>
            </div>
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
              {flats.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg">No flats found</div>
                  <p className="text-gray-500 text-sm mt-2">Add flats using the "Add Flat" button</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Complaints Tab */}
      {activeTab === 'complaints' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">Complaints Management</h3>
              <p className="text-gray-400 text-sm">{complaints.length} complaints found</p>
            </div>
          </div>
          
          {complaints.map((complaint) => (
            <div key={complaint._id} className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">{complaint.title}</h4>
                  <p className="text-gray-400 text-sm">
                    By {complaint.raisedBy?.name} ({complaint.raisedBy?.wing}-{complaint.raisedBy?.flatNo}) • {new Date(complaint.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={complaint.status}
                    onChange={(e) => updateComplaintStatus(complaint._id, e.target.value)}
                    className={`text-xs font-medium rounded border px-2 py-1 focus:outline-none focus:ring-1 ${
                      complaint.status === 'pending' 
                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                        : complaint.status === 'in-progress'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>
              <p className="text-gray-300 mb-4">{complaint.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Category: {complaint.category}</span>
                <span className={`text-sm ${
                  complaint.priority === 'high' ? 'text-red-400' :
                  complaint.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  Priority: {complaint.priority}
                </span>
              </div>
            </div>
          ))}
          
          {complaints.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">No complaints found</div>
            </div>
          )}
        </div>
      )}

      {/* Maintenance Tab */}
      {activeTab === 'maintenance' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Maintenance Management</h3>
              <p className="text-gray-400 text-sm">{bills.length} bills found</p>
            </div>
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
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {bills.map((bill) => (
                    <tr key={bill._id} className="hover:bg-purple-500/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-white">{bill.wing}-{bill.flatNo}</td>
                      <td className="px-6 py-4 text-sm text-white capitalize">{bill.month} {bill.year}</td>
                      <td className="px-6 py-4 text-sm text-white">₹{bill.amount}</td>
                      <td className="px-6 py-4 text-sm text-white">
                        {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'Not set'}
                      </td>
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
                      <td className="px-6 py-4">
                        <button
                          onClick={() => deleteMaintenanceBill(bill._id)}
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {bills.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg">No maintenance bills found</div>
                  <p className="text-gray-500 text-sm mt-2">
                    Use the "Generate Bills" button to create maintenance bills for all residents.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notices Tab */}
      {activeTab === 'notices' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Notices Management</h3>
              <p className="text-gray-400 text-sm">{notices.length} notices found</p>
            </div>
            <button
              onClick={() => setShowNoticeForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200"
            >
              + Create Notice
            </button>
          </div>

          <div className="space-y-6">
            {notices.map((notice) => (
              <div key={notice._id} className="bg-gray-800/30 backdrop-blur-lg rounded-xl p-6 border border-purple-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{notice.title}</h4>
                    <p className="text-gray-400 text-sm">
                      By {notice.createdBy?.name} • {new Date(notice.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      notice.priority === 'high' 
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : notice.priority === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-green-500/20 text-green-400 border border-green-500/30'
                    }`}>
                      {notice.priority}
                    </span>
                    <button
                      onClick={() => deleteNotice(notice._id)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap">{notice.content}</p>
                <div className="mt-3">
                  <span className="text-sm text-gray-400">Category: {notice.category}</span>
                </div>
              </div>
            ))}
            
            {notices.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-lg">No notices found</div>
                <p className="text-gray-500 text-sm mt-2">Create notices using the "Create Notice" button</p>
              </div>
            )}
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
        <MaintenanceModal 
          form={maintenanceForm}
          setForm={setMaintenanceForm}
          onSubmit={handleBulkMaintenance}
          onClose={() => setShowMaintenanceForm(false)}
        />
      )}

      {/* Add Flat Modal */}
      {showFlatForm && (
        <FlatModal 
          form={flatForm}
          setForm={setFlatForm}
          onSubmit={handleCreateFlat}
          onClose={() => setShowFlatForm(false)}
        />
      )}

      {/* Create Notice Modal */}
      {showNoticeForm && (
        <NoticeModal 
          form={noticeForm}
          setForm={setNoticeForm}
          onSubmit={handleCreateNotice}
          onClose={() => setShowNoticeForm(false)}
        />
      )}
    </Layout>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => (
  <div className={`bg-gradient-to-br ${color} rounded-xl p-6 border border-purple-500/30`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);

// Maintenance Modal Component
const MaintenanceModal = ({ form, setForm, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-purple-500/30">
      <h3 className="text-xl font-bold text-white mb-4">Generate Maintenance Bills</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
            <select
              required
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={form.month}
              onChange={(e) => setForm({ ...form, month: e.target.value })}
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
              min="2020"
              max="2030"
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: parseInt(e.target.value) })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Amount (₹)</label>
          <input
            type="number"
            required
            min="0"
            step="0.01"
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) })}
            placeholder="Enter amount"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Due Date</label>
          <input
            type="date"
            required
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
          <textarea
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows="3"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Maintenance bill description..."
          />
        </div>
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <p className="text-blue-400 text-sm">
            💡 This will generate maintenance bills for all occupied flats (permanent & rented residents).
          </p>
        </div>
        
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={onClose}
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
);

// Flat Modal Component
const FlatModal = ({ form, setForm, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-purple-500/30">
      <h3 className="text-xl font-bold text-white mb-4">Add New Flat</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Wing</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={form.wing}
              onChange={(e) => setForm({ ...form, wing: e.target.value.toUpperCase() })}
              placeholder="A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Flat No</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={form.flatNo}
              onChange={(e) => setForm({ ...form, flatNo: e.target.value })}
              placeholder="101"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            required
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
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
              value={form.ownerName}
              onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Resident Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={form.residentName}
              onChange={(e) => setForm({ ...form, residentName: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
          <input
            type="tel"
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Optional"
          />
        </div>
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={onClose}
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
);

// Notice Modal Component
const NoticeModal = ({ form, setForm, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl border border-purple-500/30">
      <h3 className="text-xl font-bold text-white mb-4">Create New Notice</h3>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
          <input
            type="text"
            required
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Notice title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
          <textarea
            required
            rows="6"
            className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Notice content..."
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="general">General</option>
              <option value="maintenance">Maintenance</option>
              <option value="emergency">Emergency</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
            <select
              className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg text-white font-medium transition-all duration-200"
          >
            Create Notice
          </button>
        </div>
      </form>
    </div>
  </div>
);

export default AdminPanel;