import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Construction, Droplets, Trash2, Lightbulb } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/index.js';

// slaHours mirrors the category SLA on the server; shown as the promise to citizens.
const services = [
  { title: 'Roads and potholes', text: 'Potholes, damaged roads, broken footpaths and dividers.', category: 'Roads & Infrastructure', Icon: Construction, slaHours: 120 },
  { title: 'Water supply and drainage', text: 'No water, low pressure, dirty water, pipe leaks and sewage overflow.', category: 'Water Supply & Sewage', Icon: Droplets, slaHours: 72 },
  { title: 'Garbage and sanitation', text: 'Missed pickups, overflowing bins, dumping and public toilets.', category: 'Sanitation & Solid Waste', Icon: Trash2, slaHours: 48 },
  { title: 'Streetlights and electricity', text: 'Dark or flickering streetlights, damaged poles and loose wires.', category: 'Street Lighting & Electricity', Icon: Lightbulb, slaHours: 48 },
];

const steps = [
  { title: 'File your complaint', text: 'Describe the problem, mark the location and add photos.' },
  { title: 'An officer is assigned', text: 'Your complaint goes to the right department with a deadline.' },
  { title: 'Work is done and photographed', text: 'The officer uploads proof when the work is finished.' },
  { title: 'You confirm or reopen', text: 'It closes only when you are satisfied. If not, it escalates.' },
];

const formatSla = (h) => (h % 24 === 0 ? `${h / 24} ${h / 24 === 1 ? 'day' : 'days'}` : `${h} hours`);

const promptText = {
  file: 'Please login or register to file a complaint.',
  track: 'Please login or register to track your request.',
};

export default function Home() {
  const navigate = useNavigate();
  const { user, demoLogin } = useAuth();
  const [query, setQuery] = useState('');
  const [prompt, setPrompt] = useState('');
  const [stats, setStats] = useState(null);

  // City-wide numbers (public endpoint). The page still works if this fails.
  useEffect(() => {
    api.getStats().then((res) => res.success && setStats(res.stats)).catch(() => {});
  }, []);

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

  const fileLink = (category, label = 'File complaint') =>
    user ? (
      <Link to={`/citizen/submit?category=${encodeURIComponent(category)}`} className="btn btn-outline btn-sm">{label}</Link>
    ) : (
      <button type="button" className="btn btn-outline btn-sm" onClick={() => setPrompt('file')}>{label}</button>
    );

  return (
    <>
      <div className="home">
        <Navbar role={user ? user.role : 'public'} />

        <section className="hero">
          <div className="hero-inner">
            <div>
              <h1>Report a civic problem. See it fixed.</h1>
              <p className="hero-lede">
                Every complaint gets a department, an officer and a deadline you can check at any time.
                Nothing is marked closed until you confirm the work.
              </p>
              <div className="hero-actions">
                {user ? (
                  <Link to="/citizen/submit" className="btn btn-accent">File a complaint</Link>
                ) : (
                  <button type="button" className="btn btn-accent" onClick={() => setPrompt('file')}>File a complaint</button>
                )}
                <Link to="/transparency" className="btn btn-outline">See city performance</Link>
              </div>
            </div>

            <div className="docket" id="track">
              <h2>Track a complaint</h2>
              <p>Enter the ID you received when you filed it. No login needed.</p>
              <form onSubmit={handleTrack}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="GRV-2026-00125"
                  aria-label="Complaint ID"
                />
                <button type="submit" className="btn btn-primary btn-block">Track complaint</button>
              </form>
              <div className="sample">
                Want to see how it looks?{' '}
                <button type="button" onClick={() => setQuery('GRV-2026-00118')}>Use a sample ID</button>
              </div>
            </div>
          </div>
        </section>

        {stats && (
          <section className="ledger" aria-label="City performance">
            <div className="ledger-inner">
              <div className="ledger-item">
                <strong>{stats.resolved}</strong>
                <span>complaints closed after citizen confirmation</span>
              </div>
              <div className="ledger-item">
                <strong>{stats.slaCompliance}%</strong>
                <span>within their deadline</span>
              </div>
              <div className="ledger-item">
                <strong>{stats.averageResolutionHours ? `${Math.round(stats.averageResolutionHours)} hours` : 'No data yet'}</strong>
                <span>average time to close. <Link to="/transparency" className="link">Full figures</Link></span>
              </div>
            </div>
          </section>
        )}

        <main className="home-main">
          <section className="home-section" id="services">
            <h2>What can you report?</h2>
            <p>Each department commits to a deadline. If it is missed, the complaint is flagged and escalated automatically.</p>
            <div className="service-list">
              {services.map(({ title, text, category, Icon, slaHours }) => (
                <div key={title} className="service-row">
                  <div className="ico"><Icon size={26} strokeWidth={1.7} /></div>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                  <div className="promise">
                    Resolved within {formatSla(slaHours)}
                    <small>from the time you file</small>
                  </div>
                  {fileLink(category)}
                </div>
              ))}
            </div>
          </section>

          <section className="home-section">
            <h2>How a complaint is handled</h2>
            <p>You can follow each stage from your dashboard or with the complaint ID.</p>
            <ol className="steps">
              {steps.map((s) => (
                <li key={s.title}>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </li>
              ))}
            </ol>
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
            {import.meta.env.DEV && (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                <button type="button" className="btn btn-light" style={{ fontSize: 13, width: '100%', borderColor: 'var(--line)' }} onClick={handleDemoCitizen}>
                  Preview as demo citizen (dev only)
                </button>
              </div>
            )}
            <button type="button" className="link modal-close" style={{ display: 'block', marginTop: 12, textAlign: 'center', width: '100%', border: 'none', background: 'none' }} onClick={() => setPrompt('')}>
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
