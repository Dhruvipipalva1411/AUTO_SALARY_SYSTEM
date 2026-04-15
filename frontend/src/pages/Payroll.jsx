import { useAuth } from '../auth/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

/**
 * Payroll Page Component
 * Manage salary calculations and payments
 */
const Payroll = () => {
    const { user } = useAuth();

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />

            <div className="flex flex-1">
                <Sidebar />

                <main className="flex-1 p-8 overflow-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-slate-800 mb-2">
                            Payroll Management
                        </h1>
                        <p className="text-slate-600">
                            Calculate salaries and manage employee payments
                        </p>
                    </div>

                    {/* Coming Soon Card */}
                    <div className="card p-12 text-center">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg
                                className="w-10 h-10 text-purple-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-3">
                            Payroll Management Coming Soon
                        </h2>
                        <p className="text-slate-600 mb-6 max-w-md mx-auto">
                            This feature is currently under development. You'll soon be able to:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-slate-700">Calculate monthly salaries</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-slate-700">Generate payslips</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-slate-700">View payment history</span>
                            </div>
                            <div className="flex items-start space-x-3">
                                <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-slate-700">Export payroll reports</span>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Payroll;
