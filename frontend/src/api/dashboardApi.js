import axiosInstance from './axios';

/**
 * Dashboard API functions
 */

/**
 * Get dashboard statistics
 * @returns {Promise} Dashboard stats (employee counts, attendance, payroll)
 */
export const getDashboardStats = async () => {
    try {
        const response = await axiosInstance.get('/dashboard/stats');
        return response.data;
    } catch (error) {
        throw error;
    }
};

/**
 * Get recent activity
 * @returns {Promise} Recent attendance activity
 */
export const getRecentActivity = async () => {
    try {
        const response = await axiosInstance.get('/dashboard/recent-activity');
        return response.data;
    } catch (error) {
        throw error;
    }
};
