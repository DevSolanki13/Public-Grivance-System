import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';
import PublicTransparency from './pages/PublicTransparency';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import SubmitGrievance from './pages/citizen/SubmitGrievance';
import MyGrievances from './pages/citizen/MyGrievances';
import GrievanceDetails from './pages/citizen/GrievanceDetails';

// Officer & Department Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import OfficerGrievanceDetails from './pages/officer/OfficerGrievanceDetails';
import DepartmentDashboard from './pages/department/DepartmentDashboard';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminGrievanceDetails from './pages/admin/AdminGrievanceDetails';

import GISMapPage from './pages/GISMapPage';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/transparency" element={<PublicTransparency />} />

            {/* Citizen Routes - restricted to citizen & admin */}
            <Route
              path="/citizen/dashboard"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                  <CitizenDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/submit"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                  <SubmitGrievance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/my-grievances"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                  <MyGrievances />
                </ProtectedRoute>
              }
            />
            <Route
              path="/citizen/grievance/:id"
              element={
                <ProtectedRoute allowedRoles={['citizen', 'admin']}>
                  <GrievanceDetails />
                </ProtectedRoute>
              }
            />

            {/* Field Officer Routes */}
            <Route
              path="/officer/dashboard"
              element={
                <ProtectedRoute allowedRoles={['officer', 'admin']}>
                  <OfficerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/officer/grievance/:id"
              element={
                <ProtectedRoute allowedRoles={['officer', 'admin']}>
                  <OfficerGrievanceDetails />
                </ProtectedRoute>
              }
            />

            {/* Department Head Routes */}
            <Route
              path="/department/dashboard"
              element={
                <ProtectedRoute allowedRoles={['department_head', 'admin']}>
                  <DepartmentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin & Management Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'department_head']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/grievance/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'department_head', 'officer']}>
                  <AdminGrievanceDetails />
                </ProtectedRoute>
              }
            />

            {/* GIS map for staff */}
            <Route
              path="/map"
              element={
                <ProtectedRoute allowedRoles={['admin', 'department_head', 'officer']}>
                  <GISMapPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback / 404 */}
            <Route
              path="*"
              element={
                <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
                  <h1>404 - Page not found</h1>
                  <p className="muted" style={{ marginTop: '12px' }}>The requested resource does not exist.</p>
                </div>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
