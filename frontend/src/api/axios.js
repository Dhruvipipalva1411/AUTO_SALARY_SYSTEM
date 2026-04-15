import axios from 'axios';

// Create axios instance with base configuration
const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds
});

// Request interceptor - attach token to all requests
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors globally
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle different error scenarios
        if (error.response) {
            // Server responded with error status
            const { status, data } = error.response;

            switch (status) {
                case 401:
                    // Unauthorized - clear token and redirect to login
                    console.error('Unauthorized access - logging out');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                    break;

                case 403:
                    // Forbidden - user doesn't have permission
                    console.error('Access forbidden');
                    break;

                case 404:
                    // Not found
                    console.error('Resource not found');
                    break;

                case 500:
                    // Server error
                    console.error('Server error:', data.message || 'Internal server error');
                    break;

                default:
                    console.error('API Error:', data.message || 'An error occurred');
            }
        } else if (error.request) {
            // Request made but no response received
            console.error('Network error - no response from server');
        } else {
            // Error in request setup
            console.error('Request error:', error.message);
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
