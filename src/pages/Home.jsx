import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Construction, Droplets, Trash2, Lightbulb, CheckCircle2, Phone, Mail, Clock } from 'lucide-react';
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

const steps = [
  { n: 1, title: 'Register', text: 'Create your citizen account in a minute.' },
  { n: 2, title: 'File complaint', text: 'Describe the issue and share the location.' },
  { n: 3, title: 'Track progress', text: 'See which officer and stage your case is at.' },
  { n: 4, title: 'Get resolution', text: 'Receive the update and give your feedback.' },
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
        <Navbar role={profile?.role || 'public'} />

        {/* Hero: purpose + track box */}
        <section className="hero">
          <div className="hero-inner">
            <div>
              <h1>Raise your civic complaint. Track it until it is resolved.</h1>
              <p>
                JanSewa is the official single-window portal to register grievances about roads, water,
                sanitation and street lights, and to follow every step of the action taken.
              </p>
              <div className="hero-cta">
                {user ? (
                  <Link to="/citizen/submit" className="btn btn-saffron">File a new complaint</Link>
                ) : (
                  <>
                    <Link to="/register" className="btn btn-saffron">Register &amp; file complaint</Link>
                    <Link to="/login" className="btn btn-outline">Login</Link>
                  </>
                )}
              </div>
            </div>

            <div className="track-card" id="track">
              <h2>Track your complaint</h2>
              <p>Enter the complaint ID you received after filing.</p>
              <form className="track-bar" onSubmit={handleTrack}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. GRV-2026-K3F9A"
                  aria-label="Complaint ID"
                />
                <button type="submit" className="btn btn-primary"><Search size={16} /> Track status</button>
              </form>
            </div>
          </div>
        </section>

        <main className="home-main" id="main-content">
          {/* How it works */}
          <div className="how-grid">
            {steps.map(({ n, title, text }) => (
              <div key={n} className="how-card">
                <span className="how-num">{n}</span>
                <div><h3>{title}</h3><p>{text}</p></div>
              </div>
            ))}
          </div>

          {/* Services */}
          <section className="home-section" id="services">
            <h2>Complaint Categories</h2>
            <p className="section-intro">Select the type of problem you want to report.</p>
            <div className="service-grid">
              {services.map(({ title, text, category, Icon, tone }) => (
                <div key={title} className={`service-card ${tone}`}>
                  <div className="icon-bubble"><Icon size={26} strokeWidth={1.8} /></div>
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
            </div>
          </section>

          {/* Info */}
          <section className="home-section">
            <div className="info-grid">
              <div className="info-box">
                <h3>Before you file</h3>
                <ul>
                  <li><CheckCircle2 size={16} /> Register or log in with your mobile number / email.</li>
                  <li><CheckCircle2 size={16} /> Describe the problem and mark the location on the map.</li>
                  <li><CheckCircle2 size={16} /> Attach a photo if you have one – it speeds up action.</li>
                  <li><CheckCircle2 size={16} /> Note your complaint ID to track progress at any time.</li>
                </ul>
              </div>
              <div className="info-box">
                <h3>Need help?</h3>
                <div className="contact-line"><Phone size={16} /> 1-800-JANSEWA (Toll Free)</div>
                <div className="contact-line"><Mail size={16} /> support@jansewa.gov.in</div>
                <div className="contact-line"><Clock size={16} /> Mon–Sat, 9:00 AM – 6:00 PM</div>
              </div>
            </div>
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
