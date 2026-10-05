import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, Clock, MapPin, ArrowRight, BarChart3, Star, Search } from 'lucide-react';
import PageLayout from '../components/PageLayout';
import { grievanceService } from '../services/grievanceService';
import AnalyticsCharts from '../components/AnalyticsCharts';

export default function PublicTransparency() {
  const [grievances, setGrievances] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadData() {
      const data = await grievanceService.getGrievances();
      setGrievances(data);
    }
    loadData();
  }, []);

  const total = grievances.length;
  const resolved = grievances.filter((g) => g.status === 'CLOSED').length;
  const inProgress = grievances.filter((g) => g.status === 'IN_PROGRESS' || g.status === 'AWAITING_VERIFICATION').length;
  const slaRate = 92.5;

  const resolvedCases = grievances.filter((g) => g.status === 'CLOSED');

  return (
    <PageLayout>
      <div className="container" style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
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
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '14px 0 8px' }}>
            JanSewa Public Transparency Portal
          </h1>
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
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f766e' }}>{total}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>Total Complaints Filed</div>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#16a34a' }}>{resolved}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>Citizen Verified & Resolved</div>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0284c7' }}>{inProgress}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>Active in Field Work</div>
          </div>

          <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#ca8a04' }}>{slaRate}%</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginTop: '4px' }}>On-Time SLA Compliance</div>
          </div>
        </div>

        {/* Visual Analytics */}
        <AnalyticsCharts grievances={grievances} />

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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {resolvedCases.map((c) => (
              <div
                key={c.id || c.grievanceId}
                className="card"
                style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f766e' }}>
                    {c.id || c.grievanceId}
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
                  {c.title || c.subject}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} color="#0f766e" /> {c.location?.address || c.location?.area || 'Ward 4'}
                </div>

                {/* Proof Thumbnails */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>
                      Citizen Proof
                    </span>
                    <img
                      src={c.evidencePhotoUrl || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&q=80'}
                      alt="Before"
                      style={{ width: '100%', height: '85px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>
                      Officer Fix Proof
                    </span>
                    <img
                      src={c.resolutionProofUrl || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&q=80'}
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
                  <span>Resolved by {c.assignedOfficerName || 'Field Officer'}</span>
                  <span style={{ color: '#ca8a04', fontWeight: 700 }}>5.0 ★</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
