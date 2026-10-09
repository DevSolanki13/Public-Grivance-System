import { useEffect, useState } from 'react';
import { Users, AlertTriangle } from 'lucide-react';
import { grievanceService } from '../services/grievanceService';
import { officerWorkload } from '../utils/analytics';
import { friendlyError } from '../lib/supabase';

// Live officer roster: officers come from profiles, case counts from the
// grievances the viewer can see (a department head sees their department).
export default function OfficerWorkloadPanel({ grievances = [], department }) {
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    grievanceService
      .getOfficers({ department })
      .then((list) => !cancelled && setOfficers(list))
      .catch((err) => !cancelled && setError(friendlyError(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [department]);

  const list = officerWorkload(officers, grievances);

  const getStatusColor = (status) => {
    switch (status) {
      case 'High Workload':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'Optimal':
        return { bg: '#dcfce7', text: '#16a34a' };
      default:
        return { bg: '#e0f2fe', text: '#0284c7' };
    }
  };

  return (
    <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="#0f2f5e" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Field Officer Workload & Dispatch Roster</h3>
        </div>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{department || 'All departments'}</span>
      </div>

      {error && <p className="error-msg">Could not load officers: {error}</p>}
      {loading && <p className="muted">Loading officer roster...</p>}
      {!loading && !error && list.length === 0 && <p className="muted">No field officers found.</p>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 12px' }}>Officer Name</th>
              <th style={{ padding: '10px 12px' }}>Department</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Total Cases</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Active</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>In Progress</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Overdue</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>SLA On-Time</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Workload State</th>
            </tr>
          </thead>
          <tbody>
            {list.map((officer) => {
              const badge = getStatusColor(officer.state);
              return (
                <tr key={officer.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                    {officer.name}
                    {officer.designation && <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{officer.designation}</div>}
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {officer.department}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>
                    {officer.assigned}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {officer.active}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#0284c7', fontWeight: 600 }}>
                    {officer.inProgress}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {officer.overdue > 0 ? (
                      <span style={{ color: '#dc2626', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <AlertTriangle size={13} /> {officer.overdue}
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 600 }}>0</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: officer.slaRate == null ? '#64748b' : officer.slaRate >= 90 ? '#16a34a' : '#ca8a04' }}>
                    {officer.slaRate == null ? '—' : `${officer.slaRate}%`}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.text,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 700
                      }}
                    >
                      {officer.state}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
