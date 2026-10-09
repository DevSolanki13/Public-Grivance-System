import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, UserCheck, BarChart2, Landmark, Home as HomeIcon, Map as MapIcon } from 'lucide-react';
import { useAuth, ROLE_LABELS } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationBell from './NotificationBell';

function Navbar() {
  const { user, profile, role, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const currentRole = user ? role : 'public';

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Failed to log out:', err);
    }
  };

  return (
    <header className="navbar-wrap">
      <div className="flag-strip" />
      <div className="util-bar">
        <div className="util-inner">
          <span>Government of India &nbsp;|&nbsp; Municipal Administration Department</span>
          <div className="util-right">
            <a href="#main-content">Skip to main content</a>
            <label>
              <span style={{ marginRight: 6 }}>Language:</span>
              <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="Select language">
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark"><Landmark size={28} /></span>
            <span className="brand-text">
              <span className="brand-name">Jan<span>Sewa</span></span>
              <span className="brand-sub">Public Grievance Redressal Portal</span>
            </span>
          </Link>

          {!user && (
            <div className="header-actions">
              <Link to="/login" className="btn btn-outline">{t('navLogin')}</Link>
              <Link to="/register" className="btn btn-primary">{t('navRegister')}</Link>
            </div>
          )}

          {user && (
            <div className="header-actions">
              <span className={`role-pill role-pill-${currentRole}`}>
                <UserCheck size={13} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                {profile?.name?.split(' ')[0] || 'User'} ({ROLE_LABELS[currentRole] || currentRole})
              </span>
              <NotificationBell />
              <button type="button" onClick={handleLogout} className="nav-logout-btn" title="Sign out of JanSewa">
                <LogOut size={15} />
                <span>{t('navLogout')}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="menu-bar">
        <div className="menu-inner">
          <nav className="nav-links" aria-label="Main navigation">
            <NavLink to="/" end><HomeIcon size={15} /> {t('navHome')}</NavLink>

            {!user && (
              <>
                <a href="/#services">{t('navServices')}</a>
                <a href="/#track">{t('navTrack')}</a>
              </>
            )}

            {user && currentRole === 'citizen' && (
              <>
                <NavLink to="/citizen/dashboard">{t('navCitizenDashboard')}</NavLink>
                <NavLink to="/citizen/submit">File Grievance</NavLink>
                <NavLink to="/citizen/my-grievances">{t('navMyGrievances')}</NavLink>
              </>
            )}
            {user && currentRole === 'officer' && <NavLink to="/officer/dashboard">{t('navAssignedCases')}</NavLink>}
            {user && currentRole === 'department_head' && <NavLink to="/department/dashboard">{t('navDeptCommand')}</NavLink>}
            {user && currentRole === 'admin' && (
              <>
                <NavLink to="/admin/dashboard">{t('navAdminDashboard')}</NavLink>
                <NavLink to="/citizen/dashboard" className="admin-preview-link">Citizen View</NavLink>
              </>
            )}

            {user && ['officer', 'department_head', 'admin'].includes(currentRole) && (
              <NavLink to="/map"><MapIcon size={15} /> {t('navMap')}</NavLink>
            )}

            <NavLink to="/transparency"><BarChart2 size={15} /> {t('navTransparency')}</NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
