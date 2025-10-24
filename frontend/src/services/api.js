import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle responses and errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (email, code) => api.post('/auth/verify-email', { email, code }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Admin API
export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard-stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  bulkGenerateMaintenance: (data) => api.post('/admin/maintenance/bulk-generate', data),
  getFinancialSummary: (month, year) => 
    api.get(`/admin/financial-summary${month && year ? `?month=${month}&year=${year}` : ''}`),
  assignResident: (userId, flatId) => api.post('/admin/assign-resident', { userId, flatId }),
  getAvailableResidents: () => api.get('/admin/available-residents'),
  getDebugData: () => api.get('/admin/debug/data'),
};

// Maintenance API
export const maintenanceAPI = {
  getAll: () => api.get('/maintenance'),
  create: (billData) => api.post('/maintenance', billData),
  createBulk: (bills) => api.post('/maintenance/bulk', { bills }),
  pay: (id, paymentMethod) => api.put(`/maintenance/${id}/pay`, { paymentMethod }),
  delete: (id) => api.delete(`/maintenance/${id}`),
  getStats: () => api.get('/maintenance/stats/overview'),
};

// Flats API
export const flatsAPI = {
  getAll: (wing) => api.get(`/flats${wing ? `?wing=${wing}` : ''}`),
  getWings: () => api.get('/flats/wings'),
  create: (flatData) => api.post('/flats', flatData),
  update: (id, flatData) => api.put(`/flats/${id}`, flatData),
  delete: (id) => api.delete(`/flats/${id}`),
};

// Notices API
export const noticesAPI = {
  getAll: () => api.get('/notices'),
  create: (noticeData) => api.post('/notices', noticeData),
  update: (id, noticeData) => api.put(`/notices/${id}`, noticeData),
  delete: (id) => api.delete(`/notices/${id}`),
};

// Complaints API
export const complaintsAPI = {
  getAll: () => api.get('/complaints'),
  create: (complaintData) => api.post('/complaints', complaintData),
  update: (id, complaintData) => api.put(`/complaints/${id}`, complaintData),
};

// Memory Lane API
export const memoryLaneAPI = {
  getAll: (date) => api.get(`/memorylane${date ? `?date=${date}` : ''}`),
  create: (memoryData) => api.post('/memorylane', memoryData),
  addComment: (id, comment) => api.post(`/memorylane/${id}/comments`, { comment }),
  toggleLike: (id) => api.post(`/memorylane/${id}/like`),
};

export default api;