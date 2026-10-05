import React from 'react';
import { Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function OfficerWorkloadPanel({ officers = [] }) {
  const defaultOfficers = [
    {
      id: 'officer-1',
      name: 'Rahul Sharma',
      department: 'Waste Management',
      assigned: 12,
      inProgress: 5,
      overdue: 1,
      slaCompliance: 94,
      status: 'Optimal'
    },
    {
      id: 'officer-2',
      name: 'Sneha Patil',
      department: 'Roads & Infrastructure',
      assigned: 15,
      inProgress: 8,
      overdue: 2,
      slaCompliance: 86,
      status: 'High Workload'
    },
    {
      id: 'officer-3',
      name: 'Vikram Deshmukh',
      department: 'Water Supply',
      assigned: 8,
      inProgress: 3,
      overdue: 0,
      slaCompliance: 98,
      status: 'Available'
    },
    {
      id: 'officer-4',
      name: 'Anjali Nair',
      department: 'Street Lighting & Power',
      assigned: 10,
      inProgress: 4,
      overdue: 0,
      slaCompliance: 96,
      status: 'Optimal'
    }
  ];

  const list = officers.length > 0 ? officers : defaultOfficers;

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
          <Users size={18} color="#0f766e" />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Field Officer Workload & Dispatch Roster</h3>
        </div>
        <span style={{ fontSize: '12px', color: '#64748b' }}>Real-time field distribution</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 12px' }}>Officer Name</th>
              <th style={{ padding: '10px 12px' }}>Department</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Assigned Cases</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>In Progress</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>Overdue</th>
              <th style={{ padding: '10px 12px', textAlign: 'center' }}>SLA On-Time</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Workload State</th>
            </tr>
          </thead>
          <tbody>
            {list.map((officer) => {
              const badge = getStatusColor(officer.status);
              return (
                <tr key={officer.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>
                    {officer.name}
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>
                    {officer.department}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700 }}>
                    {officer.assigned}
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
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: officer.slaCompliance >= 90 ? '#16a34a' : '#ca8a04' }}>
                    {officer.slaCompliance}%
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
                      {officer.status}
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
