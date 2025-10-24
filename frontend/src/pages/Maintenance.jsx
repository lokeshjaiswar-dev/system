import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { maintenanceAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Maintenance = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await maintenanceAPI.getAll();
      console.log('Fetched bills:', response.data);
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching maintenance bills:', error);
      toast.error('Failed to fetch maintenance bills');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (billId, paymentMethod) => {
    try {
      console.log('Processing payment for bill:', billId, 'method:', paymentMethod);
      
      const response = await maintenanceAPI.pay(billId, paymentMethod);
      
      toast.success('Payment successful! Confirmation email sent.');
      setShowPayment(null);
      
      // Refresh the bills list
      fetchBills();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'overdue': return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-white text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Maintenance Management</h1>
        <p className="text-gray-400">View and pay your maintenance bills</p>
      </div>

      {/* Bills Table */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl border border-purple-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-500/20">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Month</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Year</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {bills.map((bill) => (
                <tr key={bill._id} className="hover:bg-purple-500/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-white capitalize">{bill.month}</td>
                  <td className="px-6 py-4 text-sm text-white">{bill.year}</td>
                  <td className="px-6 py-4 text-sm text-white font-medium">
                    {formatCurrency(bill.amount)}
                  </td>
                  <td className="px-6 py-4 text-sm text-white">
                    {bill.dueDate ? new Date(bill.dueDate).toLocaleDateString() : 'Not set'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bill.status)}`}>
                      {bill.status?.charAt(0).toUpperCase() + bill.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {bill.status === 'pending' && user?.role === 'resident' && (
                      <button
                        onClick={() => setShowPayment(bill)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all duration-200 transform hover:scale-105"
                      >
                        Pay Now
                      </button>
                    )}
                    {bill.status === 'paid' && bill.paidDate && (
                      <span className="text-green-400 text-sm">
                        Paid on {new Date(bill.paidDate).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {bills.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No maintenance bills found</div>
            <p className="text-gray-500 text-sm mt-2">
              {user?.role === 'admin' 
                ? 'Generate maintenance bills from the Admin Panel.'
                : 'No maintenance bills have been generated for your flat yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-purple-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">Make Payment</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-semibold">{formatCurrency(showPayment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Period:</span>
                <span className="text-white capitalize">{showPayment.month} {showPayment.year}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Due Date:</span>
                <span className="text-white">
                  {showPayment.dueDate ? new Date(showPayment.dueDate).toLocaleDateString() : 'Not set'}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-white font-semibold mb-2">Select Payment Method</h3>
              <button
                onClick={() => handlePayment(showPayment._id, 'razorpay')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>💳 Pay with Razorpay</span>
              </button>
              <button
                onClick={() => handlePayment(showPayment._id, 'stripe')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>💳 Pay with Stripe</span>
              </button>
              <button
                onClick={() => handlePayment(showPayment._id, 'upi')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>📱 UPI Payment</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowPayment(null)}
              className="w-full mt-4 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Maintenance;