import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Re-export useAuth so components importing from ProtectedRoute don't break
export { useAuth };

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-loading-state">
        <div className="auth-spinner" />
        <p>Verifying access permissions...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // If user's role is not authorized for this specific route, redirect to their role dashboard
    const defaultRolePaths = {
      admin: '/admin/dashboard',
      department_head: '/department/dashboard',
      officer: '/officer/dashboard',
      citizen: '/citizen/dashboard',
    };

    const target = defaultRolePaths[role] || '/unauthorized';
    return <Navigate to={target} replace />;
  }

  return children;
}

export default ProtectedRoute;