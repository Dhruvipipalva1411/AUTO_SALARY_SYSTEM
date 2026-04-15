import { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout, getCurrentUser, setToken, setUser } from '../api/authApi';

// Create Auth Context
const AuthContext = createContext(null);

/**
 * Custom hook to use auth context
 * @returns {Object} Auth context value
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

/**
 * Auth Provider Component
 * Manages authentication state across the application
 */
export const AuthProvider = ({ children }) => {
    const [user, setUserState] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Check if user is already logged in on mount
    useEffect(() => {
        const initAuth = () => {
            try {
                const token = localStorage.getItem('token');
                const savedUser = getCurrentUser();

                if (token && savedUser) {
                    setUserState(savedUser);
                }
            } catch (err) {
                console.error('Error initializing auth:', err);
                // Clear invalid data
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    /**
     * Login function
     * @param {string} username - User's username
     * @param {string} password - User's password
     * @returns {Promise} Login result
     */
    const login = async (username, password) => {
        try {
            setLoading(true);
            setError(null);

            // Call login API
            const response = await apiLogin(username, password);

            // Extract access_token, role, and user_id from response
            const { access_token, role, user_id } = response;

            if (!access_token) {
                throw new Error('No token received from server');
            }

            // Create user object with id
            const userData = {
                id: user_id,  // Add user ID
                username,
                role: role || 'user',
            };

            // Save to localStorage
            setToken(access_token);
            setUser(userData);

            // Update state
            setUserState(userData);

            return { success: true, user: userData };
        } catch (err) {
            const errorMessage = err.response?.data?.msg || err.message || 'Login failed';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Logout function
     */
    const logout = () => {
        apiLogout();
        setUserState(null);
        setError(null);
    };

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    const isAuthenticated = () => {
        return !!user && !!localStorage.getItem('token');
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        isAuthenticated,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
