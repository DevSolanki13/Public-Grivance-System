import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, AlertTriangle, Clock, CheckCircle2, Eye, History } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useGrievances } from '../../hooks/useGrievances';
import { formatDate } from '../../utils/dateUtils';

function OfficerDashboard() {
  const { profile } = useAuth();
  const { grievances, loading, error } = useGrievances();
  const [tabMode, setTabMode] = useState('active'); // 'active' | 'history'
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Dashboards only display active tasks; Closed and Rejected move to history archive
  const activeGrievances = grievances.filter(
    (g) => g.status !== 'Closed' && g.status !== 'Rejected'
  );

  const historyGrievances = grievances.filter(
    (g) => g.status === 'Closed' || g.status === 'Rejected'
  );

  const countActiveStatus = (s) => activeGrievances.filter((g) => g.status === s || (s === 'In Progress' && g.status === 'Reopened')).length;
  const countActivePriority = (p) =>
    activeGrievances.filter((g) => (g.priority || '').toLowerCase() === p.toLowerCase()).length;

  const currentDataset = tabMode === 'active' ? activeGrievances : historyGrievances;

  const shown = currentDataset.filter((g) => {
    if (tabMode === 'active') {
      if (filter === 'In Progress' && g.status !== 'In Progress' && g.status !== 'Reopened') return false;
      if (filter === 'Awaiting Verification' && g.status !== 'Resolved') return false;
      if (filter === 'High Priority' && (g.priority || '').toLowerCase() !== 'high' && (g.priority || '').toLowerCase() !== 'critical') return false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchId = (g.complaintId || '').toLowerCase().includes(q);
      const matchCat = (g.category || '').toLowerCase().includes(q);
      const matchSubj = (g.subject || '').toLowerCase().includes(q);
      const matchLoc = (g.location || '').toLowerCase().includes(q);
      return matchId || matchCat || matchSubj || matchLoc;
    }
    return true;
  });

  return (
    <PageLayout
      role="officer"
      title={`Officer Portal: ${profile?.name || 'Field Officer'}`}
      subtitle="Investigate active field cases and upload resolution proofs. Completed cases are archived in History."
    >
      {error && <p className="error-msg">{error}</p>}

      {/* Active KPI Statistics Grid */}
      <div className="stats-grid">
        <StatCard
          icon={Briefcase}
          tone="total"
          value={loading ? '-' : activeGrievances.length}
          label="Active Assigned Cases"
        />
        <StatCard
          icon={Clock}
          tone="progress"
          value={loading ? '-' : countActiveStatus('In Progress')}
          label="In Field Work"
        />
        <StatCard
          icon={AlertTriangle}
          tone="review"
          value={loading ? '-' : (countActivePriority('high') + countActivePriority('critical'))}
          label="High / Critical Urgent"
        />
        <StatCard
          icon={CheckCircle2}
          tone="resolved"
          value={loading ? '-' : historyGrievances.length}
          label="Historical Closed / Verified"
        />
      </div>

      {/* Primary Tab Switcher */}
      <div style={{ display: 'flex', gap: '10px', margin: '20px 0 16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => {
            setTabMode('active');
            setFilter('All');
          }}
          style={{
            background: tabMode === 'active' ? '#0f2f5e' : '#f8fafc',
            color: tabMode === 'active' ? '#ffffff' : '#475569',
            border: '1px solid ' + (tabMode === 'active' ? '#0f2f5e' : '#cbd5e1'),
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Active Assigned Queue ({activeGrievances.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setTabMode('history');
            setFilter('All');
          }}
          style={{
            background: tabMode === 'history' ? '#0f2f5e' : '#f8fafc',
            color: tabMode === 'history' ? '#ffffff' : '#475569',
            border: '1px solid ' + (tabMode === 'history' ? '#0f2f5e' : '#cbd5e1'),
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease'
          }}
        >
          <History size={16} /> Completed Case History ({historyGrievances.length})
        </button>
      </div>

      <div className="card">
        <div className="filter-bar">
          {tabMode === 'active' ? (
            <div className="filter-pills">
              {['All', 'In Progress', 'Awaiting Verification', 'High Priority'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`chip ${filter === tab ? 'on' : ''}`}
                  onClick={() => setFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              Archived records for completed, citizen-verified, and rejected cases.
            </div>
          )}

          <div className="search-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, category, location..."
              className="input"
              style={{ padding: '8px 12px', minWidth: '240px' }}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <p className="muted">Loading cases...</p>
          </div>
        ) : shown.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 20px', textAlign: 'center' }}>
            <p className="muted">
              {tabMode === 'active'
                ? 'No active cases in your assigned queue.'
                : 'No historical closed cases found.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Grievance ID</th>
                  <th>Issue Details</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Location</th>
                  <th>Filed Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <Link to={`/officer/grievance/${g.id}`} className="link">
                        <strong>{g.complaintId}</strong>
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{g.subject}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Citizen: {g.citizenName}
                      </div>
                    </td>
                    <td>{g.category}</td>
                    <td>
                      <span className={`priority-badge priority-${(g.priority || 'medium').toLowerCase()}`}>
                        {g.priority || 'Medium'}
                      </span>
                    </td>
                    <td>{g.location}</td>
                    <td>{formatDate(g.createdAt)}</td>
                    <td>
                      <StatusBadge status={g.status} />
                    </td>
                    <td>
                      <Link
                        to={`/officer/grievance/${g.id}`}
                        className="btn btn-outline"
                        style={{ fontSize: '12px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={13} />
                        {tabMode === 'active' ? 'Investigate & Resolve' : 'View Archive'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default OfficerDashboard;
