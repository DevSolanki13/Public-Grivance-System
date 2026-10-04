import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { Bell, Check, ExternalLink, X } from 'lucide-react';

export default function NotificationDrawer() {
  const { notifications, unreadCount, isOpen, closeDrawer, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const drawerRef = useRef(null);

  // Close when pressing Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') closeDrawer();
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeDrawer]);

  if (!isOpen) return null;

  const handleClickItem = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
      closeDrawer();
    }
  };

  return (
    <div
      className="notif-dropdown-menu"
      ref={drawerRef}
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        background: '#ffffff',
        border: '1.5px solid var(--line)',
        borderRadius: 12,
        boxShadow: '0 14px 36px rgba(11, 61, 59, 0.22)',
        zIndex: 99999,
        overflow: 'hidden',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: '#f4fbf9',
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} color="var(--accent-dark)" />
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--ink)' }}>Notifications</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#fff',
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 10,
              }}
            >
              {unreadCount} new
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={closeDrawer}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--ink-soft)',
            display: 'flex',
            alignItems: 'center',
            padding: 2,
          }}
          title="Close Notifications"
        >
          <X size={16} />
        </button>
      </div>

      <div style={{ maxHeight: 360, overflowY: 'auto' }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>
            No notifications right now.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleClickItem(n)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--line)',
                cursor: 'pointer',
                background: !n.isRead ? '#f0fdfa' : '#ffffff',
                borderLeft: !n.isRead ? '3px solid var(--accent)' : '3px solid transparent',
                transition: 'background 0.1s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#eaf8f5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = !n.isRead ? '#f0fdfa' : '#ffffff';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', margin: 0 }}>{n.title}</p>
                {!n.isRead && (
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      flexShrink: 0,
                      marginTop: 4,
                    }}
                  />
                )}
              </div>
              <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '4px 0 0', lineHeight: 1.4 }}>
                {n.message}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  {new Date(n.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
                <span style={{ fontSize: 11, color: 'var(--accent-dark)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                  View <ExternalLink size={10} />
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
