import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jansewa_token') || null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    authApi.logout();
    setToken(null);
    setUser(null);
  }, []);

  // Restore session from token on initial app mount
  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const savedToken = localStorage.getItem('jansewa_token');
      if (!savedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const res = await authApi.getMe();
        if (isMounted && res.success && res.user) {
          setUser(res.user);
          setToken(savedToken);
        } else if (isMounted) {
          logout();
        }
      } catch (err) {
        console.warn('Session expired or invalid:', err.message);
        if (isMounted) logout();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [logout]);

  const login = async (email, password, role) => {
    const res = await authApi.login(email, password, role);
    if (res.success && res.token) {
      localStorage.setItem('jansewa_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.success && res.token) {
      localStorage.setItem('jansewa_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Registration failed.');
  };

  const demoLogin = async (role = 'citizen') => {
    const res = await authApi.switchRole(role);
    if (res.success && res.token) {
      localStorage.setItem('jansewa_token', res.token);
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || 'Role switch failed.');
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    demoLogin,
    logout,
    isAuthenticated: !!user,
    isCitizen: user?.role === 'citizen',
    isOfficer: user?.role === 'officer',
    isDeptHead: user?.role === 'department_head',
    isAdmin: user?.role === 'admin',
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

export default AuthContext;
