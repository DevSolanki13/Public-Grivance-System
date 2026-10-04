import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDrawer from '../notifications/NotificationDrawer';
import { Bell, ChevronDown, Check, LogOut } from 'lucide-react';

export default function Navbar({ role }) {
  const navigate = useNavigate();
  const { user, logout, demoLogin } = useAuth();
  const { unreadCount, isOpen: isNotifOpen, toggleDrawer, closeDrawer } = useNotifications();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleMenuRef = useRef(null);
  const notifRef = useRef(null);

  const effectiveRole = role || user?.role || 'public';

  // Handle outside clicks for Role Switcher and Notification Dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (roleMenuOpen && roleMenuRef.current && !roleMenuRef.current.contains(e.target)) {
        setRoleMenuOpen(false);
      }
      if (isNotifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        closeDrawer();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setRoleMenuOpen(false);
        closeDrawer();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [roleMenuOpen, isNotifOpen, closeDrawer]);

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  const handleSwitchDemoRole = async (targetRole) => {
    try {
      await demoLogin(targetRole);
      setRoleMenuOpen(false);

      let targetPath = '/citizen/dashboard';
      if (targetRole === 'admin') targetPath = '/admin/dashboard';
      else if (targetRole === 'department_head') targetPath = '/department/dashboard';
      else if (targetRole === 'officer') targetPath = '/officer/dashboard';

      window.location.href = targetPath;
    } catch (err) {
      console.error('Role switch error:', err);
    }
  };

  const roleLabels = {
    citizen: 'Citizen',
    officer: 'Field Officer',
    department_head: 'Dept Head',
    admin: 'Chief Admin',
  };

  const roleOptions = [
    { role: 'citizen', label: 'Citizen', persona: 'Palak Rathod', icon: '🧑' },
    { role: 'officer', label: 'Field Officer', persona: 'Rahul Sharma', icon: '👷' },
    { role: 'department_head', label: 'Dept Head', persona: 'Sneha Iyer', icon: '👔' },
    { role: 'admin', label: 'Chief Admin', persona: 'Commissioner', icon: '🏛️' },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand Logo & Role Pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" className="brand">
            <i className="brand-mark" />
            Jan<span>Sewa</span>
          </Link>

          {user && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '3px 10px',
                borderRadius: '14px',
                border: '1px solid #bae6fd',
                letterSpacing: '0.2px',
              }}
            >
              {roleLabels[user.role] || user.role}
            </span>
          )}
        </div>

        {/* Navigation Links & Action Controls */}
        <nav className="nav-links">
          {/* Public links */}
          {effectiveRole === 'public' && !user && (
            <>
              <a href="/#services">Services</a>
              <a href="/#track">Track request</a>
              <NavLink to="/transparency">Public stats</NavLink>
              <a href="/#contact">Help</a>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
            </>
          )}

          {/* Citizen links */}
          {user?.role === 'citizen' && (
            <>
              <NavLink to="/citizen/dashboard">Dashboard</NavLink>
              <NavLink to="/citizen/submit">Submit grievance</NavLink>
              <NavLink to="/citizen/my-grievances">My grievances</NavLink>
            </>
          )}

          {/* Officer links */}
          {user?.role === 'officer' && (
            <>
              <NavLink to="/officer/dashboard">Officer dashboard</NavLink>
            </>
          )}

          {/* Department Head links */}
          {user?.role === 'department_head' && (
            <>
              <NavLink to="/department/dashboard">Department overview</NavLink>
              <NavLink to="/department/workload">Officer workload</NavLink>
            </>
          )}

          {/* Admin links */}
          {user?.role === 'admin' && (
            <>
              <NavLink to="/admin/dashboard">Admin dashboard</NavLink>
              <NavLink to="/admin/map">Complaint map</NavLink>
              <NavLink to="/admin/audit-logs">Audit logs</NavLink>
            </>
          )}

          {/* Authenticated tools: notifications, switch role & logout */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8 }}>
              {/* Notification Bell + Anchored Dropdown */}
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button
                  type="button"
                  id="notif-bell-btn"
                  onClick={toggleDrawer}
                  style={{
                    position: 'relative',
                    background: isNotifOpen ? '#e0f2fe' : '#edf4f3',
                    border: '1px solid var(--line)',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--ink)',
                    transition: 'all 0.15s ease',
                  }}
                  title="Notifications"
                >
                  <Bell size={17} />
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -3,
                        right: -3,
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 800,
                        width: 17,
                        height: 17,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #fff',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Anchored Notification Dropdown */}
                <NotificationDrawer />
              </div>

              {/* Role Switcher Pill + Anchored Dropdown (Dev Mode Only) */}
              {import.meta.env.DEV && (
                <div style={{ position: 'relative' }} ref={roleMenuRef}>
                  <button
                    type="button"
                    id="switch-role-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRoleMenuOpen((prev) => !prev);
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: roleMenuOpen ? '#e0f2fe' : '#edf4f3',
                      border: '1px solid var(--line)',
                      borderRadius: 20,
                      padding: '5px 12px',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: 'var(--ink)',
                      fontFamily: 'inherit',
                      transition: 'all 0.15s ease',
                    }}
                    title="Switch role for testing (Dev only)"
                  >
                    <span>⚡ Switch Role</span>
                    <ChevronDown
                      size={14}
                      style={{
                        transform: roleMenuOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s ease',
                      }}
                    />
                  </button>

                  {roleMenuOpen && (
                    <div
                      id="role-menu-dropdown"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        right: 0,
                        width: 220,
                        background: '#ffffff',
                        border: '1.5px solid var(--line)',
                        borderRadius: 12,
                        boxShadow: '0 12px 32px rgba(11, 61, 59, 0.22)',
                        zIndex: 99999,
                        padding: '6px 0',
                      }}
                    >
                      <div
                        style={{
                          padding: '6px 14px',
                          fontSize: 11,
                          fontWeight: 800,
                          color: 'var(--ink-soft)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Preview As
                      </div>

                      {roleOptions.map((opt) => {
                        const isActive = user?.role === opt.role;
                        return (
                          <button
                            key={opt.role}
                            type="button"
                            onClick={() => handleSwitchDemoRole(opt.role)}
                            style={{
                              width: '100%',
                              padding: '8px 14px',
                              textAlign: 'left',
                              background: isActive ? '#f0fdfa' : 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: 13,
                              fontFamily: 'inherit',
                              fontWeight: isActive ? 800 : 600,
                              color: isActive ? 'var(--accent-dark)' : 'var(--ink)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'background 0.1s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isActive) e.currentTarget.style.background = '#f8fafc';
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) e.currentTarget.style.background = 'none';
                            }}
                          >
                            <span>
                              {opt.icon} {opt.label} ({opt.persona.split(' ')[0]})
                            </span>
                            {isActive && <Check size={14} color="var(--accent-dark)" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                style={{
                  padding: '5px 12px',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
                title="Logout"
              >
                <LogOut size={13} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
