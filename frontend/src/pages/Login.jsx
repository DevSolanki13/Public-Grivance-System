import { useState } from 'react';
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, UserCheck, Briefcase, Building2, Sparkles } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { friendlyError } from '../lib/supabase';
import { useAuth, ROLE_HOME } from '../context/AuthContext';

const DEMO_LOGIN_ENABLED = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
const DEMO_PASSWORD = 'Demo@12345';

// Seeded accounts from supabase/seed.sql
const DEMO_ACCOUNTS = [
  { role: 'citizen', label: 'Citizen', email: 'aarav.citizen@demo.jansewa.in', Icon: UserCheck },
  { role: 'officer', label: 'Officer', email: 'rahul.officer@demo.jansewa.in', Icon: Briefcase },
  { role: 'department_head', label: 'Dept Head', email: 'priya.head@demo.jansewa.in', Icon: Building2 },
  { role: 'admin', label: 'Admin', email: 'admin@demo.jansewa.in', Icon: ShieldCheck },
];

const demoButtonStyle = {
  fontSize: '0.85rem',
  padding: '8px 10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  background: '#fff',
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, loading: authLoading, signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const registeredNotice = location.state?.registered;

  const goToDashboard = (userRole) => {
    const target = ROLE_HOME[userRole] || '/';
    const redirectFrom = location.state?.from?.pathname;
    // Only return to the page the user came from if their role can use it.
    const canReturn = redirectFrom && !['/login', '/register', '/unauthorized'].includes(redirectFrom)
      && (userRole === 'admin' || redirectFrom.startsWith(target.split('/dashboard')[0]));
    navigate(canReturn ? redirectFrom : target, { replace: true });
  };

  const doSignIn = async (signInEmail, signInPassword) => {
    setError('');
    setLoading(true);
    try {
      const signedInProfile = await signIn(signInEmail, signInPassword);
      if (!signedInProfile) throw new Error('Your account profile could not be found.');
      goToDashboard(signedInProfile.role);
    } catch (err) {
      console.error('Login error:', err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doSignIn(email, password);
  };

  // Already signed in (e.g. visiting /login directly) → go to the dashboard.
  if (!authLoading && user && role && !loading) {
    return <Navigate to={ROLE_HOME[role] || '/'} replace />;
  }

  return (
    <PageLayout title="Sign in to JanSewa" subtitle="Access your grievance dashboard." width="auth">
      <div className="card">
        {registeredNotice && (
          <div className="alert-banner alert-success" role="status" style={{ marginBottom: '16px', padding: '12px 14px', background: '#eaf8f0', color: '#14603c', borderRadius: '8px', fontSize: '0.9rem' }}>
            Account created successfully! Please sign in with your email and password.
          </div>
        )}

        {DEMO_LOGIN_ENABLED && (
          <>
            <div className="demo-instant-box" style={{ background: '#eef3fa', border: '1.5px solid var(--accent)', borderRadius: '12px', padding: '16px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-dark)', fontWeight: 800, fontSize: '0.92rem', marginBottom: '10px' }}>
                <Sparkles size={16} />
                <span>DEMO ACCOUNTS</span>
              </div>
              <p className="muted" style={{ fontSize: '0.84rem', marginBottom: '12px' }}>
                Sign in instantly as a seeded demo user (password <code>{DEMO_PASSWORD}</code>):
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {DEMO_ACCOUNTS.map(({ role: demoRole, label, email: demoEmail, Icon }) => (
                  <button
                    key={demoRole}
                    type="button"
                    className="btn btn-outline"
                    style={demoButtonStyle}
                    disabled={loading}
                    onClick={() => doSignIn(demoEmail, DEMO_PASSWORD)}
                  >
                    <Icon size={15} /> {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ position: 'relative', textAlign: 'center', margin: '18px 0 20px' }}>
              <hr style={{ border: 'none', borderTop: '1px solid var(--line)' }} />
              <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 12px', fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 600 }}>
                Or sign in with your credentials
              </span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password"
            />
          </div>

          {error && <p className="error-msg" role="alert" style={{ marginBottom: '14px' }}>{error}</p>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-foot">
          Need a citizen account?{' '}
          <Link to="/register" className="link">
            Create an account
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}

export default Login;
