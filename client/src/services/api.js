import axios from 'axios';

// Create a base API instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 600000, // 10 minute timeout to allow for very long processing
  withCredentials: true
});

// Add request and response interceptors for better debugging
api.interceptors.request.use(
  config => {
    // Add authorization token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', {
      method: config.method.toUpperCase(),
      url: config.url,
      data: config.data,
      headers: config.headers
    });
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  response => {
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  error => {
    if (error.response) {
      console.error('API Response Error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('API No Response Error:', {
        request: error.request,
        message: 'No response received from server'
      });
    } else {
      console.error('API Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Log the API configuration
console.log('API Configuration:', { 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 600000 
});

// The token interceptor is now merged into the main request interceptor above

// Auth Services
export const authService = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (userData) => api.put('/auth/updatedetails', userData),
  updatePassword: (passwordData) => api.put('/user/updatepassword', passwordData),
};

// Prospecting Services
export const prospectingService = {
  submitProductSearch: (productData) => api.post('/prospecting/search', productData),
  findContacts: (companyData) => api.post('/prospecting/contacts', companyData),
  saveProspect: (prospectData) => api.post('/prospecting/save', prospectData),
  getProspects: () => api.get('/prospecting/prospects'),
  getProspect: (id) => api.get(`/prospecting/prospects/${id}`),
  deleteProspect: (id) => api.delete(`/prospecting/prospects/${id}`),
  getMoreCompanies: (page = 1, pageSize = 10) => api.get(`/prospecting/more-companies?page=${page}&pageSize=${pageSize}`),
};

// User Services
export const userService = {
  getDashboardData: () => api.get('/user/dashboard'),
  getProfile: () => api.get('/user/profile'),
};

export default api;