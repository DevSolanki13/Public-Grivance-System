import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { useAuth } from '../context/AuthContext';

function Unauthorized() {
  const { role, profile } = useAuth();

  const getDashboardLink = () => {
    switch (role) {
      case 'admin':
        return { path: '/admin/dashboard', label: 'Admin Dashboard' };
      case 'department_head':
        return { path: '/department/dashboard', label: 'Department Dashboard' };
      case 'officer':
        return { path: '/officer/dashboard', label: 'Officer Dashboard' };
      default:
        return { path: '/citizen/dashboard', label: 'Citizen Dashboard' };
    }
  };

  const dashboard = getDashboardLink();

  return (
    <PageLayout
      title="Access Restricted"
      subtitle="You do not have permission to access this page."
      width="narrow"
    >
      <div className="card text-center" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ display: 'inline-flex', padding: '16px', background: '#fadcd8', borderRadius: '50%', color: '#922b21', marginBottom: '16px' }}>
          <ShieldAlert size={48} />
        </div>

        <h2 style={{ marginBottom: '8px' }}>Restricted Area</h2>
        <p className="muted" style={{ maxWidth: '440px', margin: '0 auto 24px' }}>
          This section requires specific departmental or administrative privileges. Your current role is <strong>{profile?.role || role || 'citizen'}</strong>.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Link to={dashboard.path} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={16} /> Return to {dashboard.label}
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

export default Unauthorized;
