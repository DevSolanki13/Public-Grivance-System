import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Eye, Wrench, Check, Users, BarChart3, ListFilter, History } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { grievanceService } from '../../services/grievanceService';
import OfficerWorkloadPanel from '../../components/OfficerWorkloadPanel';
import AnalyticsCharts from '../../components/AnalyticsCharts';
import { formatDate } from '../../utils/dateUtils';

const isPending = (g) => g.status === 'Submitted' || g.status === 'Under Review';

const FILTERS = {
  All: () => true,
  Pending: isPending,
  'In Progress': (g) => g.status === 'In Progress',
  'Awaiting Verification': (g) => g.status === 'Resolved' || g.awaitingCitizenVerification,
};

function AdminDashboard() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('cases'); // 'cases', 'workload', 'history', 'analytics'
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await grievanceService.getGrievances({ user, role: 'admin' });
        setGrievances(list);
      } catch (err) {
        console.error(err);
        setError('Failed to load grievances.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Dashboards only contain active operational queues; Closed and Rejected cases are stored in History
  const activeCases = grievances.filter(
    (g) => g.status !== 'Closed' && g.status !== 'Rejected'
  );

  const historyCases = grievances.filter(
    (g) => g.status === 'Closed' || g.status === 'Rejected'
  );

  const currentDataset = activeTab === 'history' ? historyCases : activeCases;

  const shown = currentDataset
    .filter(activeTab === 'cases' ? FILTERS[filter] || (() => true) : () => true)
    .filter((g) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (g.complaintId || g.id || '').toLowerCase().includes(q) ||
        (g.citizenName || '').toLowerCase().includes(q) ||
        (g.category || '').toLowerCase().includes(q) ||
        (g.department || '').toLowerCase().includes(q)
      );
    });

  return (
    <PageLayout
      role="admin"
      title="System Administration & Command"
      subtitle="Cross-departmental public grievance governance. Active queue excludes closed/rejected cases, which are safely archived in History."
    >
      {error && <p className="error-msg">{error}</p>}

      {/* Synchronized System KPIs */}
      <div className="stats-grid">
        <StatCard icon={ClipboardList} tone="total" value={loading ? '-' : activeCases.length} label="Active Complaints" />
        <StatCard icon={Eye} tone="review" value={loading ? '-' : activeCases.filter(isPending).length} label="Pending Triage" />
        <StatCard icon={Wrench} tone="progress" value={loading ? '-' : activeCases.filter((g) => g.status === 'In Progress').length} label="In Field Work" />
        <StatCard icon={Check} tone="resolved" value={loading ? '-' : historyCases.length} label="Archived in History" />
      </div>

      {/* Admin Tabs */}
      <div style={{ display: 'flex', gap: '8px', margin: '24px 0 16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setActiveTab('cases')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'cases' ? '#0f766e' : '#f1f5f9',
            color: activeTab === 'cases' ? '#ffffff' : '#475569'
          }}
        >
          <ListFilter size={15} /> Active Queue ({activeCases.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('workload')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'workload' ? '#0f766e' : '#f1f5f9',
            color: activeTab === 'workload' ? '#ffffff' : '#475569'
          }}
        >
          <Users size={15} /> Field Officer Roster
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'history' ? '#0f766e' : '#f1f5f9',
            color: activeTab === 'history' ? '#ffffff' : '#475569'
          }}
        >
          <History size={15} /> Grievance History ({historyCases.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            background: activeTab === 'analytics' ? '#0f766e' : '#f1f5f9',
            color: activeTab === 'analytics' ? '#ffffff' : '#475569'
          }}
        >
          <BarChart3 size={15} /> Civic Performance Analytics
        </button>
      </div>

      {/* Tab 1: Active Cases Queue OR Tab 3: History */}
      {(activeTab === 'cases' || activeTab === 'history') && (
        <>
          <div className="section-head">
            {activeTab === 'cases' ? (
              <div className="chips" style={{ marginBottom: 0 }}>
                {Object.keys(FILTERS).map((f) => (
                  <button key={f} className={'chip ' + (filter === f ? 'on' : '')} onClick={() => setFilter(f)}>{f}</button>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
                Historical archive of all closed, citizen-verified, and rejected grievances across all departments.
              </div>
            )}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, citizen, category..."
              style={{ maxWidth: 280, padding: '8px 12px', border: '1.5px solid var(--line)', borderRadius: 8, fontFamily: 'inherit' }}
            />
          </div>

          {loading ? (
            <div className="card"><p className="muted">Loading grievances...</p></div>
          ) : shown.length === 0 ? (
            <div className="card" style={{ padding: '30px 20px', textAlign: 'center' }}>
              <p className="muted">
                {activeTab === 'cases'
                  ? 'No active grievances match this filter or search.'
                  : 'No historical closed or rejected records found.'}
              </p>
            </div>
          ) : (
            <div className="table-wrap card" style={{ padding: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Citizen</th>
                    <th>Category</th>
                    <th>Department</th>
                    <th>Assigned Officer</th>
                    <th>Priority</th>
                    <th>Filed Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((g) => (
                    <tr key={g.id || g.complaintId}>
                      <td>
                        <Link to={`/admin/grievance/${g.id || g.complaintId}`} className="link">
                          <strong>{g.complaintId || g.id}</strong>
                        </Link>
                      </td>
                      <td>{g.citizenName}</td>
                      <td>{g.category}</td>
                      <td>{g.department || '—'}</td>
                      <td>
                        {g.assignedOfficerName ? `👤 ${g.assignedOfficerName}` : <span style={{ color: '#d97706', fontSize: '12px' }}>Unassigned</span>}
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: g.priority === 'CRITICAL' ? '#dc2626' : g.priority === 'HIGH' ? '#ea580c' : '#0f766e'
                          }}
                        >
                          {g.priority || 'MEDIUM'}
                        </span>
                      </td>
                      <td>{formatDate(g.createdAt)}</td>
                      <td><StatusBadge status={g.status} /></td>
                      <td>
                        <Link
                          to={`/admin/grievance/${g.id || g.complaintId}`}
                          className="btn btn-outline"
                          style={{ fontSize: '11px', padding: '3px 8px' }}
                        >
                          {activeTab === 'cases' ? 'Manage' : 'View Record'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Officer Workload */}
      {activeTab === 'workload' && (
        <OfficerWorkloadPanel />
      )}

      {/* Tab 4: Analytics */}
      {activeTab === 'analytics' && (
        <AnalyticsCharts grievances={grievances} />
      )}
    </PageLayout>
  );
}

export default AdminDashboard;
