import axiosInstance from './axios';

/**
 * Authentication API functions
 */

/**
 * Login user with username and password
 * @param {string} username - User's username
 * @param {string} password - User's password
 * @returns {Promise} Response with access_token and user data
 */
export const login = async (username, password) => {
    try {
        const response = await axiosInstance.post('/login', {
            username,
            password,
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Logout user - clear local storage
 */
export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
};

/**
 * Get current user from localStorage
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }
    return null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if token exists
 */
export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    return !!token;
};

/**
 * Get token from localStorage
 * @returns {string|null} JWT token or null
 */
export const getToken = () => {
    return localStorage.getItem('token');
};

/**
 * Set token in localStorage
 * @param {string} token - JWT token
 */
export const setToken = (token) => {
    localStorage.setItem('token', token);
};

/**
 * Set user data in localStorage
 * @param {Object} user - User object
 */
export const setUser = (user) => {
    localStorage.setItem('user', JSON.stringify(user));
};
