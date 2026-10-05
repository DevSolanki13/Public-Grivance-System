import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Resilient lazy-loading helper: if a new deployment replaces chunk hashes, automatically reload the page once
function lazyWithRetry(factory) {
  return lazy(async () => {
    const pageHasBeenForceRefreshed = window.sessionStorage.getItem('page-refreshed-for-chunk-load');
    try {
      const module = await factory();
      window.sessionStorage.removeItem('page-refreshed-for-chunk-load');
      return module;
    } catch (error) {
      if (!pageHasBeenForceRefreshed) {
        window.sessionStorage.setItem('page-refreshed-for-chunk-load', 'true');
        window.location.reload();
        return new Promise(() => {}); // Wait for browser reload
      }
      throw error;
    }
  });
}

// Lazy-loaded routes for code splitting and optimal bundle performance
const Home = lazyWithRetry(() => import('./pages/public/Home'));
const Transparency = lazyWithRetry(() => import('./pages/public/Transparency'));
const TrackPublic = lazyWithRetry(() => import('./pages/public/TrackPublic'));

const Login = lazyWithRetry(() => import('./pages/auth/Login'));
const Register = lazyWithRetry(() => import('./pages/auth/Register'));

const CitizenDashboard = lazyWithRetry(() => import('./pages/citizen/CitizenDashboard'));
const SubmitGrievance = lazyWithRetry(() => import('./pages/citizen/SubmitGrievance'));
const MyGrievances = lazyWithRetry(() => import('./pages/citizen/MyGrievances'));
const CitizenGrievanceDetail = lazyWithRetry(() => import('./pages/citizen/CitizenGrievanceDetail'));

const OfficerDashboard = lazyWithRetry(() => import('./pages/officer/OfficerDashboard'));
const DepartmentDashboard = lazyWithRetry(() => import('./pages/department/DepartmentDashboard'));
const OfficerWorkload = lazyWithRetry(() => import('./pages/department/OfficerWorkload'));

const AdminDashboard = lazyWithRetry(() => import('./pages/admin/AdminDashboard'));
const ComplaintMap = lazyWithRetry(() => import('./pages/admin/ComplaintMap'));
const AuditLogs = lazyWithRetry(() => import('./pages/admin/AuditLogs'));

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
