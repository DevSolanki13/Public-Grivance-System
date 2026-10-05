import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, AlertCircle, CheckCircle2, Clock, Eye, Users, BarChart3, ListFilter, History } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { grievanceService } from '../../services/grievanceService';
import OfficerWorkloadPanel from '../../components/OfficerWorkloadPanel';
import AnalyticsCharts from '../../components/AnalyticsCharts';
import { formatDate } from '../../utils/dateUtils';

function DepartmentDashboard() {
  const { user, profile } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('cases'); // 'cases', 'workload', 'history', 'analytics'
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const deptName = profile?.departmentName || profile?.departmentId || 'Waste & Civic Infrastructure';

  useEffect(() => {
    const loadDeptData = async () => {
      try {
        setLoading(true);
        const list = await grievanceService.getGrievances({
          user,
          role: 'department_head',
          departmentId: profile?.departmentId,
        });
        setGrievances(list);
      } catch (err) {
        console.error(err);
        setError('Failed to load department grievances.');
      } finally {
        setLoading(false);
      }
    };

    loadDeptData();
  }, [user, profile?.departmentId]);

  // Closed and Rejected cases are excluded from the active operational queue
  const activeCases = grievances.filter(
    (g) => g.status !== 'Closed' && g.status !== 'Rejected'
  );

  const historyCases = grievances.filter(
    (g) => g.status === 'Closed' || g.status === 'Rejected'
  );

  const countActiveStatus = (s) => activeCases.filter((g) => g.status === s).length;
  const countPending = () => activeCases.filter((g) => g.status === 'Submitted' || g.status === 'Under Review').length;

  const currentDataset = activeTab === 'history' ? historyCases : activeCases;

  const shown = currentDataset.filter((g) => {
    if (activeTab === 'cases') {
      if (filter === 'Pending' && (g.status !== 'Submitted' && g.status !== 'Under Review')) return false;
      if (filter === 'In Progress' && g.status !== 'In Progress') return false;
      if (filter === 'Awaiting Verification' && g.status !== 'Resolved' && !g.awaitingCitizenVerification) return false;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchId = (g.complaintId || g.id || '').toLowerCase().includes(q);
      const matchCat = (g.category || '').toLowerCase().includes(q);
      const matchSubj = (g.subject || '').toLowerCase().includes(q);
      const matchOfficer = (g.assignedOfficerName || '').toLowerCase().includes(q);
      return matchId || matchCat || matchSubj || matchOfficer;
    }
    return true;
  });

  return (
    <PageLayout
      role="department_head"
      title={`Department Command: ${deptName}`}
      subtitle="Monitor active department cases and officer allocations. Closed and rejected cases are archived in History."
    >
      {error && <p className="error-msg">{error}</p>}

      {/* Synchronized Department KPIs */}
      <div className="stats-grid">
        <StatCard
          icon={Building2}
          tone="total"
          value={loading ? '-' : activeCases.length}
          label="Active Department Cases"
        />
        <StatCard
          icon={Clock}
          tone="review"
          value={loading ? '-' : countPending()}
          label="Pending Triage & Assign"
        />
        <StatCard
          icon={AlertCircle}
          tone="progress"
          value={loading ? '-' : countActiveStatus('In Progress')}
          label="Active In Progress"
        />
        <StatCard
          icon={CheckCircle2}
          tone="resolved"
          value={loading ? '-' : historyCases.length}
          label="Archived History Cases"
        />
      </div>

      {/* Department Command Navigation Tabs */}
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
          <ListFilter size={15} /> Active Cases ({activeCases.length})
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
          <Users size={15} /> Officer Workload Roster
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
          <BarChart3 size={15} /> SLA Analytics
        </button>
      </div>

      {/* Tab 1: Active Cases Queue OR Tab 3: History */}
      {(activeTab === 'cases' || activeTab === 'history') && (
        <div className="card">
          <div className="filter-bar">
            {activeTab === 'cases' ? (
              <div className="filter-pills">
                {['All', 'Pending', 'In Progress', 'Awaiting Verification'].map((tab) => (
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
                Historical archive of all verified closed resolutions and rejected cases.
              </div>
            )}

            <div className="search-wrap">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, officer, issue..."
                className="input"
                style={{ padding: '8px 12px', minWidth: '240px' }}
              />
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <p className="muted">Loading grievances...</p>
            </div>
          ) : shown.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px', textAlign: 'center' }}>
              <p className="muted">
                {activeTab === 'cases'
                  ? 'No active grievances found in this queue.'
                  : 'No archived history records found.'}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Grievance ID</th>
                    <th>Issue & Location</th>
                    <th>Citizen</th>
                    <th>Assigned Officer</th>
                    <th>Priority</th>
                    <th>Filed Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((g) => (
                    <tr key={g.id || g.grievanceId}>
                      <td>
                        <strong>{g.complaintId || g.id}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{g.subject || g.title}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          📍 {g.location?.address || g.location || 'Ward'}
                        </div>
                      </td>
                      <td>{g.citizenName || 'Citizen'}</td>
                      <td>
                        {g.assignedOfficerName ? (
                          <span style={{ fontWeight: 600, color: '#0f766e' }}>
                            👤 {g.assignedOfficerName}
                          </span>
                        ) : (
                          <span style={{ color: '#d97706', fontSize: '12px', fontWeight: 600 }}>
                            ⚠️ Unassigned
                          </span>
                        )}
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
                      <td>
                        <StatusBadge status={g.status} />
                      </td>
                      <td>
                        <Link
                          to={`/admin/grievance/${g.id || g.complaintId}`}
                          className="btn btn-outline"
                          style={{ fontSize: '12px', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Eye size={13} />
                          {activeTab === 'cases' ? 'Triage & Manage' : 'View Record'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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

export default DepartmentDashboard;
