import { useState, useEffect, useCallback } from 'react';
import axios from '../api/axios';

/**
 * Custom hook for attendance management
 * Handles fetching, check-in, and check-out operations
 */
export const useAttendance = () => {
    const [attendance, setAttendance] = useState([]);
    const [todayStatus, setTodayStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Fetch all attendance records
    const fetchAttendance = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('/attendance');
            const data = response.data.attendance || response.data || [];
            setAttendance(Array.isArray(data) ? data : []);

            // Check today's status
            const today = new Date().toISOString().split('T')[0];
            const todayRecord = data.find(record => {
                const recordDate = new Date(record.date).toISOString().split('T')[0];
                return recordDate === today;
            });
            setTodayStatus(todayRecord || null);
        } catch (err) {
            console.error('Error fetching attendance:', err);
            setError(err.response?.data?.msg || 'Failed to load attendance records');
        } finally {
            setLoading(false);
        }
    }, []);

    // Check in/out
    const checkInOut = useCallback(async (employeeId) => {
        try {
            setActionLoading(true);
            setError(null);
            const response = await axios.post('/checkinout', { employee_id: employeeId });
            await fetchAttendance(); // Refresh data
            return { success: true, message: response.data.msg };
        } catch (err) {
            const errorMsg = err.response?.data?.msg || 'Failed to record attendance';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setActionLoading(false);
        }
    }, [fetchAttendance]);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    return {
        attendance,
        todayStatus,
        loading,
        error,
        actionLoading,
        checkInOut,
        refreshAttendance: fetchAttendance
    };
};
