import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b', fontSize: 15, fontWeight: 600 }}>Loading account session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'admin') {
    // Redirect to their respective dashboard
    let target = '/citizen/dashboard';
    if (user.role === 'officer') target = '/officer/dashboard';
    else if (user.role === 'department_head') target = '/department/dashboard';
    else if (user.role === 'admin') target = '/admin/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
}
