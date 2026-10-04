import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Eye, Wrench, Check, AlertCircle } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/common/StatCard';
import StatusStepper from '../../components/common/StatusStepper';
import VerificationModal from '../../components/grievance/VerificationModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../../api/index.js';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeVerifyGrievance, setActiveVerifyGrievance] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getGrievances();
      if (res.success) {
        setGrievances(res.grievances || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load your grievances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const count = (status) =>
    grievances.filter((g) => {
      const s = (g.status || '').toUpperCase().replace(/\s+/g, '_');
      if (status === 'Under Review') return s === 'UNDER_REVIEW' || s === 'ASSIGNED';
      if (status === 'In Progress') return s === 'IN_PROGRESS' || s === 'REOPENED';
      if (status === 'Resolved') return s === 'CLOSED' || s === 'RESOLVED';
      return false;
    }).length;

  const show = (n) => (loading ? '-' : n);
  const active = grievances.filter((g) => {
    const s = (g.status || '').toUpperCase().replace(/\s+/g, '_');
    return s !== 'CLOSED' && s !== 'RESOLVED' && s !== 'REJECTED';
  });

  const awaitingVerification = grievances.filter((g) => {
    const s = (g.status || '').toUpperCase().replace(/\s+/g, '_');
    return s === 'AWAITING_VERIFICATION' || s === 'RESOLUTION_SUBMITTED';
  });

  return (
    <PageLayout
      role="citizen"
      title={`Welcome, ${user?.name?.split(' ')[0] || 'Citizen'}`}
      subtitle="Here is where your complaints stand today."
      action={<Link to="/citizen/submit" className="btn btn-light">File a complaint</Link>}
    >
      {error && <p className="error-msg">{error}</p>}

      {/* Verification alert banner if officer submitted proof */}
      {awaitingVerification.length > 0 && (
        <div
          style={{
            background: '#fff7ed',
            border: '1.5px solid #fdba74',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertCircle size={22} color="#ea580c" />
            <div>
              <p style={{ fontWeight: 800, color: '#9a3412', margin: 0, fontSize: 15 }}>
                {awaitingVerification.length} Complaint(s) Awaiting Your Verification
              </p>
              <p style={{ margin: 0, fontSize: 13, color: '#7c2d12' }}>
                The field engineer has submitted completion photos. Please inspect and approve or reopen.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            style={{ background: '#ea580c', borderColor: '#ea580c', fontSize: 13 }}
            onClick={() => setActiveVerifyGrievance(awaitingVerification[0])}
          >
            Verify Resolution
          </button>
        </div>
      )}

      <div className="stats-grid">
        <StatCard icon={ClipboardList} tone="total" value={show(grievances.length)} label="Total complaints" />
        <StatCard icon={Eye} tone="review" value={show(count('Under Review'))} label="Under review" />
        <StatCard icon={Wrench} tone="progress" value={show(count('In Progress'))} label="In progress" />
        <StatCard icon={Check} tone="resolved" value={show(count('Resolved'))} label="Resolved" />
      </div>

      <div className="section-head">
        <h2>My active requests</h2>
        <Link to="/citizen/my-grievances" className="link">View all grievances</Link>
      </div>

      {loading ? (
        <div className="card"><p className="muted">Loading your grievances...</p></div>
      ) : active.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <p style={{ fontSize: 16, marginBottom: 12 }}>You have no active requests.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link to="/citizen/submit" className="btn btn-primary">File a complaint</Link>
          </div>
        </div>
      ) : (
        active.map((g) => {
          const isAwaiting = ['AWAITING_VERIFICATION', 'RESOLUTION_SUBMITTED'].includes((g.status || '').toUpperCase().replace(/\s+/g, '_'));
          return (
            <div className="card active-card" key={g.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <h3>
                  <Link to={`/citizen/grievance/${g.id}`} className="link">{g.complaintId}</Link> | {g.subject}
                </h3>
                {isAwaiting && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ fontSize: 12, padding: '5px 12px', background: '#ea580c', borderColor: '#ea580c' }}
                    onClick={() => setActiveVerifyGrievance(g)}
                  >
                    Verify Resolution
                  </button>
                )}
              </div>

              <StatusStepper status={g.status} />

              <p className="active-meta">
                <strong>Category:</strong> {g.category} &nbsp;|&nbsp;{' '}
                <strong>Location:</strong> {g.location?.address || g.location?.area || 'Ward'} &nbsp;|&nbsp;{' '}
                <strong>Filed:</strong> {formatDate(g.createdAt)} &nbsp;|&nbsp;{' '}
                <strong>Status:</strong> <span className="st">{g.status?.replace(/_/g, ' ')}</span>
              </p>
            </div>
          );
        })
      )}

      {/* Verification Modal */}
      {activeVerifyGrievance && (
        <VerificationModal
          grievance={activeVerifyGrievance}
          isOpen={!!activeVerifyGrievance}
          onClose={() => setActiveVerifyGrievance(null)}
          onVerified={() => load()}
        />
      )}
    </PageLayout>
  );
}
