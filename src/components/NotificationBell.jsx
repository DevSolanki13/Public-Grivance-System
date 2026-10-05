import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Clock, AlertTriangle, UserCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function NotificationBell() {
  const { currentRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const dropdownRef = useRef(null);

  const reloadNotifications = () => {
    setNotifications(notificationService.getForRole(currentRole));
  };

  useEffect(() => {
    reloadNotifications();
    const handleUpdate = () => reloadNotifications();
    window.addEventListener('jansewa_notification_update', handleUpdate);
    return () => window.removeEventListener('jansewa_notification_update', handleUpdate);
  }, [currentRole]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleItemClick = (notif) => {
    notificationService.markAsRead(notif.id);
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = () => {
    notificationService.markAllAsRead(currentRole);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'action_required':
        return <AlertTriangle size={16} color="#d97706" />;
      case 'assignment':
        return <UserCheck size={16} color="#0284c7" />;
      case 'escalation':
        return <ShieldAlert size={16} color="#dc2626" />;
      default:
        return <Clock size={16} color="#64748b" />;
    }
  };

  if (currentRole === 'public') return null;

  return (
    <div className="notif-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="notif-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="View Notifications"
        style={{
          background: isOpen ? '#f1f5f9' : 'transparent',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '8px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          color: '#334155'
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#dc2626',
              color: '#ffffff',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '1px 6px',
              minWidth: '18px',
              textAlign: 'center',
              boxShadow: '0 2px 5px rgba(220,38,38,0.4)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="notif-dropdown shadow-lg"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '360px',
            maxWidth: '90vw',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={16} color="#0f2f5e" />
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{t('notifications')}</strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '999px'
                  }}
                >
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0f2f5e',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Check size={13} /> {t('markAllRead')}
              </button>
            )}
          </div>

          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                {t('noNotifications')}
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f8fafc',
                    cursor: 'pointer',
                    background: item.read ? '#ffffff' : '#f0fdf4',
                    display: 'flex',
                    gap: '12px',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = item.read ? '#ffffff' : '#f0fdf4')
                  }
                >
                  <div style={{ paddingTop: '2px' }}>{getIcon(item.type)}</div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: item.read ? 600 : 700,
                        color: '#1e293b',
                        marginBottom: '3px'
                      }}
                    >
                      {item.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>
                      {item.message}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginTop: '6px'
                      }}
                    >
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {item.link && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: '#0f2f5e',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          Open <ArrowRight size={11} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
