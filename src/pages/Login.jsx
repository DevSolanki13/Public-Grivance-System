import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, UserCheck, Briefcase, Building2, Sparkles, ArrowRight } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { auth, db, friendlyError } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { switchRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [targetRole, setTargetRole] = useState('citizen');

  const registeredNotice = location.state?.registered;

  // Direct 1-Click Demo Access without login
  const handleQuickDemoEnter = (roleKey) => {
    switchRole(roleKey);
    const roleRoutes = {
      citizen: '/citizen/dashboard',
      officer: '/officer/dashboard',
      department_head: '/department/dashboard',
      admin: '/admin/dashboard',
    };
    navigate(roleRoutes[roleKey]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Login using Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const user = userCredential.user;

      // Fetch user profile from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      let userRole = 'citizen';

      if (userDoc.exists()) {
        const userData = userDoc.data();
        userRole = userData.role || 'citizen';
      } else {
        // If user exists in Auth but not Firestore, create default profile
        userRole = targetRole || 'citizen';
        await setDoc(userDocRef, {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Citizen',
          email: user.email,
          phone: '',
          role: userRole,
          departmentId: null,
          isActive: true,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

      // If user came from a protected route, check if they can return there
      const redirectFrom = location.state?.from?.pathname;
      if (redirectFrom && redirectFrom !== '/login' && redirectFrom !== '/unauthorized') {
        navigate(redirectFrom, { replace: true });
        return;
      }

      switch (userRole) {
        case 'admin':
          navigate('/admin/dashboard', { replace: true });
          break;
        case 'department_head':
          navigate('/department/dashboard', { replace: true });
          break;
        case 'officer':
          navigate('/officer/dashboard', { replace: true });
          break;
        case 'citizen':
        default:
          navigate('/citizen/dashboard', { replace: true });
          break;
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title="JanSewa Portal"
      subtitle="Select a role for instant demo access, or sign in."
      width="auth"
    >
      <div className="card">
        {registeredNotice && (
          <div className="alert-banner alert-success" style={{ marginBottom: '16px', padding: '12px 14px', background: '#eaf8f0', color: '#14603c', borderRadius: '8px', fontSize: '0.9rem' }}>
            Account created successfully! Please enter your password to sign in.
          </div>
        )}

        {/* 1-Click Instant Demo Access Box */}
        <div className="demo-instant-box" style={{ background: '#f0f9f6', border: '1.5px solid var(--accent)', borderRadius: '12px', padding: '16px', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-dark)', fontWeight: 800, fontSize: '0.92rem', marginBottom: '10px' }}>
            <Sparkles size={16} />
            <span>INSTANT DEMO ACCESS (No Login Required)</span>
          </div>
          <p className="muted" style={{ fontSize: '0.84rem', marginBottom: '12px' }}>
            Click any role to enter immediately as that persona:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fff' }}
              onClick={() => handleQuickDemoEnter('citizen')}
            >
              <UserCheck size={15} /> Citizen
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fff' }}
              onClick={() => handleQuickDemoEnter('officer')}
            >
              <Briefcase size={15} /> Officer
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fff' }}
              onClick={() => handleQuickDemoEnter('department_head')}
            >
              <Building2 size={15} /> Dept Head
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: '0.85rem', padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#fff' }}
              onClick={() => handleQuickDemoEnter('admin')}
            >
              <ShieldCheck size={15} /> Admin
            </button>
          </div>
        </div>

        <div style={{ position: 'relative', textAlign: 'center', margin: '18px 0 20px' }}>
          <hr style={{ border: 'none', borderTop: '1px solid var(--line)' }} />
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 12px', fontSize: '0.8rem', color: 'var(--ink-soft)', fontWeight: 600 }}>
            Or Sign In With Credentials
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@domain.gov / user@example.com"
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
              placeholder="Enter your account password"
            />
          </div>

          {error && <p className="error-msg" style={{ marginBottom: '14px' }}>{error}</p>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
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