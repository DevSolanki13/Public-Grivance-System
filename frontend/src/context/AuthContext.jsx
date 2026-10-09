/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

export const ROLE_HOME = {
  citizen: '/citizen/dashboard',
  officer: '/officer/dashboard',
  department_head: '/department/dashboard',
  admin: '/admin/dashboard',
};

export const ROLE_LABELS = {
  citizen: 'Citizen',
  officer: 'Field Officer',
  department_head: 'Dept Head',
  admin: 'Admin',
};

const AuthContext = createContext(null);

// Profile (role, department, …) comes from the Express API: GET /api/me.
async function fetchProfile() {
  return api('/api/me');
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileUserId, setProfileUserId] = useState(null);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setSessionReady(true);
    });
    // Note: never await Supabase calls inside this callback (it can deadlock
    // the auth client); profile loading happens in the effect below.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setSessionReady(true);
    });
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    fetchProfile(userId)
      .then((p) => {
        if (cancelled) return;
        setProfile(p);
        setProfileError(p ? '' : 'Your account profile could not be found.');
        setProfileUserId(userId);
      })
      .catch((err) => {
        if (cancelled) return;
        // Token rejected by the API (revoked, expired, user deleted): drop the
        // stale local session so the user is sent back to the login page.
        if (err.status === 401) {
          supabase.auth.signOut({ scope: 'local' });
          return;
        }
        console.error('Error fetching user profile:', err);
        setProfile(null);
        setProfileError('Could not load your profile. Please try again.');
        setProfileUserId(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return null;
    const p = await fetchProfile(userId);
    setProfile(p);
    return p;
  }, [userId]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    return fetchProfile();
  }, []);

  const signUp = useCallback(async ({ name, phone, email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim(), phone: phone.trim() } },
    });
    if (error) throw error;
    return data;
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setProfile(null);
    setProfileUserId(null);
  }, []);

  const user = session?.user ?? null;
  // Loading until we know whether there is a session and, if so, its profile.
  const loading = !sessionReady || (Boolean(userId) && profileUserId !== userId);
  const activeProfile = userId && profileUserId === userId ? profile : null;
  const role = activeProfile?.role ?? null;

  const value = {
    user,
    profile: activeProfile,
    profileError: userId ? profileError : '',
    role,
    loading,
    signIn,
    signUp,
    logout,
    refreshProfile,
    isCitizen: role === 'citizen',
    isOfficer: role === 'officer',
    isDeptHead: role === 'department_head',
    isAdmin: role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
