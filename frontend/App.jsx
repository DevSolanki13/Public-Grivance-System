import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import Home from './pages/public/Home';
import Transparency from './pages/public/Transparency';
import TrackPublic from './pages/public/TrackPublic';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitGrievance from './pages/citizen/SubmitGrievance';
import MyGrievances from './pages/citizen/MyGrievances';
import CitizenGrievanceDetail from './pages/citizen/CitizenGrievanceDetail';

// Officer Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';

// Department Head Pages
import DepartmentDashboard from './pages/department/DepartmentDashboard';
import OfficerWorkload from './pages/department/OfficerWorkload';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ComplaintMap from './pages/admin/ComplaintMap';
import AuditLogs from './pages/admin/AuditLogs';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/transparency" element={<Transparency />} />
            <Route path="/track/:id" element={<TrackPublic />} />

            {/* Citizen Routes */}
            <Route
              path="/citizen/dashboard"
              element={<ProtectedRoute allowedRoles={['citizen', 'admin']}><CitizenDashboard /></ProtectedRoute>}
            />
            <Route
              path="/citizen/submit"
              element={<ProtectedRoute allowedRoles={['citizen', 'admin']}><SubmitGrievance /></ProtectedRoute>}
            />
            <Route
              path="/citizen/my-grievances"
              element={<ProtectedRoute allowedRoles={['citizen', 'admin']}><MyGrievances /></ProtectedRoute>}
            />
            <Route
              path="/citizen/grievance/:id"
              element={<ProtectedRoute><CitizenGrievanceDetail /></ProtectedRoute>}
            />

            {/* Officer Routes */}
            <Route
              path="/officer/dashboard"
              element={<ProtectedRoute allowedRoles={['officer', 'admin']}><OfficerDashboard /></ProtectedRoute>}
            />
            <Route
              path="/officer/cases"
              element={<ProtectedRoute allowedRoles={['officer', 'admin']}><OfficerDashboard /></ProtectedRoute>}
            />
            <Route
              path="/officer/grievance/:id"
              element={<ProtectedRoute allowedRoles={['officer', 'department_head', 'admin']}><CitizenGrievanceDetail /></ProtectedRoute>}
            />

            {/* Department Head Routes */}
            <Route
              path="/department/dashboard"
              element={<ProtectedRoute allowedRoles={['department_head', 'admin']}><DepartmentDashboard /></ProtectedRoute>}
            />
            <Route
              path="/department/workload"
              element={<ProtectedRoute allowedRoles={['department_head', 'admin']}><OfficerWorkload /></ProtectedRoute>}
            />
            <Route
              path="/department/grievance/:id"
              element={<ProtectedRoute allowedRoles={['department_head', 'admin']}><CitizenGrievanceDetail /></ProtectedRoute>}
            />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>}
            />
            <Route
              path="/admin/map"
              element={<ProtectedRoute allowedRoles={['admin']}><ComplaintMap /></ProtectedRoute>}
            />
            <Route
              path="/admin/audit-logs"
              element={<ProtectedRoute allowedRoles={['admin', 'department_head']}><AuditLogs /></ProtectedRoute>}
            />
            <Route
              path="/admin/grievance/:id"
              element={<ProtectedRoute allowedRoles={['admin']}><CitizenGrievanceDetail /></ProtectedRoute>}
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
