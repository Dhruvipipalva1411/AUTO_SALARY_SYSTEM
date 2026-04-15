import { useAuth } from '../auth/AuthContext';
import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import axios from '../api/axios';

/**
 * Employees Page Component
 * Display and manage employee records with role-based access
 */
const Employees = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [markingAttendance, setMarkingAttendance] = useState({});

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'Employee'
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        // Filter employees based on search term (including user ID)
        const filtered = employees.filter(emp =>
            emp.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id?.toString().includes(searchTerm) ||  // Search by user ID
            emp.employee_id?.toString().includes(searchTerm)  // Search by employee ID
        );
        setFilteredEmployees(filtered);
    }, [searchTerm, employees]);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/users');
            const employeeData = response.data.users || response.data || [];
            setEmployees(Array.isArray(employeeData) ? employeeData : []);
            setFilteredEmployees(Array.isArray(employeeData) ? employeeData : []);
        } catch (err) {
            console.error('Error fetching employees:', err);
            setError('Failed to load employees');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/users', formData);
            setSuccessMessage('Employee added successfully!');
            setShowAddModal(false);
            setFormData({ username: '', email: '', password: '', role: 'Employee' });
            fetchEmployees();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to add employee');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleEditEmployee = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`/users/${selectedEmployee.id}`, {
                username: formData.username,
                email: formData.email,
                role: formData.role
            });
            setSuccessMessage('Employee updated successfully!');
            setShowEditModal(false);
            setSelectedEmployee(null);
            fetchEmployees();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update employee');
            setTimeout(() => setError(null), 3000);
        }
    };

    const handleDeleteEmployee = async (employeeId) => {
        if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
            return;
        }

        try {
            await axios.delete(`/users/${employeeId}`);
            setSuccessMessage('Employee deleted successfully!');
            fetchEmployees();
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete employee');
            setTimeout(() => setError(null), 3000);
        }
    };

    const openEditModal = (employee) => {
        setSelectedEmployee(employee);
        setFormData({
            username: employee.username,
            email: employee.email,
            role: employee.role,
            password: '' // Don't populate password
        });
        setShowEditModal(true);
    };

    const handleMarkAttendance = async (employee) => {
        // We use user ID (employee.id) for attendance marking now
        setMarkingAttendance({ ...markingAttendance, [employee.id]: true });
        try {
            const response = await axios.post('/checkinout', {
                user_id: employee.id
            });
            setSuccessMessage(response.data.msg || 'Attendance marked successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to mark attendance');
            setTimeout(() => setError(null), 3000);
        } finally {
            setMarkingAttendance({ ...markingAttendance, [employee.id]: false });
        }
    };

    const isAdmin = user?.role === 'Admin';

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
                                <h1 className="text-4xl font-bold mb-2">
                                    <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                        Employee Management
                                    </span>
                                </h1>
                                <p className="text-slate-400 text-lg font-medium">
                                    {isAdmin ? 'Manage employee records, roles, and information' : 'View employee records'}
                                </p>
                            </div>
                            {isAdmin && (
                                <div className="flex space-x-3">
                                    <button
                                        onClick={async () => {
                                            try {
                                                setLoading(true);
                                                const response = await axios.post('/users/fix-employee-records');
                                                setSuccessMessage(response.data.msg);
                                                fetchEmployees();
                                                setTimeout(() => setSuccessMessage(''), 5000);
                                            } catch (err) {
                                                setError(err.response?.data?.msg || 'Failed to sync records');
                                                setTimeout(() => setError(null), 3000);
                                            } finally {
                                                setLoading(false);
                                            }
                                        }}
                                        className="btn-secondary flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>Sync Records</span>
                                    </button>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="btn-primary flex items-center space-x-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span>Add Employee</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-fade-in">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-sm text-emerald-400 font-medium">{successMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl animate-fade-in">
                            <p className="text-sm text-rose-400 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name, email, or role..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input-field pl-12"
                            />
                            <svg className="w-5 h-5 text-cyan-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Employees Table */}
                    <div className="card overflow-hidden">
                        <div className="p-6 border-b border-cyan-500/20">
                            <h2 className="text-xl font-bold text-slate-100 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                All Employees ({filteredEmployees.length})
                            </h2>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-slate-600">Loading employees...</p>
                            </div>
                        ) : filteredEmployees.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                </div>
                                <p className="text-slate-600 mb-2">
                                    {searchTerm ? 'No employees match your search' : 'No employees found'}
                                </p>
                                <p className="text-sm text-slate-500">
                                    {searchTerm ? 'Try a different search term' : 'Add employees to see them here'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Employee</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">Created</th>
                                            {(isAdmin || user?.role === 'HR') && (
                                                <th className="px-6 py-3 text-center text-xs font-medium text-slate-200 uppercase tracking-wider">Attendance</th>
                                            )}
                                            {isAdmin && (
                                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-200 uppercase tracking-wider">Actions</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700/50">
                                        {filteredEmployees.map((employee) => (
                                            <tr key={employee.id} className="hover:bg-cyan-500/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                                            {employee.username?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-slate-200">{employee.username}</div>
                                                            <div className="text-xs text-slate-400">ID: {employee.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{employee.email}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${employee.role === 'Admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                                        employee.role === 'HR' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {employee.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                    {employee.created_at ? new Date(employee.created_at).toLocaleDateString() : 'N/A'}
                                                </td>
                                                {(isAdmin || user?.role === 'HR') && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        {employee.employee_id ? (
                                                            <button
                                                                onClick={() => handleMarkAttendance(employee)}
                                                                disabled={markingAttendance[employee.id]}
                                                                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-emerald-400/90 to-teal-400/90 hover:from-emerald-500/90 hover:to-teal-500/90 text-white shadow-md hover:shadow-lg transform hover:-translate-y-0.5 hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                                            >
                                                                {markingAttendance[employee.id] ? (
                                                                    <>
                                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                                        Marking...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        Mark Attendance
                                                                    </>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-slate-400">No employee record</span>
                                                        )}
                                                    </td>
                                                )}
                                                {isAdmin && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button
                                                            onClick={() => openEditModal(employee)}
                                                            className="text-blue-600 hover:text-blue-900 mr-4"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEmployee(employee.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
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

            {/* Add Employee Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">Add New Employee</h3>
                        <form onSubmit={handleAddEmployee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="input-field"
                                    placeholder="Enter username"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field"
                                    placeholder="Enter email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="input-field"
                                    placeholder="Enter password"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="HR">HR</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button type="submit" className="flex-1 btn-primary">
                                    Add Employee
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setFormData({ username: '', email: '', password: '', role: 'Employee' });
                                    }}
                                    className="flex-1 btn-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Employee Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-slate-800 mb-6">Edit Employee</h3>
                        <form onSubmit={handleEditEmployee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Role</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="input-field"
                                >
                                    <option value="Employee">Employee</option>
                                    <option value="HR">HR</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex space-x-3 pt-4">
                                <button type="submit" className="flex-1 btn-primary">
                                    Update Employee
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedEmployee(null);
                                    }}
                                    className="flex-1 btn-outline"
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

export default Employees;
