import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * UserDropdown Component
 * Dropdown menu that appears when clicking user avatar in navbar
 */
const UserDropdown = ({ isOpen, onClose, onOpenProfile, onOpenSettings }) => {
    const dropdownRef = useRef(null);
    const { logout } = useAuth();
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    const handleLogout = () => {
        logout();
        navigate('/login');
        onClose();
    };

    const handleViewProfile = () => {
        onOpenProfile();
        onClose();
    };

    const handleSettings = () => {
        onOpenSettings();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            ref={dropdownRef}
            className="absolute right-0 top-full mt-2 w-56 z-50 animate-fade-in"
            style={{ animationDuration: '200ms' }}
        >
            <div className="bg-slate-800/95 backdrop-blur-xl border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
                {/* Menu Items */}
                <div className="py-2">
                    <button
                        onClick={handleViewProfile}
                        className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors flex items-center space-x-3"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">View Profile</span>
                    </button>

                    <button
                        onClick={handleSettings}
                        className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-cyan-500/10 hover:text-cyan-400 transition-colors flex items-center space-x-3"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Settings</span>
                    </button>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-700/50"></div>

                {/* Logout */}
                <div className="py-2">
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors flex items-center space-x-3"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDropdown;
