import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserDropdown from './UserDropdown';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';

/**
 * Navbar Component
 * Top navigation bar with branding and user actions
 */
const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const openProfileModal = () => {
        setIsProfileModalOpen(true);
    };

    const closeProfileModal = () => {
        setIsProfileModalOpen(false);
    };

    const openSettingsModal = () => {
        setIsSettingsModalOpen(true);
    };

    const closeSettingsModal = () => {
        setIsSettingsModalOpen(false);
    };

    return (
        <nav className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 sticky top-0 z-50 border-b border-cyan-500/20 shadow-lg shadow-cyan-500/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and Brand */}
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                            <svg
                                className="w-6 h-6 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                                Auto Salary System
                            </h1>
                            <p className="text-xs text-slate-400 font-medium">Admin Panel</p>
                        </div>
                    </div>

                    {/* User Info and Actions */}
                    <div className="flex items-center space-x-4">
                        {user && (
                            <>
                                {/* User Info - Clickable */}
                                <div className="relative">
                                    <button
                                        onClick={toggleDropdown}
                                        className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-cyan-500/10 transition-all duration-200 group"
                                        aria-label="User menu"
                                        aria-expanded={isDropdownOpen}
                                    >
                                        <div className="hidden md:block text-right">
                                            <p className="text-sm font-semibold text-slate-200 group-hover:text-cyan-400 transition-colors">
                                                {user.username}
                                            </p>
                                            <p className="text-xs text-cyan-400 capitalize font-medium">
                                                {user.role}
                                            </p>
                                        </div>

                                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform border-2 border-transparent group-hover:border-cyan-400">
                                            {user.username?.charAt(0).toUpperCase()}
                                        </div>

                                        {/* Dropdown Chevron */}
                                        <svg
                                            className={`w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    <UserDropdown
                                        isOpen={isDropdownOpen}
                                        onClose={() => setIsDropdownOpen(false)}
                                        onOpenProfile={openProfileModal}
                                        onOpenSettings={openSettingsModal}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Profile Modal */}
            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={closeProfileModal}
            />

            {/* Settings Modal */}
            <SettingsModal
                isOpen={isSettingsModalOpen}
                onClose={closeSettingsModal}
            />
        </nav>
    );
};

export default Navbar;
