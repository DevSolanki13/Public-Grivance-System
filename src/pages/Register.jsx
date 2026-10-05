import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import PageLayout from '../components/PageLayout';
import { auth, db, friendlyError } from '../firebase/config';

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const user = userCredential.user;

      // Every public registration is a CITIZEN — the admin account is created
      // manually in Firestore, never through this form.
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        role: 'citizen',
        departmentId: null,
        isActive: true,
        createdAt: serverTimestamp(),
      });

      // Tell Login.jsx to show the "Account created" banner
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      console.error(err);
      setError(friendlyError(err)); // same shared error-message helper Login.jsx uses
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout title="Create your account" subtitle="It takes less than a minute." width="auth">
      <div className="card">
        {error && <p className="error-msg">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" required value={form.name} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" name="phone" type="tel" pattern="[0-9]{10}" required value={form.phone} onChange={handleChange} placeholder="10-digit mobile number" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" minLength={6} required value={form.password} onChange={handleChange} />
            <p className="hint">At least 6 characters.</p>
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-foot">Already registered? <Link to="/login" className="link">Log in</Link></p>
      </div>
    </PageLayout>
  );
}

export default Register;
