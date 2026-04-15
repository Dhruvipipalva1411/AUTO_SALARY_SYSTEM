import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import axios from '../api/axios';
import ChangePasswordModal from './ChangePasswordModal';

/**
 * ProfileModal Component
 * Modal overlay displaying user profile information
 */
const ProfileModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // Fetch full profile data when modal opens
    useEffect(() => {
        const fetchProfile = async () => {
            if (!isOpen) return;

            try {
                setLoading(true);
                const response = await axios.get('/profile');
                setProfileData(response.data);
            } catch (error) {
                console.error('Error fetching profile:', error);
                // Fallback to user data from context
                setProfileData(user);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [isOpen, user]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/20 overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-cyan-600 to-teal-600 p-8">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                        aria-label="Close profile"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Avatar & Name */}
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center border-4 border-white/30">
                            <span className="text-4xl font-bold text-white">
                                {loading ? '...' : profileData?.username?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-1">
                                {loading ? 'Loading...' : profileData?.username}
                            </h2>
                            <div className="flex items-center space-x-2">
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-xl rounded-full text-sm font-semibold text-white border border-white/30">
                                    {profileData?.role}
                                </span>
                                <span className="text-sm text-white/80">
                                    User ID: {profileData?.id}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</label>
                                <p className="text-slate-100 font-medium mt-1">{loading ? 'Loading...' : profileData?.username || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                                <p className="text-slate-100 font-medium mt-1">{loading ? 'Loading...' : profileData?.email || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">User ID</label>
                                <p className="text-slate-100 font-medium mt-1">{loading ? 'Loading...' : profileData?.id || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</label>
                                <p className="text-slate-100 font-medium mt-1">{loading ? 'Loading...' : profileData?.role || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Account Details */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-100 mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Account Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Account Status</label>
                                <div className="flex items-center mt-1">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                                    <p className="text-emerald-400 font-medium">Active</p>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Member Since</label>
                                <p className="text-slate-100 font-medium mt-1">{loading ? 'Loading...' : formatDate(profileData?.created_at)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-3 pt-4">
                        <button className="btn-secondary flex items-center space-x-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit Profile</span>
                        </button>
                        <button
                            onClick={() => setIsChangePasswordOpen(true)}
                            className="btn-outline flex items-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                            <span>Change Password</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
                onSuccess={() => {
                    // Optional: Show success message or perform additional actions
                    console.log('Password changed successfully');
                }}
            />
        </div>
    );
};

export default ProfileModal;
