import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import api from '../../../api/index.js';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import SLABadge from '../../components/common/SLABadge';
import StatusStepper from '../../components/common/StatusStepper';
import { Clock, MapPin, Building2, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function TrackPublic() {
  const { id } = useParams();
  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTracking() {
      setLoading(true);
      setError('');
      try {
        const res = await api.trackPublic(id);
        if (res.success && res.grievance) {
          setGrievance(res.grievance);
        } else {
          setError(res.message || 'Grievance not found.');
        }
      } catch (err) {
        setError(err.message || 'Could not find a grievance matching this ID.');
      } finally {
        setLoading(false);
      }
    }
    fetchTracking();
  }, [id]);

  return (
    <PageLayout
      title={grievance ? `Tracking: ${grievance.complaintId}` : 'Public Grievance Tracking'}
      subtitle={grievance?.subject || 'Real-time municipal status verification'}
      action={
        <Link to="/" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          <ArrowLeft size={14} /> Back to Search
        </Link>
      }
    >
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: '#64748b', fontSize: 15 }}>Looking up complaint record...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <p style={{ color: '#dc2626', fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{error}</p>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20 }}>
            Please check the complaint ID (e.g. <code>GRV-2026-00125</code>) and try again.
          </p>
          <Link to="/" className="btn btn-primary">Return to Home</Link>
        </div>
      ) : (
        <div>
          {/* Stepper Card */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusBadge status={grievance.status} />
                <PriorityBadge priority={grievance.priority} />
              </div>
              <SLABadge slaInfo={grievance.slaInfo} />
            </div>

            <StatusStepper status={grievance.status} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {/* Complaint Overview */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
                Grievance Particulars
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Department</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Building2 size={16} color="#0284c7" />
                    {grievance.department}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Category & Subcategory</div>
                  <div style={{ fontSize: 14, color: '#334155', marginTop: 2 }}>
                    {grievance.category} {grievance.subcategory ? `› ${grievance.subcategory}` : ''}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Locality / Area</div>
                  <div style={{ fontSize: 14, color: '#334155', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <MapPin size={16} color="#059669" />
                    {grievance.area}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Date Registered</div>
                  <div style={{ fontSize: 14, color: '#334155', marginTop: 2 }}>
                    {new Date(grievance.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            {/* Public Timeline Updates */}
            <div className="card">
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
                Status Updates & Milestones
              </h3>

              <ul className="timeline-list">
                {grievance.timeline?.map((step) => (
                  <li key={step.id || step.title} className="timeline-item">
                    <span className="timeline-dot" />
                    <p className="timeline-title">{step.title}</p>
                    <p className="timeline-desc">{step.description}</p>
                    <p className="timeline-meta">
                      {new Date(step.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}
