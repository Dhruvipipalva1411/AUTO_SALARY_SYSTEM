import { useAuth } from '../auth/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import StatCard from '../components/StatCard';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { Link } from 'react-router-dom';

/**
 * Pastel-Themed Premium Dashboard
 * Minimalist design with soft colors and smooth animations
 */
const Dashboard = () => {
    const { user } = useAuth();
    const { stats, loading } = useDashboardStats();

    const quickActions = [
        {
            title: 'Mark Attendance',
            description: 'Check in or check out',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            link: '/attendance',
            gradient: 'from-blue-400/80 to-indigo-400/80',
            hoverGradient: 'hover:from-blue-500/90 hover:to-indigo-500/90'
        },
        {
            title: 'View Employees',
            description: 'Manage employee records',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            link: '/employees',
            gradient: 'from-purple-400/80 to-pink-400/80',
            hoverGradient: 'hover:from-purple-500/90 hover:to-pink-500/90'
        },
        {
            title: 'Generate Salary',
            description: 'Process monthly salaries',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            link: '/salary',
            gradient: 'from-emerald-400/80 to-teal-400/80',
            hoverGradient: 'hover:from-emerald-500/90 hover:to-teal-500/90',
            adminOnly: true
        }
    ];

    const isAdmin = user?.role === 'Admin';

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 p-8 overflow-auto min-h-screen">
                    {/* Hero Section */}
                    <div className="mb-8 animate-fade-in">
                        <h1 className="text-5xl font-bold mb-2">
                            <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                                Welcome back, {user?.username}!
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium">
                            Here's your organization overview for today
                        </p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="stat-card animate-scale-in" style={{ animationDelay: '0.1s' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-cyan-400 mb-1 uppercase tracking-wide">Total Employees</p>
                                    <h3 className="text-4xl font-bold text-slate-100">{loading ? '...' : stats.totalEmployees}</h3>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                                    <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 progress-bar"><div className="progress-fill" style={{ width: '100%' }}></div></div>
                        </div>

                        <div className="stat-card animate-scale-in" style={{ animationDelay: '0.2s' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-emerald-400 mb-1 uppercase tracking-wide">Present Today</p>
                                    <h3 className="text-4xl font-bold text-slate-100">{loading ? '...' : stats.presentToday}</h3>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                    <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 progress-bar"><div className="progress-fill bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: '85%' }}></div></div>
                        </div>

                        <div className="stat-card animate-scale-in" style={{ animationDelay: '0.3s' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-rose-400 mb-1 uppercase tracking-wide">Absent Today</p>
                                    <h3 className="text-4xl font-bold text-slate-100">{loading ? '...' : stats.absentToday}</h3>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center shadow-lg shadow-rose-500/20">
                                    <svg className="w-7 h-7 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 progress-bar"><div className="progress-fill bg-gradient-to-r from-rose-500 to-red-500" style={{ width: '15%' }}></div></div>
                        </div>

                        <div className="stat-card animate-scale-in" style={{ animationDelay: '0.4s' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-amber-400 mb-1 uppercase tracking-wide">Pending Salary</p>
                                    <h3 className="text-4xl font-bold text-slate-100">{loading ? '...' : stats.pendingSalary}</h3>
                                </div>
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center shadow-lg shadow-amber-500/20">
                                    <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="mt-4 progress-bar"><div className="progress-fill bg-gradient-to-r from-amber-500 to-orange-500" style={{ width: '60%' }}></div></div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-100 mb-4 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Quick Actions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {quickActions.map((action, index) => {
                                if (action.adminOnly && !isAdmin) return null;

                                // Define card colors based on action
                                const cardColors = {
                                    0: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', icon: 'bg-cyan-500/20', iconColor: 'text-cyan-400', hover: 'hover:bg-cyan-500/20 hover:border-cyan-400/50' },
                                    1: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', icon: 'bg-indigo-500/20', iconColor: 'text-indigo-400', hover: 'hover:bg-indigo-500/20 hover:border-indigo-400/50' },
                                    2: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: 'bg-emerald-500/20', iconColor: 'text-emerald-400', hover: 'hover:bg-emerald-500/20 hover:border-emerald-400/50' }
                                };

                                const colors = cardColors[index] || cardColors[0];

                                return (
                                    <Link
                                        key={index}
                                        to={action.link}
                                        className={`group ${colors.bg} ${colors.border} ${colors.hover} border-2 p-6 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 animate-fade-in backdrop-blur-xl`}
                                        style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-14 h-14 ${colors.icon} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                                                <div className={colors.iconColor}>
                                                    {action.icon}
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 text-slate-100">{action.title}</h3>
                                        <p className="text-slate-400 text-sm font-medium">{action.description}</p>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* System Status */}
                        <div className="card animate-fade-in" style={{ animationDelay: '0.8s' }}>
                            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                System Status
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors duration-300">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 animate-pulse"></div>
                                        <span className="text-sm font-medium text-slate-300">Backend API</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">Online</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-colors duration-300">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full mr-3 animate-pulse"></div>
                                        <span className="text-sm font-medium text-slate-300">Database</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full">Connected</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/20 transition-colors duration-300">
                                    <div className="flex items-center">
                                        <div className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></div>
                                        <span className="text-sm font-medium text-slate-300">Last Sync</span>
                                    </div>
                                    <span className="text-xs font-bold text-cyan-400 px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">Just now</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="card animate-fade-in" style={{ animationDelay: '0.9s' }}>
                            <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Quick Stats
                            </h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl hover:bg-cyan-500/20 transition-all duration-300">
                                    <span className="text-sm font-medium text-slate-300">Attendance Rate</span>
                                    <span className="text-sm font-bold text-cyan-400">
                                        {stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all duration-300">
                                    <span className="text-sm font-medium text-slate-300">Active Employees</span>
                                    <span className="text-sm font-bold text-emerald-400">{stats.totalEmployees}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl hover:bg-amber-500/20 transition-all duration-300">
                                    <span className="text-sm font-medium text-slate-300">Pending Actions</span>
                                    <span className="text-sm font-bold text-amber-400">{stats.pendingSalary}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;
