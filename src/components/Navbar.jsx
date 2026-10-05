import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, UserCheck, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationBell from './NotificationBell';

function Navbar({ role: propRole }) {
  const { user, profile, role: authRole, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // If user is logged in, determine active role from auth state, else fallback to prop
  const currentRole = user ? (authRole || profile?.role || 'citizen') : (propRole || 'public');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  const roleLabelMap = {
    citizen: 'Citizen',
    officer: 'Field Officer',
    department_head: 'Dept Head',
    admin: 'Admin',
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <i className="brand-mark" />
          Jan<span>Sewa</span>
        </Link>

        <nav className="nav-links">
          {/* Public Links */}
          {!user && currentRole === 'public' && (
            <>
              <a href="/#services">{t('navServices')}</a>
              <a href="/#track">{t('navTrack')}</a>
              <Link to="/transparency" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BarChart2 size={14} /> {t('navTransparency')}
              </Link>
              <Link to="/login" className="btn btn-outline">{t('navLogin')}</Link>
              <Link to="/register" className="btn btn-primary">{t('navRegister')}</Link>
            </>
          )}

          {/* Citizen Link */}
          {user && currentRole === 'citizen' && (
            <>
              <NavLink to="/citizen/dashboard">{t('navCitizenDashboard')}</NavLink>
              <NavLink to="/citizen/my-grievances">{t('navMyGrievances')}</NavLink>
              <NavLink to="/transparency" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BarChart2 size={14} /> {t('navTransparency')}
              </NavLink>
            </>
          )}

          {/* Officer Link */}
          {user && currentRole === 'officer' && (
            <>
              <NavLink to="/officer/dashboard">{t('navAssignedCases')}</NavLink>
            </>
          )}

          {/* Department Head Link */}
          {user && currentRole === 'department_head' && (
            <>
              <NavLink to="/department/dashboard">{t('navDeptCommand')}</NavLink>
              <NavLink to="/transparency" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BarChart2 size={14} /> {t('navTransparency')}
              </NavLink>
            </>
          )}

          {/* Admin Link */}
          {user && currentRole === 'admin' && (
            <>
              <NavLink to="/admin/dashboard">{t('navAdminDashboard')}</NavLink>
              <NavLink to="/transparency" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <BarChart2 size={14} /> {t('navTransparency')}
              </NavLink>
              <NavLink to="/citizen/dashboard" className="admin-preview-link">Citizen View</NavLink>
            </>
          )}



          {/* In-App Notification Bell */}
          {user && <NotificationBell />}

          {/* User Profile Pill & Logout */}
          {user && (
            <div className="nav-user-container">
              <span className={`role-pill role-pill-${currentRole}`}>
                <UserCheck size={13} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                {profile?.name?.split(' ')[0] || 'User'} ({roleLabelMap[currentRole] || currentRole})
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="nav-logout-btn"
                title="Sign out of JanSewa"
              >
                <LogOut size={15} />
                <span>{t('navLogout')}</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
