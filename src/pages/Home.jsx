import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Construction, Droplets, Trash2, Lightbulb } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../components/ProtectedRoute';

// One object per card -> we .map() over them instead of copy-pasting 4 times
const services = [
  { title: 'Pothole repair', text: 'Damaged roads, potholes and broken pavements.', category: 'Road & Infrastructure', Icon: Construction, tone: 'blue' },
  { title: 'Water supply issues', text: 'No water, low pressure or pipe leakage.', category: 'Water Supply', Icon: Droplets, tone: 'green' },
  { title: 'Garbage disposal', text: 'Missed pickups, overflowing bins and dumping.', category: 'Sanitation', Icon: Trash2, tone: 'mint' },
  { title: 'Streetlight outage', text: 'Lights that are dark, flickering or damaged.', category: 'Street Lights', Icon: Lightbulb, tone: 'green' },
];

const promptText = {
  file: 'Please login or register to file a complaint.',
  track: 'Please login or register to track your request.',
};

function Home() {
  const navigate = useNavigate();
  const { user, profile } = useAuth(); // user = null when nobody is logged in
  const [query, setQuery] = useState('');
  const [prompt, setPrompt] = useState(''); // '' = hidden, 'file' or 'track' = show login popup

  // Close the popup with the Escape key
  useEffect(() => {
    if (!prompt) return;
    const onKey = (e) => e.key === 'Escape' && setPrompt('');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prompt]);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!user) {
      setPrompt('track'); // visitors must log in first
      return;
    }
    // real lookup happens on that page; pass along whatever was typed
    navigate(`/citizen/my-grievances${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`);
  };

  return (
    <>
      <div className="home">
        <div className="decor" aria-hidden="true">
          <span className="s1" /><span className="s2" /><span className="s3" /><span className="s4" />
        </div>

        {/* Shows Login/Register for visitors, and the citizen/admin links once logged in */}
        <Navbar role={profile?.role || 'public'} />
        <div className="band" />

        {/* Track bar */}
        <form className="track-bar" id="track" onSubmit={handleTrack}>
          <Search size={22} color="#456865" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your complaint ID, e.g. GRV-2026-K3F9A"
            aria-label="Complaint ID"
          />
          <button type="submit" className="btn btn-primary">Track request</button>
        </form>

        <main className="home-main">
          {/* Service cards */}
          <section className="service-grid" id="services">
            {services.map(({ title, text, category, Icon, tone }) => (
              <div key={title} className={`service-card ${tone}`}>
                <div className="icon-bubble"><Icon size={44} strokeWidth={1.6} /></div>
                <h3>{title}</h3>
                <p>{text}</p>

                {user ? (
                  <Link to={`/citizen/submit?category=${encodeURIComponent(category)}`} className="btn">
                    File a complaint
                  </Link>
                ) : (
                  <button type="button" className="btn" onClick={() => setPrompt('file')}>
                    File a complaint
                  </button>
                )}
              </div>
            ))}
          </section>
        </main>

        <Footer />
      </div>

      {/* Login-required popup (only for visitors) */}
      {prompt && (
        <div className="modal-backdrop" onClick={() => setPrompt('')}>
          <div
            className="modal card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="login-required-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="login-required-title">Login required</h2>
            <p className="muted">{promptText[prompt]}</p>
            <div className="modal-actions">
              <Link to="/login" className="btn btn-primary">Login</Link>
              <Link to="/register" className="btn btn-outline">Register</Link>
            </div>
            <button type="button" className="link modal-close" onClick={() => setPrompt('')}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

export default Home;
