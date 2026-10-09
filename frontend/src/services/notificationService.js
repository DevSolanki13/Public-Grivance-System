import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

// Reading and marking notifications goes through the Express API. Supabase
// Realtime is used only as a "something changed" ping to trigger a refetch.
export const notificationService = {
  list(_userId, limit = 30) {
    return api('/api/notifications', { query: { limit } });
  },

  markAsRead(id) {
    return api(`/api/notifications/${id}/read`, { method: 'PATCH' });
  },

  markAllAsRead() {
    return api('/api/notifications/read-all', { method: 'POST' });
  },

  // Calls onChange whenever this user's notifications change. Returns an
  // unsubscribe function.
  subscribe(userId, onChange) {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, onChange)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
};
