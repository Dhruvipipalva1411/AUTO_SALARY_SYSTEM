import { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';

/**
 * Custom hook for dashboard statistics
 * Fetches and manages dashboard data
 */
export const useDashboardStats = () => {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        totalSalary: 0,
        pendingSalary: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('/dashboard/stats');
            const data = response.data;

            setStats({
                totalEmployees: data.total_employees || 0,
                presentToday: data.present_today || 0,
                absentToday: (data.total_employees || 0) - (data.present_today || 0),
                totalSalary: data.total_salary || 0,
                pendingSalary: data.pending_salary || 0
            });
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError(err.response?.data?.msg || 'Failed to load dashboard statistics');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        // Refresh every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    return { stats, loading, error, refreshStats: fetchStats };
};
