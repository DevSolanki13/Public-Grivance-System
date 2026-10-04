import React, { useState, useEffect } from 'react';
import PageLayout from '../../components/layout/PageLayout';
import api from '../../../api/index.js';
import StatCard from '../../components/common/StatCard';
import { ShieldCheck, CheckCircle2, Clock, AlertTriangle, Building2, TrendingUp } from 'lucide-react';

export default function Transparency() {
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, deptRes] = await Promise.all([
          api.getStats(),
          api.getDepartments(),
        ]);
        if (statsRes.success) setStats(statsRes.stats);
        if (deptRes.success) setDepartments(deptRes.departments || []);
      } catch (err) {
        console.warn('Failed loading transparency data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <PageLayout
      title="Public Transparency Portal"
      subtitle="Live public data on municipal grievance redressal and departmental SLA compliance"
    >
      <div className="stats-grid">
        <StatCard
          icon={ShieldCheck}
          tone="total"
          value={loading ? '-' : stats?.total || 0}
          label="Total Public Complaints"
        />
        <StatCard
          icon={CheckCircle2}
          tone="resolved"
          value={loading ? '-' : stats?.resolved || 0}
          label="Verified & Resolved"
        />
        <StatCard
          icon={Clock}
          tone="progress"
          value={loading ? '-' : `${stats?.slaCompliance || 100}%`}
          label="SLA Compliance Rate"
          subtitle="Grievances resolved within guaranteed time"
        />
        <StatCard
          icon={TrendingUp}
          tone="purple"
          value={loading ? '-' : `${stats?.averageResolutionHours || 32} hrs`}
          label="Avg Resolution Speed"
          subtitle="From filing to field closure"
        />
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>
          Departmental SLA Compliance & Redressal Performance
        </h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Head Officer</th>
                <th>Guaranteed SLA</th>
                <th>Total Cases</th>
                <th>Active Cases</th>
                <th>Resolved</th>
                <th>SLA Compliance</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept.id}>
                  <td style={{ fontWeight: 700, color: '#0f172a' }}>{dept.name}</td>
                  <td>{dept.headOfficerName}</td>
                  <td>{dept.slaHoursDefault} Hours</td>
                  <td>{dept.totalGrievances}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: dept.activeGrievances > 0 ? '#2563eb' : '#64748b' }}>
                      {dept.activeGrievances}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#059669' }}>{dept.resolvedGrievances}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 4, width: 80 }}>
                        <div
                          style={{
                            height: '100%',
                            borderRadius: 4,
                            background: dept.slaCompliance > 85 ? '#10b981' : '#f59e0b',
                            width: `${dept.slaCompliance}%`,
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{dept.slaCompliance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageLayout>
  );
}
