import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';

/**
 * SettingsModal Component
 * Modal for user settings and preferences
 */
const SettingsModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const { currentTheme, themes, changeTheme } = useTheme();
    const [settings, setSettings] = useState({
        emailNotifications: true,
        attendanceReminders: true,
        salaryAlerts: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    // Load settings from localStorage on mount
    useEffect(() => {
        const savedSettings = localStorage.getItem('userSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleToggle = (setting) => {
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    const handleSelectChange = (setting, value) => {
        setSettings(prev => ({
            ...prev,
            [setting]: value
        }));
    };

    const handleSave = () => {
        setIsSaving(true);
        setSaveMessage('');

        // Save to localStorage
        localStorage.setItem('userSettings', JSON.stringify(settings));

        // Simulate API call
        setTimeout(() => {
            setIsSaving(false);
            setSaveMessage('Settings saved successfully!');
            setTimeout(() => {
                setSaveMessage('');
            }, 3000);
        }, 500);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            ></div>

            {/* Modal */}
            <div className="relative w-full max-w-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/20 overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <h2 className="text-2xl font-bold text-white">Settings</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                            aria-label="Close settings"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    {/* Success Message */}
                    {saveMessage && (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-fade-in">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <p className="text-sm text-emerald-400 font-medium">{saveMessage}</p>
                            </div>
                        </div>
                    )}

                    {/* Notifications Section */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            Notifications
                        </h3>
                        <div className="space-y-4">
                            {/* Email Notifications */}
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-cyan-500/30 transition-colors">
                                <div className="flex-1">
                                    <h4 className="text-slate-100 font-semibold">Email Notifications</h4>
                                    <p className="text-sm text-slate-400 mt-1">Receive email updates about your account</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('emailNotifications')}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.emailNotifications ? 'bg-cyan-500' : 'bg-slate-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${settings.emailNotifications ? 'translate-x-7' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Attendance Reminders */}
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-cyan-500/30 transition-colors">
                                <div className="flex-1">
                                    <h4 className="text-slate-100 font-semibold">Attendance Reminders</h4>
                                    <p className="text-sm text-slate-400 mt-1">Get reminded to mark your attendance</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('attendanceReminders')}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.attendanceReminders ? 'bg-cyan-500' : 'bg-slate-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${settings.attendanceReminders ? 'translate-x-7' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Salary Alerts */}
                            <div className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-cyan-500/30 transition-colors">
                                <div className="flex-1">
                                    <h4 className="text-slate-100 font-semibold">Salary Alerts</h4>
                                    <p className="text-sm text-slate-400 mt-1">Notifications about salary processing</p>
                                </div>
                                <button
                                    onClick={() => handleToggle('salaryAlerts')}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${settings.salaryAlerts ? 'bg-cyan-500' : 'bg-slate-600'
                                        }`}
                                >
                                    <span
                                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${settings.salaryAlerts ? 'translate-x-7' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                            </svg>
                            Appearance
                        </h3>
                        <div className="space-y-4">
                            {/* Theme */}
                            <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                                <label className="block text-slate-100 font-semibold mb-2">Theme</label>
                                <p className="text-sm text-slate-400 mb-3">Choose your preferred color scheme</p>
                                <select
                                    value={currentTheme}
                                    onChange={(e) => changeTheme(e.target.value)}
                                    className="input-field"
                                >
                                    {Object.entries(themes).map(([key, theme]) => (
                                        <option key={key} value={key}>
                                            {theme.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-cyan-400 mt-2 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Theme changes apply instantly!
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Account Section */}
                    <div>
                        <h3 className="text-xl font-bold text-slate-100 mb-4 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Account Information
                        </h3>
                        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Username</span>
                                <span className="text-slate-100 font-medium">{user?.username}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Role</span>
                                <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-sm font-semibold">{user?.role}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">User ID</span>
                                <span className="text-slate-100 font-medium">{user?.id}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 btn-outline"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 btn-primary disabled:opacity-50"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
