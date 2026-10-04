import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/layout/PageLayout';

export default function Login() {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStandardLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password, role);
      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'department_head') navigate('/department/dashboard');
      else if (user.role === 'officer') navigate('/officer/dashboard');
      else navigate('/citizen/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials or use Quick Test below.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (targetRole) => {
    setLoading(true);
    setError('');
    try {
      const user = await demoLogin(targetRole);
      if (targetRole === 'admin') navigate('/admin/dashboard');
      else if (targetRole === 'department_head') navigate('/department/dashboard');
      else if (targetRole === 'officer') navigate('/officer/dashboard');
      else navigate('/citizen/dashboard');
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="Welcome back"
      subtitle="Log in to submit or track grievances."
      width="auth"
    >
      <div className="card">
        {/* Quick Mock Data Test Box */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
            border: '1.5px dashed #0284c7',
            borderRadius: 10,
            padding: '14px 16px',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, color: '#0369a1', fontSize: 14, marginBottom: 6 }}>
            <span>⚡</span> Quick Test with Mock Data
          </div>
          <p style={{ fontSize: 13, color: '#334155', margin: '0 0 12px' }}>
            Explore all 4 roles instantly without typing passwords:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: 13, padding: '7px 8px', background: '#fff', borderColor: '#0284c7', color: '#0284c7' }}
              onClick={() => handleQuickDemo('citizen')}
            >
              Test as Citizen
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: 13, padding: '7px 8px', background: '#fff', borderColor: '#0284c7', color: '#0284c7' }}
              onClick={() => handleQuickDemo('officer')}
            >
              Test as Officer
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: 13, padding: '7px 8px', background: '#fff', borderColor: '#0284c7', color: '#0284c7' }}
              onClick={() => handleQuickDemo('department_head')}
            >
              Test Dept Head
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{ fontSize: 13, padding: '7px 8px', background: '#0284c7' }}
              onClick={() => handleQuickDemo('admin')}
            >
              Test as Admin
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', textAlign: 'center', margin: '18px 0 16px' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--line, #e2e8f0)' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 10px', fontSize: 12, color: 'var(--muted)' }}>
            or sign in with password
          </span>
        </div>

        <div className="role-toggle">
          <button
            type="button"
            className={role === 'citizen' ? 'on' : ''}
            onClick={() => setRole('citizen')}
          >
            Citizen
          </button>
          <button
            type="button"
            className={role === 'officer' ? 'on' : ''}
            onClick={() => setRole('officer')}
          >
            Officer
          </button>
          <button
            type="button"
            className={role === 'department_head' ? 'on' : ''}
            onClick={() => setRole('department_head')}
          >
            Dept Head
          </button>
          <button
            type="button"
            className={role === 'admin' ? 'on' : ''}
            onClick={() => setRole('admin')}
          >
            Admin
          </button>
        </div>

        <form onSubmit={handleStandardLogin}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
            />
          </div>

          {error && <p className="error-msg" style={{ marginBottom: 12 }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="auth-foot">
          New here?{' '}
          <Link to="/register" className="link">
            Create an account
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}
