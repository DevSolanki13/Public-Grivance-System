/* eslint-disable react-refresh/only-export-components */
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, ROLE_HOME } from '../context/AuthContext';

// Re-export useAuth so components importing from ProtectedRoute don't break
export { useAuth };

export function AuthLoading({ message = 'Verifying access permissions...' }) {
  return (
    <div className="auth-loading-state">
      <div className="auth-spinner" />
      <p>{message}</p>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading, profileError } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoading />;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!role) {
    return <AuthLoading message={profileError || 'Loading your profile...'} />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Send the user to their own dashboard instead of a page they can't use.
    return <Navigate to={ROLE_HOME[role] || '/unauthorized'} replace />;
  }

  return children;
}

export default ProtectedRoute;
