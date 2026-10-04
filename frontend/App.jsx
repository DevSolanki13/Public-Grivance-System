import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Lazy-loaded routes for code splitting and optimal bundle performance
const Home = lazy(() => import('./pages/public/Home'));
const Transparency = lazy(() => import('./pages/public/Transparency'));
const TrackPublic = lazy(() => import('./pages/public/TrackPublic'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

const CitizenDashboard = lazy(() => import('./pages/citizen/CitizenDashboard'));
const SubmitGrievance = lazy(() => import('./pages/citizen/SubmitGrievance'));
const MyGrievances = lazy(() => import('./pages/citizen/MyGrievances'));
const CitizenGrievanceDetail = lazy(() => import('./pages/citizen/CitizenGrievanceDetail'));

const OfficerDashboard = lazy(() => import('./pages/officer/OfficerDashboard'));
const DepartmentDashboard = lazy(() => import('./pages/department/DepartmentDashboard'));
const OfficerWorkload = lazy(() => import('./pages/department/OfficerWorkload'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ComplaintMap = lazy(() => import('./pages/admin/ComplaintMap'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));

const PageLoader = () => (
  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: 12 }}>
    <div
      style={{
        width: 32,
        height: 32,
        border: '3px solid #e2e8f0',
        borderTopColor: '#0284c7',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Loading interface...</p>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}
