import { useAuth } from '../auth/AuthContext';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import axios from '../api/axios';

/**
 * Premium Attendance Page
 * Features: Employee ID input for check-in/out, employee selection for today's view
 */
const Attendance = () => {
    const { user } = useAuth();
    const { addToast } = useToast();

    const [attendance, setAttendance] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
    const [checkInOutEmployeeId, setCheckInOutEmployeeId] = useState('');
    const [todayAttendance, setTodayAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [markingAttendance, setMarkingAttendance] = useState({});

    // Date filtering state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [activeQuickFilter, setActiveQuickFilter] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch attendance records
            const attendanceRes = await axios.get('/attendance');
            const attendanceData = attendanceRes.data.attendance || attendanceRes.data || [];
            setAttendance(Array.isArray(attendanceData) ? attendanceData : []);

            // Fetch employees list
            const employeesRes = await axios.get('/users');
            const employeesData = employeesRes.data.users || employeesRes.data || [];
            setEmployees(Array.isArray(employeesData) ? employeesData : []);
        } catch (err) {
            console.error('Error fetching data:', err);
            addToast('Failed to load data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckInOut = async () => {
        if (!checkInOutEmployeeId) {
            addToast('Please enter Employee ID or User ID', 'warning');
            return;
        }

        try {
            setActionLoading(true);
            // Send as both employee_id and user_id to support both
            const response = await axios.post('/checkinout', {
                employee_id: parseInt(checkInOutEmployeeId),
                user_id: parseInt(checkInOutEmployeeId)
            });

            addToast(response.data.msg || 'Attendance recorded successfully!', 'success');
            setCheckInOutEmployeeId('');
            await fetchData();

            // Refresh today's attendance if same employee
            if (selectedEmployeeId === checkInOutEmployeeId) {
                fetchTodayAttendance(checkInOutEmployeeId);
            }
        } catch (err) {
            addToast(err.response?.data?.msg || 'Failed to record attendance', 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleQuickMarkAttendance = async (id) => {
        setMarkingAttendance({ ...markingAttendance, [id]: true });
        try {
            // Support generic ID (User ID preferred)
            const response = await axios.post('/checkinout', {
                employee_id: id,
                user_id: id
            });
            addToast(response.data.msg || 'Attendance marked successfully!', 'success');
            await fetchData();
        } catch (err) {
            addToast(err.response?.data?.msg || 'Failed to mark attendance', 'error');
        } finally {
            setMarkingAttendance({ ...markingAttendance, [id]: false });
        }
    };

    const fetchTodayAttendance = async (empId) => {
        if (!empId) {
            setTodayAttendance(null);
            return;
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const todayRecord = attendance.find(record => {
                const recordDate = new Date(record.date).toISOString().split('T')[0];
                return recordDate === today && (record.user_id === parseInt(empId) || record.employee_id === parseInt(empId));
            });
            setTodayAttendance(todayRecord || null);
        } catch (err) {
            console.error('Error fetching today attendance:', err);
        }
    };

    useEffect(() => {
        if (selectedEmployeeId) {
            fetchTodayAttendance(selectedEmployeeId);
        }
    }, [selectedEmployeeId, attendance]);

    const formatTime = (datetime) => {
        if (!datetime) return 'N/A';
        return new Date(datetime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Quick filter functions
    const setTodayFilter = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
        setActiveQuickFilter('today');
    };

    const setThisWeekFilter = () => {
        const today = new Date();
        const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
        const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
        setActiveQuickFilter('week');
    };

    const setThisMonthFilter = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
        setActiveQuickFilter('month');
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStartDate('');
        setEndDate('');
        setActiveQuickFilter('');
    };

    // Filter attendance records based on search term and date
    const filteredAttendance = attendance.filter(record => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
            record.user_id?.toString().includes(searchLower) ||
            record.employee_id?.toString().includes(searchLower) ||
            record.employee_name?.toLowerCase().includes(searchLower)
        );

        // Date filtering
        let matchesDate = true;
        if (startDate || endDate) {
            const recordDate = new Date(record.date).toISOString().split('T')[0];
            if (startDate && endDate) {
                matchesDate = recordDate >= startDate && recordDate <= endDate;
            } else if (startDate) {
                matchesDate = recordDate === startDate;
            } else if (endDate) {
                matchesDate = recordDate <= endDate;
            }
        }

        return matchesSearch && matchesDate;
    });

    const getStatusBadge = (record) => {
        if (record.check_in && record.check_out) {
            return (
                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 animate-fade-in">
                    ✓ Complete
                </span>
            );
        } else if (record.check_in) {
            return (
                <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 animate-fade-in">
                    ⏱ Checked In
                </span>
            );
        }
        return (
            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                ○ Pending
            </span>
        );
    };

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 p-8 overflow-auto min-h-screen">
                    {/* Page Header */}
                    <div className="mb-8 animate-fade-in">
                        <h1 className="text-3xl font-semibold text-slate-100 mb-2">
                            Attendance Management
                        </h1>
                        <p className="text-slate-400">
                            Track and manage employee attendance with ease
                        </p>
                    </div>

                    <div className="mb-8">
                        {/* Today's Attendance Card */}
                        <div className="card p-8 border border-cyan-500/20 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-100">Today's Attendance</h2>
                                    <p className="text-sm text-slate-400">{formatDate(new Date())}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                                        Select Employee
                                    </label>
                                    <select
                                        value={selectedEmployeeId}
                                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="" className="bg-slate-800 text-slate-300">-- Select Employee --</option>
                                        {employees.map(emp => (
                                            <option key={emp.id} value={emp.id} className="bg-slate-800 text-slate-200">
                                                {emp.username} (User ID: {emp.id})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedEmployeeId && (
                                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-3">
                                        {todayAttendance ? (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-400">Check-in</span>
                                                    <span className="text-sm font-bold text-emerald-400">
                                                        {formatTime(todayAttendance.check_in)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-400">Check-out</span>
                                                    <span className="text-sm font-bold text-rose-400">
                                                        {todayAttendance.check_out ? formatTime(todayAttendance.check_out) : 'Not checked out'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-slate-400">Hours</span>
                                                    <span className="text-sm font-bold text-slate-200">
                                                        {todayAttendance.working_hours || '0'} hrs
                                                    </span>
                                                </div>
                                                <div className="pt-3 border-t border-slate-700/50">
                                                    {getStatusBadge(todayAttendance)}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-center py-4">
                                                <svg className="w-12 h-12 text-slate-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                </svg>
                                                <p className="text-sm text-slate-400">No attendance record for today</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Enhanced Search and Filter Bar */}
                    <div className="mb-6 space-y-4">
                        {/* Search Input */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by employee name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-700/50 bg-slate-800/50 text-slate-100 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Date Filters and Quick Buttons */}
                        <div className="flex flex-wrap gap-3 items-center">
                            {/* Date Range Inputs */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setActiveQuickFilter('');
                                    }}
                                    className="px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-slate-200 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                    placeholder="Start Date"
                                />
                                <span className="text-slate-400 text-sm">to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setActiveQuickFilter('');
                                    }}
                                    className="px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-slate-200 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                                    placeholder="End Date"
                                />
                            </div>

                            {/* Quick Filter Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={setTodayFilter}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeQuickFilter === 'today'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                                        }`}
                                >
                                    Today
                                </button>
                                <button
                                    onClick={setThisWeekFilter}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeQuickFilter === 'week'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                                        }`}
                                >
                                    This Week
                                </button>
                                <button
                                    onClick={setThisMonthFilter}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeQuickFilter === 'month'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                                        }`}
                                >
                                    This Month
                                </button>
                            </div>

                            {/* Clear Filters Button */}
                            {(searchTerm || startDate || endDate) && (
                                <button
                                    onClick={clearFilters}
                                    className="px-3 py-2 rounded-lg text-sm font-medium bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    Clear Filters
                                </button>
                            )}
                        </div>

                        {/* Active Filters Indicator */}
                        {(searchTerm || startDate || endDate) && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span>
                                    Showing {filteredAttendance.length} of {attendance.length} records
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Attendance History Table */}
                    <div className="bg-slate-700/50 rounded-lg shadow-sm overflow-hidden border border-slate-600/50">
                        <div className="px-6 py-4 border-b border-slate-600 bg-slate-700/30">
                            <h2 className="text-lg font-semibold text-slate-100 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Attendance History ({filteredAttendance.length} records)
                            </h2>
                        </div>

                        {loading ? (
                            <LoadingSpinner text="Loading attendance records..." />
                        ) : filteredAttendance.length === 0 ? (
                            <EmptyState
                                title="No attendance records"
                                description={searchTerm ? "No records match your search" : "Start by marking attendance to create records"}
                                icon={
                                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                }
                            />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Check In</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Check Out</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Hours</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Status</th>
                                            {(user?.role === 'Admin' || user?.role === 'HR') && (
                                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-200 uppercase tracking-wider">Action</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {filteredAttendance.map((record) => (
                                            <tr key={record.id} className="hover:bg-cyan-500/5 transition-colors duration-200 group">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3 group-hover:scale-110 transition-transform">
                                                            {new Date(record.date).getDate()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-slate-200">{formatDate(record.date)}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 group-hover:scale-110 transition-transform">
                                                            {record.user_id || record.employee_id}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-200">
                                                                {record.employee_name || 'Unknown'}
                                                            </div>
                                                            <div className="text-xs text-slate-400">
                                                                User ID: {record.user_id || record.employee_id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {record.check_in ? (
                                                        <span className="text-sm font-medium text-emerald-400 flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {formatTime(record.check_in)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-slate-500">Not checked in</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {record.check_out ? (
                                                        <span className="text-sm font-medium text-rose-400 flex items-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                            </svg>
                                                            {formatTime(record.check_out)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-slate-500">Not checked out</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">
                                                    {record.working_hours_formatted || (record.working_hours ? `${record.working_hours} hrs` : '0 hrs')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(record)}
                                                </td>
                                                {(user?.role === 'Admin' || user?.role === 'HR') && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <button
                                                            onClick={() => handleQuickMarkAttendance(record.user_id || record.employee_id)}
                                                            disabled={markingAttendance[record.employee_id]}
                                                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-400/90 to-teal-400/90 hover:from-emerald-500/90 hover:to-teal-500/90 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                                        >
                                                            {markingAttendance[record.employee_id] ? (
                                                                <>
                                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                                                    Marking...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    Mark
                                                                </>
                                                            )}
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Attendance;
