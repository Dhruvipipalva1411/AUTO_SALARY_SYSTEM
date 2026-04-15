import { useAuth } from '../auth/AuthContext';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { useToast } from '../components/Toast';
import axios from '../api/axios';

/**
 * Salary Page Component with Mark as Paid functionality
 */
const Salary = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [salaries, setSalaries] = useState([]);
    const [filteredSalaries, setFilteredSalaries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [generating, setGenerating] = useState(false);
    const [markingPaid, setMarkingPaid] = useState({});

    const [formData, setFormData] = useState({
        employee_ids: []  // Changed to array for multi-select
    });

    // Month/Year filtering state
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [activeQuickFilter, setActiveQuickFilter] = useState('');

    useEffect(() => {
        fetchSalaries();
        fetchEmployees();
    }, []);

    useEffect(() => {
        let filtered = salaries.filter(salary =>
            salary.user_id?.toString().includes(searchTerm) ||
            salary.employee_id?.toString().includes(searchTerm) ||
            salary.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            salary.period?.includes(searchTerm)
        );

        // Month/Year filtering
        if (selectedMonth || selectedYear) {
            filtered = filtered.filter(salary => {
                const salaryDate = new Date(salary.payment_date || salary.created_at);
                const matchMonth = !selectedMonth || salaryDate.getMonth() === parseInt(selectedMonth);
                const matchYear = !selectedYear || salaryDate.getFullYear() === parseInt(selectedYear);
                return matchMonth && matchYear;
            });
        }

        setFilteredSalaries(filtered);
    }, [searchTerm, salaries, selectedMonth, selectedYear]);

    const fetchSalaries = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/salaries');
            const salaryData = response.data.salaries || response.data || [];
            setSalaries(Array.isArray(salaryData) ? salaryData : []);
            setFilteredSalaries(Array.isArray(salaryData) ? salaryData : []);
        } catch (err) {
            console.error('Error fetching salaries:', err);
            setError('Failed to load salary records');
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get('/users');
            const userData = response.data.users || response.data || [];
            // Filter to get only employees with employee records
            const employeeList = Array.isArray(userData) ? userData : [];
            setEmployees(employeeList);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    // Quick filter functions
    const setCurrentMonthFilter = () => {
        const today = new Date();
        setSelectedMonth(today.getMonth().toString());
        setSelectedYear(today.getFullYear().toString());
        setActiveQuickFilter('current');
    };

    const setLastMonthFilter = () => {
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        setSelectedMonth(lastMonth.getMonth().toString());
        setSelectedYear(lastMonth.getFullYear().toString());
        setActiveQuickFilter('last');
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedMonth('');
        setSelectedYear('');
        setActiveQuickFilter('');
    };

    const handleGenerateSalary = async (e) => {
        e.preventDefault();

        if (formData.employee_ids.length === 0) {
            setError('Please select at least one employee');
            setTimeout(() => setError(null), 3000);
            return;
        }

        setGenerating(true);
        try {
            const response = await axios.post('/salary', {
                employee_ids: formData.employee_ids.map(id => parseInt(id))
            });

            // Show detailed success message
            const { success_count, failed_count, skipped_count, generated_salaries, failed, skipped } = response.data;

            let message = `Salary generation complete:\n`;
            message += `✅ ${success_count} succeeded\n`;
            if (skipped_count > 0) message += `⏭️ ${skipped_count} skipped (already generated)\n`;
            if (failed_count > 0) message += `❌ ${failed_count} failed`;

            setSuccessMessage(message);

            // Show failures if any
            if (failed.length > 0) {
                const failureDetails = failed.map(f => `Employee ID ${f.employee_id}: ${f.reason}`).join('\n');
                console.error('Failures:', failureDetails);
            }

            setShowGenerateModal(false);
            setFormData({ employee_ids: [] });
            fetchSalaries();
            setTimeout(() => setSuccessMessage(''), 8000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to generate salary');
            setTimeout(() => setError(null), 3000);
        } finally {
            setGenerating(false);
        }
    };

    const handleSelectAll = () => {
        const employeesWithRecords = employees.filter(emp => emp.employee_id !== null);
        const allIds = employeesWithRecords.map(emp => emp.employee_id.toString());
        setFormData({ employee_ids: allIds });
    };

    const handleDeselectAll = () => {
        setFormData({ employee_ids: [] });
    };

    const handleEmployeeToggle = (employeeId) => {
        const idStr = employeeId.toString();
        const currentIds = formData.employee_ids;

        if (currentIds.includes(idStr)) {
            setFormData({ employee_ids: currentIds.filter(id => id !== idStr) });
        } else {
            setFormData({ employee_ids: [...currentIds, idStr] });
        }
    };

    const handleMarkAsPaid = async (salaryId) => {
        setMarkingPaid(prev => ({ ...prev, [salaryId]: true }));
        try {
            const response = await axios.put(`/salary/mark-paid/${salaryId}`);
            addToast(response.data.msg || 'Salary marked as paid!', 'success');
            await fetchSalaries(); // Refresh the list
        } catch (err) {
            addToast(err.response?.data?.msg || 'Failed to mark salary as paid', 'error');
        } finally {
            setMarkingPaid(prev => ({ ...prev, [salaryId]: false }));
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    };

    const formatDate = (datetime) => {
        if (!datetime) return 'N/A';
        return new Date(datetime).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatHours = (decimalHours) => {
        if (!decimalHours || decimalHours === 0) return '0h 0m';
        const totalMinutes = Math.round(decimalHours * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}h ${minutes}m`;
    };

    const isAdmin = user?.role === 'Admin' || user?.role === 'HR';

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 p-8 overflow-auto min-h-screen">
                    {/* Page Header */}
                    <div className="mb-8 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-semibold text-slate-100 mb-2">
                                    Salary Management
                                </h1>
                                <p className="text-slate-400">
                                    {isAdmin ? 'Generate and manage employee salary records' : 'View salary records'}
                                </p>
                            </div>
                            {isAdmin && (
                                <button
                                    onClick={() => setShowGenerateModal(true)}
                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 flex items-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>Generate Salary</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl animate-fade-in">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-sm text-green-700">{successMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl animate-fade-in">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

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

                        {/* Month/Year Filters and Quick Buttons */}
                        <div className="flex flex-wrap gap-3 items-center">
                            {/* Month Selector */}
                            <select
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value);
                                    setActiveQuickFilter('');
                                }}
                                className="px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-slate-200 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                            >
                                <option value="">All Months</option>
                                <option value="0">January</option>
                                <option value="1">February</option>
                                <option value="2">March</option>
                                <option value="3">April</option>
                                <option value="4">May</option>
                                <option value="5">June</option>
                                <option value="6">July</option>
                                <option value="7">August</option>
                                <option value="8">September</option>
                                <option value="9">October</option>
                                <option value="10">November</option>
                                <option value="11">December</option>
                            </select>

                            {/* Year Selector */}
                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(e.target.value);
                                    setActiveQuickFilter('');
                                }}
                                className="px-3 py-2 rounded-lg border border-slate-700/50 bg-slate-800/50 text-slate-200 text-sm focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none"
                            >
                                <option value="">All Years</option>
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            {/* Quick Filter Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={setCurrentMonthFilter}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeQuickFilter === 'current'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                                        }`}
                                >
                                    Current Month
                                </button>
                                <button
                                    onClick={setLastMonthFilter}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeQuickFilter === 'last'
                                        ? 'bg-cyan-500 text-white'
                                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                                        }`}
                                >
                                    Last Month
                                </button>
                            </div>

                            {/* Clear Filters Button */}
                            {(searchTerm || selectedMonth || selectedYear) && (
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
                        {(searchTerm || selectedMonth || selectedYear) && (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span>
                                    Showing {filteredSalaries.length} of {salaries.length} records
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Salary Table */}
                    <div className="bg-slate-700/50 rounded-lg shadow-sm overflow-hidden border border-slate-600/50">
                        <div className="px-6 py-4 border-b border-slate-600 bg-slate-700/30">
                            <h2 className="text-lg font-semibold text-slate-100 flex items-center">
                                <svg className="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Salary Records ({filteredSalaries.length})
                            </h2>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading salaries...</p>
                            </div>
                        ) : filteredSalaries.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <p className="text-slate-600 mb-2">
                                    {searchTerm ? 'No salary records match your search' : 'No salary records found'}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {searchTerm ? 'Try a different search term' : isAdmin ? 'Generate salary records to see them here' : 'Salary records will appear here'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-800/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Period</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Hours</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Rate</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Gross Salary</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Generated</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-slate-200 uppercase tracking-wider">Payment Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {filteredSalaries.map((salary) => (
                                            <tr key={salary.id} className="hover:bg-cyan-500/5 transition-colors duration-200 group">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">{salary.id}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3 group-hover:scale-110 transition-transform">
                                                            {salary.user_id || salary.employee_id}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-200">
                                                                {salary.employee_name || 'Unknown'}
                                                            </div>
                                                            <div className="text-xs text-slate-400">
                                                                User ID: {salary.user_id || salary.employee_id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {salary.period || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">
                                                    {formatHours(salary.total_hours)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                                                    {formatCurrency(salary.hourly_rate)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-400">
                                                    {formatCurrency(salary.gross_salary)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                    {formatDate(salary.generated_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {salary.is_paid ? (
                                                        <div className="flex flex-col">
                                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                                Paid
                                                            </span>
                                                            {salary.paid_at && (
                                                                <span className="text-xs text-slate-500 mt-1">
                                                                    {formatDate(salary.paid_at)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        isAdmin && (
                                                            <button
                                                                onClick={() => handleMarkAsPaid(salary.id)}
                                                                disabled={markingPaid[salary.id]}
                                                                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 hover:border-cyan-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                {markingPaid[salary.id] ? (
                                                                    <>
                                                                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                                        Marking...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        Mark as Paid
                                                                    </>
                                                                )}
                                                            </button>
                                                        )
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Generate Salary Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">Generate Salary (Bulk)</h3>
                        <form onSubmit={handleGenerateSalary} className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-semibold text-slate-700">Select Employees</label>
                                    <div className="space-x-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                        >
                                            Select All
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleDeselectAll}
                                            className="text-xs px-3 py-1 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                </div>

                                <div className="border-2 border-slate-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-slate-50">
                                    {employees
                                        .filter(emp => emp.employee_id !== null)
                                        .map(emp => (
                                            <label
                                                key={emp.id}
                                                className="flex items-center p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.employee_ids.includes(emp.employee_id.toString())}
                                                    onChange={() => handleEmployeeToggle(emp.employee_id)}
                                                    className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 focus:ring-2"
                                                    disabled={generating}
                                                />
                                                <span className="ml-3 text-sm text-slate-700">
                                                    Employee ID {emp.employee_id} – {emp.username}
                                                </span>
                                            </label>
                                        ))
                                    }
                                </div>

                                <p className="text-xs text-slate-500 mt-2">
                                    {formData.employee_ids.length} employee(s) selected
                                </p>
                            </div>
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <p className="text-sm text-purple-800 mb-2">
                                    <strong>Note:</strong> Salary will be generated for all selected employees.
                                </p>
                                <ul className="text-xs text-purple-700 space-y-1 ml-4 list-disc">
                                    <li>Employees with existing salary for this month will be skipped</li>
                                    <li>Calculation based on attendance records</li>
                                    <li>Email notifications will be sent (if configured)</li>
                                </ul>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                                    disabled={generating}
                                >
                                    {generating ? 'Generating...' : 'Generate Salary'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowGenerateModal(false);
                                        setFormData({ employee_id: '' });
                                    }}
                                    className="flex-1 border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold py-3 rounded-lg transition-all duration-300"
                                    disabled={generating}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Salary;
