import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { grievanceService } from '../services/grievanceService';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { summarize } from '../utils/analytics';
import { formatDate } from '../utils/dateUtils';
import { friendlyError } from '../lib/supabase';

// Public, signed-out page. Data comes from the anonymised public_grievance_feed()
// database function, which never exposes citizen details.
export default function PublicTransparency() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    grievanceService
      .getPublicFeed()
      .then((data) => !cancelled && setGrievances(data))
      .catch((err) => !cancelled && setError(friendlyError(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = summarize(grievances);
  const show = (v) => (loading ? '-' : v);
  const resolvedCases = grievances
    .filter((g) => g.status === 'Closed')
    .sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt))
    .slice(0, 9);

  return (
    <PageLayout title="Public Transparency Portal" subtitle="Live civic resolution metrics across all municipal departments.">
      <div>
        {error && <p className="error-msg" role="alert">Could not load public statistics: {error}</p>}
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span
            style={{
              background: '#e0f2fe',
              color: '#0369a1',
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 12px',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}
          >
            Public Accountability & Civic Oversight
          </span>
          <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "14px 0 8px" }}>
            JanSewa Public Transparency Portal
          </h2>
          <p style={{ color: '#64748b', fontSize: '15px', maxWidth: '680px', margin: '0 auto' }}>
            Live civic resolution metrics, SLA compliance performance, and verified completed municipal works across all municipal wards.
          </p>
        </div>

        {/* Civic KPIs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f2f5e' }} data-testid="stat-total">{show(stats.total)}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>Total Complaints Filed</div>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a' }} data-testid="stat-closed">{show(stats.closed)}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>Citizen Verified & Resolved</div>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0284c7' }}>{show(stats.inProgress + stats.awaitingVerification)}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>Active in Field Work</div>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#ca8a04' }}>{show(stats.slaRate == null ? '—' : `${stats.slaRate}%`)}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>On-Time SLA Compliance</div>
          </div>
        </div>

        {/* Visual Analytics */}
        {!loading && <AnalyticsCharts grievances={grievances} />}

        {/* Recently Resolved Works Section */}
        <div style={{ marginTop: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Recently Resolved & Verified Works
              </h2>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
                Municipal actions completed by field officers and verified by citizens with photographic evidence
              </p>
            </div>
            <Link to="/#track" className="btn btn-outline" style={{ fontSize: '13px' }}>
              Track a Specific Grievance
            </Link>
          </div>

          {!loading && resolvedCases.length === 0 && (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}><p className="muted">No verified resolutions yet.</p></div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {resolvedCases.map((c) => (
              <div
                key={c.complaintId}
                className="card"
                style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f2f5e' }}>
                    {c.complaintId}
                  </span>
                  <span
                    style={{
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}
                  >
                    ✓ Verified & Closed
                  </span>
                </div>

                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                  {c.subject}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="#0f2f5e" /> {c.location} · {c.category}
                </div>

                {/* Proof Thumbnails */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>
                      Citizen Proof
                    </span>
                    <img
                      src={c.imageUrl}
                      alt="Before"
                      style={{ width: '100%', height: '85px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
                      Officer Fix Proof
                    </span>
                    <img
                      src={c.resolutionImageUrl}
                      alt="After"
                      style={{ width: '100%', height: '85px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#475569',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <span>Resolved by {c.assignedOfficerName || 'Field Officer'} · {formatDate(c.closedAt)}</span>
                  <span style={{ color: '#ca8a04', fontWeight: 700 }}>{c.rating != null ? `${c.rating}.0 ★` : '—'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
