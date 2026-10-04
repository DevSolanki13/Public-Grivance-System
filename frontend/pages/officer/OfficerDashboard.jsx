import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import SLABadge from '../../components/common/SLABadge';
import ResolutionModal from '../../components/grievance/ResolutionModal';
import api from '../../api/index.js';
import { Wrench, Clock, AlertTriangle, CheckCircle2, Play, Camera, Search } from 'lucide-react';

const FILTERS = [
  { key: 'ALL', label: 'All Field Cases' },
  { key: 'MY_ASSIGNED', label: '👤 Assigned to Me' },
  { key: 'ACTIVE', label: 'Active Work' },
  { key: 'OVERDUE', label: '🚨 Overdue' },
  { key: 'HIGH_PRIORITY', label: '🔴 High Priority' },
];

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeResolveGrievance, setActiveResolveGrievance] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await api.getGrievances();
      if (res.success) {
        setGrievances(res.grievances || []);
      }
    } catch (err) {
      console.warn('Failed loading officer cases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartWork = async (id) => {
    setActionLoading(id);
    try {
      const res = await api.startWork(id, { remark: 'Officer accepted case and deployed team.' });
      if (res.success) {
        await loadData();
      }
    } catch (err) {
      alert(err.message || 'Failed to start work.');
    } finally {
      setActionLoading(null);
    }
  };

  const overdueCases = grievances.filter((g) => !['CLOSED', 'REJECTED'].includes(g.status) && g.slaInfo?.isOverdue);
  const dueSoonCases = grievances.filter((g) => !['CLOSED', 'REJECTED'].includes(g.status) && g.slaInfo?.status === 'DUE_SOON');
  const highPriorityCases = grievances.filter((g) => ['HIGH', 'CRITICAL'].includes(g.priority));

  const shown = grievances
    .filter((g) => {
      if (filter === 'MY_ASSIGNED') return g.assignedOfficerId === user?.id;
      if (filter === 'OVERDUE') return overdueCases.includes(g);
      if (filter === 'HIGH_PRIORITY') return highPriorityCases.includes(g);
      if (filter === 'ACTIVE') return !['CLOSED', 'REJECTED'].includes(g.status);
      return true;
    })
    .filter((g) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        g.complaintId.toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        (g.location?.area || '').toLowerCase().includes(q)
      );
    });

  return (
    <PageLayout
      role="officer"
      title={`Officer Workspace: ${user?.name || 'Engineer'}`}
      subtitle={`${user?.designation || 'Field Officer'} • ${user?.departmentName || 'Public Works'}`}
    >
      {/* Officer Daily KPI Cards */}
      <div className="stats-grid">
        <StatCard
          icon={Wrench}
          tone="progress"
          value={loading ? '-' : grievances.filter((g) => !['CLOSED', 'REJECTED'].includes(g.status)).length}
          label="Active Assigned Cases"
        />
        <StatCard
          icon={AlertTriangle}
          tone="overdue"
          value={loading ? '-' : overdueCases.length}
          label="Overdue SLA Cases"
        />
        <StatCard
          icon={Clock}
          tone="review"
          value={loading ? '-' : dueSoonCases.length}
          label="Due Soon (< 12 hrs)"
        />
        <StatCard
          icon={CheckCircle2}
          tone="resolved"
          value={loading ? '-' : grievances.filter((g) => g.status === 'CLOSED').length}
          label="Completed Cases"
        />
      </div>

      {/* Filter Chips & Search Bar */}
      <div className="section-head">
        <div className="chips" style={{ marginBottom: 0 }}>
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={'chip ' + (filter === f.key ? 'on' : '')}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search complaint ID or area..."
          style={{
            maxWidth: 260,
            padding: '8px 12px',
            border: '1.5px solid var(--line)',
            borderRadius: 8,
            fontFamily: 'inherit',
          }}
        />
      </div>

      {loading ? (
        <div className="card"><p className="muted">Loading assigned cases...</p></div>
      ) : shown.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <p style={{ margin: 0 }}>No cases match this filter or search.</p>
        </div>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Subject & Citizen</th>
                <th>Location</th>
                <th>Priority</th>
                <th>SLA Deadline</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => (
                <tr key={g.id}>
                  <td>
                    <Link to={`/citizen/grievance/${g.id}`} className="link">
                      {g.complaintId}
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{g.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
                      Citizen: {g.citizenName} ({g.citizenPhone || 'No phone'})
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, color: 'var(--ink)' }}>{g.location?.address || 'Spot'}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-soft)' }}>{g.location?.area}</div>
                  </td>
                  <td><PriorityBadge priority={g.priority} /></td>
                  <td><SLABadge slaInfo={g.slaInfo} /></td>
                  <td><StatusBadge status={g.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {['SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'REOPENED'].includes(g.status) && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleStartWork(g.id)}
                          disabled={actionLoading === g.id}
                        >
                          <Play size={12} />
                          {actionLoading === g.id ? 'Starting...' : 'Start Work'}
                        </button>
                      )}

                      {g.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => setActiveResolveGrievance(g)}
                        >
                          <Camera size={12} /> Submit Proof
                        </button>
                      )}

                      {['AWAITING_VERIFICATION', 'CLOSED'].includes(g.status) && (
                        <Link to={`/citizen/grievance/${g.id}`} className="btn btn-outline btn-sm">
                          View
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Resolution Proof Upload Modal (Supports Upload + Live Camera Capture) */}
      {activeResolveGrievance && (
        <ResolutionModal
          grievance={activeResolveGrievance}
          isOpen={!!activeResolveGrievance}
          onClose={() => setActiveResolveGrievance(null)}
          onResolved={() => loadData()}
        />
      )}
    </PageLayout>
  );
}
