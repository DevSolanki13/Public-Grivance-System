import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/layout/PageLayout';
import api from '../../api/index.js';
import { Users, Phone, Mail, ArrowLeft } from 'lucide-react';

export default function OfficerWorkload() {
  const { user } = useAuth();
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOfficers() {
      try {
        const res = await api.getOfficers({ departmentId: user?.departmentId });
        if (res.success) {
          setOfficers(res.officers || []);
        }
      } catch (err) {
        console.warn('Failed to load workload:', err);
      } finally {
        setLoading(false);
      }
    }
    loadOfficers();
  }, [user?.departmentId]);

  return (
    <PageLayout
      role="department_head"
      title="Field Officer Workload Distribution"
      subtitle="Monitor officer capacity, active case allocations, and resolve assignment bottlenecks"
      action={
        <Link to="/department/dashboard" className="btn btn-light">
          <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Back to Dashboard
        </Link>
      }
    >
      {loading ? (
        <div className="card"><p className="muted">Loading officers...</p></div>
      ) : officers.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <p className="muted">No officers found for this department.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {officers.map((off) => (
            <div key={off.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>{off.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{off.designation || 'Field Engineer'}</p>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: 12,
                    background: off.workloadLevel === 'High' ? '#fee2e2' : off.workloadLevel === 'Medium' ? '#fef3c7' : '#eaf8f5',
                    color: off.workloadLevel === 'High' ? '#b91c1c' : off.workloadLevel === 'Medium' ? '#92400e' : '#0a6b66',
                    border: '1px solid currentColor',
                  }}
                >
                  {off.workloadLevel} Workload
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Mail size={14} color="var(--accent-dark)" /> {off.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Phone size={14} color="var(--card-green)" /> {off.phone || '022-28190011'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, background: '#f4fbf9', padding: '12px', borderRadius: 10, textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-dark)' }}>{off.activeCases}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>Active</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>{off.overdueCases}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>Overdue</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--green)' }}>{off.resolvedCases}</div>
                  <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 600 }}>Closed</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
