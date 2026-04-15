import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './components/Toast';
import ProtectedRoute from './auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Salary from './pages/Salary';

/**
 * Main App Component
 * Handles routing and authentication wrapper
 */
function App() {
    return (
        <Router>
            <ThemeProvider>
                <ToastProvider>
                    <AuthProvider>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />

                            {/* Protected Routes */}
                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Dashboard />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/employees"
                                element={
                                    <ProtectedRoute>
                                        <Employees />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/attendance"
                                element={
                                    <ProtectedRoute>
                                        <Attendance />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/salary"
                                element={
                                    <ProtectedRoute>
                                        <Salary />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Default Route - Redirect to Dashboard */}
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />

                            {/* 404 - Redirect to Dashboard */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </AuthProvider>
                </ToastProvider>
            </ThemeProvider>
        </Router>
    );
}

export default App;
