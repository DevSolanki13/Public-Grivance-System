import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Construction, Droplets, Trash2, Lightbulb } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';

const services = [
  {
    title: 'Pothole repair',
    text: 'Damaged roads, potholes and broken pavements.',
    category: 'Roads & Infrastructure',
    Icon: Construction,
    tone: 'blue',
  },
  {
    title: 'Water supply issues',
    text: 'No water, low pressure or pipe leakage.',
    category: 'Water Supply & Sewage',
    Icon: Droplets,
    tone: 'green',
  },
  {
    title: 'Garbage disposal',
    text: 'Missed pickups, overflowing bins and dumping.',
    category: 'Sanitation & Solid Waste',
    Icon: Trash2,
    tone: 'mint',
  },
  {
    title: 'Streetlight outage',
    text: 'Lights that are dark, flickering or damaged.',
    category: 'Street Lighting & Electricity',
    Icon: Lightbulb,
    tone: 'green',
  },
];

const promptText = {
  file: 'Please login or register to file a complaint.',
  track: 'Please login or register to track your request.',
};

export default function Home() {
  const navigate = useNavigate();
  const { user, demoLogin } = useAuth();
  const [query, setQuery] = useState('');
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (!prompt) return;
    const onKey = (e) => e.key === 'Escape' && setPrompt('');
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prompt]);

  const handleTrack = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!user) {
      navigate(`/track/${encodeURIComponent(query.trim().toUpperCase())}`);
      return;
    }
    navigate(`/citizen/my-grievances?search=${encodeURIComponent(query.trim())}`);
  };

  const handleDemoCitizen = async () => {
    await demoLogin('citizen');
    setPrompt('');
    navigate('/citizen/dashboard');
  };

  return (
    <>
      <div className="home">
        <div className="decor" aria-hidden="true">
          <span className="s1" /><span className="s2" /><span className="s3" /><span className="s4" />
        </div>

        <Navbar role={user ? user.role : 'public'} />
        <div className="band" />

        {/* Track bar */}
        <form className="track-bar" id="track" onSubmit={handleTrack}>
          <Search size={22} color="#456865" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your complaint ID, e.g. GRV-2026-00125"
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
            <div className="modal-actions" style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <Link to="/login" className="btn btn-primary">Login</Link>
              <Link to="/register" className="btn btn-outline">Register</Link>
            </div>
            <div style={{ marginTop: 14, borderTop: '1px solid var(--line, #e2e8f0)', paddingTop: 14 }}>
              <button
                type="button"
                className="btn btn-light"
                style={{ fontSize: 13, width: '100%' }}
                onClick={handleDemoCitizen}
              >
                ⚡ Or preview immediately with Demo Citizen
              </button>
            </div>
            <button type="button" className="link modal-close" style={{ display: 'block', marginTop: 12, textAlign: 'center', width: '100%', border: 'none', background: 'none' }} onClick={() => setPrompt('')}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
