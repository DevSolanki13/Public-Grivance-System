import { useNavigate, useLocation } from 'react-router-dom';
import { User, Briefcase, Building2, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function DemoSwitcher() {
  const { role, switchRole, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleRoleChange = (targetRole) => {
    switchRole(targetRole);

    // Map role to primary destination
    const roleRoutes = {
      citizen: '/citizen/dashboard',
      officer: '/officer/dashboard',
      department_head: '/department/dashboard',
      admin: '/admin/dashboard',
    };

    // If currently on home, login, register, or a role dashboard, navigate to the selected role dashboard
    const targetPath = roleRoutes[targetRole];
    if (location.pathname === '/' ||
        location.pathname.startsWith('/citizen') ||
        location.pathname.startsWith('/officer') ||
        location.pathname.startsWith('/department') ||
        location.pathname.startsWith('/admin') ||
        location.pathname === '/login' ||
        location.pathname === '/register' ||
        location.pathname === '/unauthorized') {
      navigate(targetPath);
    }
  };

  return (
    <div className="demo-switcher-bar">
      <div className="demo-switcher-inner">
        <div className="demo-switcher-badge">
          <Sparkles size={14} className="sparkle-icon" />
          <span className="demo-tag">DEMO MODE</span>
          <span className="demo-desc">
            Active: <strong>{profile?.name || 'Aarav'}</strong> ({role.replace('_', ' ')})
          </span>
        </div>

        <div className="demo-switcher-buttons" role="group" aria-label="Role Switcher">
          <span className="switcher-hint">Switch Role:</span>
          
          <button
            type="button"
            className={`demo-role-btn ${role === 'citizen' ? 'active' : ''}`}
            onClick={() => handleRoleChange('citizen')}
            title="Switch to Citizen view (Submit & track grievances)"
          >
            <User size={14} />
            <span>Citizen</span>
          </button>

          <button
            type="button"
            className={`demo-role-btn ${role === 'officer' ? 'active' : ''}`}
            onClick={() => handleRoleChange('officer')}
            title="Switch to Field Officer view (Investigate & resolve assigned cases)"
          >
            <Briefcase size={14} />
            <span>Field Officer</span>
          </button>

          <button
            type="button"
            className={`demo-role-btn ${role === 'department_head' ? 'active' : ''}`}
            onClick={() => handleRoleChange('department_head')}
            title="Switch to Department Head view (Workload & SLA command)"
          >
            <Building2 size={14} />
            <span>Dept Head</span>
          </button>

          <button
            type="button"
            className={`demo-role-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleChange('admin')}
            title="Switch to Admin view (System-wide analytics & management)"
          >
            <ShieldCheck size={14} />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default DemoSwitcher;
