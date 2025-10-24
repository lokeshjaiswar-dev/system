import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { flatsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Flats = () => {
  const [flats, setFlats] = useState([]);
  const [wings, setWings] = useState([]);
  const [selectedWing, setSelectedWing] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, [selectedWing]);

  const fetchData = async () => {
    try {
      const [flatsResponse, wingsResponse] = await Promise.all([
        flatsAPI.getAll(selectedWing),
        flatsAPI.getWings()
      ]);
      setFlats(flatsResponse.data);
      setWings(wingsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch flats data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'permanent': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rented': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'vacant': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
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
        <h1 className="text-3xl font-bold text-white mb-2">Flat Management</h1>
        <p className="text-gray-400">View all society flats and their details</p>
      </div>

      {/* Wing Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setSelectedWing('')}
            className={`px-4 py-2 rounded-lg border transition-all ${
              selectedWing === ''
                ? 'bg-purple-600 text-white border-purple-500'
                : 'bg-gray-800/50 text-gray-300 border-gray-600 hover:border-purple-500/50'
            }`}
          >
            All Wings
          </button>
          {wings.map((wing) => (
            <button
              key={wing}
              onClick={() => setSelectedWing(wing)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                selectedWing === wing
                  ? 'bg-purple-600 text-white border-purple-500'
                  : 'bg-gray-800/50 text-gray-300 border-gray-600 hover:border-purple-500/50'
              }`}
            >
              Wing {wing}
            </button>
          ))}
        </div>
      </div>

      {/* Flats Table */}
      <div className="bg-gray-800/30 backdrop-blur-lg rounded-xl border border-purple-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-purple-500/20">
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Wing</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Flat No</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Owner Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Resident Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-500/10">
              {flats.map((flat) => (
                <tr key={flat._id} className="hover:bg-purple-500/5 transition-colors">
                  <td className="px-6 py-4 text-sm text-white">{flat.wing}</td>
                  <td className="px-6 py-4 text-sm text-white font-medium">{flat.flatNo}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(flat.status)}`}>
                      {flat.status?.charAt(0).toUpperCase() + flat.status?.slice(1)}
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
        
        {flats.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No flats found</div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Flats;