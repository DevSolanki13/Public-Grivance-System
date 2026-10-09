import { Link } from 'react-router-dom';
import {
  ClipboardList,
  Eye,
  Wrench,
  Check,
  AlertTriangle,
  ArrowRight,
  History
} from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatCard from '../../components/StatCard';
import StatusStepper from '../../components/StatusStepper';
import { useAuth } from '../../components/ProtectedRoute';
import { useGrievances } from '../../hooks/useGrievances';
import { formatDate } from '../../utils/dateUtils';

function CitizenDashboard() {
  const { user, profile } = useAuth();
  const { grievances, loading, error } = useGrievances({ citizenId: user?.id, enabled: Boolean(user?.id) });

  // Closed and Rejected grievances are excluded from dashboard active queues
  const activeGrievances = grievances.filter(
    (g) => g.status !== 'Closed' && g.status !== 'Rejected'
  );

  const historyGrievances = grievances.filter(
    (g) => g.status === 'Closed' || g.status === 'Rejected'
  );

  const pendingApproval = activeGrievances.filter(
    (g) => g.status === 'Resolved'
  );

  const countActiveStatus = (status) => activeGrievances.filter((g) => g.status === status).length;
  const show = (n) => (loading ? '-' : n);

  return (
    <PageLayout
      role="citizen"
      title={`Welcome, ${profile?.name?.split(' ')[0] || ''}`}
      subtitle="Track your active civic requests. Closed and rejected cases are archived in History."
      action={
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link
            to="/citizen/my-grievances?tab=history"
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <History size={16} /> Grievance History ({historyGrievances.length})
          </Link>
          <Link to="/citizen/submit" className="btn btn-light">File a complaint</Link>
        </div>
      }
    >
      {error && <p className="error-msg">{error}</p>}

      {/* Prominent Citizen Verification Alert Banner */}
      {pendingApproval.length > 0 && (
        <div
          style={{
            background: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '18px 22px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.16)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={24} color="#d97706" />
            </div>
            <div>
              <strong style={{ fontSize: '16px', color: '#92400e', display: 'block' }}>
                Action Required: Field Officer Completed Work on {pendingApproval.length} Grievance(s)
              </strong>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#78350f', lineHeight: 1.4 }}>
                Case <strong>{pendingApproval[0].complaintId}</strong> ("{pendingApproval[0].subject}") has resolution proof attached. Please inspect and approve or reopen.
              </p>
            </div>
          </div>
          <Link
            to={`/citizen/grievance/${pendingApproval[0].id}`}
            className="btn btn-primary"
            style={{
              background: '#0f2f5e',
              borderColor: '#0f2f5e',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 20px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}
          >
            Inspect & Verify Work <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* Synchronized Active Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={ClipboardList} tone="total" value={show(activeGrievances.length)} label="Active Complaints" />
        <StatCard icon={Eye} tone="review" value={show(countActiveStatus('Under Review') + countActiveStatus('Submitted'))} label="Pending Triage" />
        <StatCard icon={Wrench} tone="progress" value={show(countActiveStatus('In Progress'))} label="In Progress" />
        <StatCard icon={Check} tone="resolved" value={show(pendingApproval.length)} label="Needs Verification" />
      </div>

      {/* Active Requests List Section */}
      <div className="section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>My active requests ({activeGrievances.length})</h2>
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
          <Link to="/citizen/my-grievances" className="link">View all active</Link>
          <span style={{ color: '#cbd5e1' }}>|</span>
          <Link
            to="/citizen/my-grievances?tab=history"
            className="link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <History size={14} /> History ({historyGrievances.length})
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="card"><p className="muted">Loading your grievances...</p></div>
      ) : activeGrievances.length === 0 ? (
        <div className="card" style={{ padding: '36px 20px', textAlign: 'center' }}>
          <p style={{ color: '#475569', fontSize: '15px', fontWeight: 600 }}>You have no pending active requests.</p>
          <p className="muted" style={{ fontSize: '13px', margin: '6px 0 16px' }}>
            All past complaints have either been resolved & closed or archived in history.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link to="/citizen/submit" className="btn btn-primary">File a new complaint</Link>
            {historyGrievances.length > 0 && (
              <Link to="/citizen/my-grievances?tab=history" className="btn btn-outline">
                View Grievance History ({historyGrievances.length})
              </Link>
            )}
          </div>
        </div>
      ) : (
        activeGrievances.map((g) => {
          const needsVerification = g.status === 'Resolved';

          return (
            <div
              className="card active-card"
              key={g.id}
              style={{
                marginBottom: '14px',
                border: needsVerification ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                background: needsVerification ? '#fffdfa' : '#ffffff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px' }}>
                    <Link to={`/citizen/grievance/${g.id}`} className="link">{g.complaintId}</Link> | {g.subject}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                    <span>Category: <strong>{g.category}</strong></span>
                    <span>&bull;</span>
                    <span>Location: {g.location}</span>
                    <span>&bull;</span>
                    <span>Filed: {formatDate(g.createdAt)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {needsVerification && (
                    <Link
                      to={`/citizen/grievance/${g.id}`}
                      style={{
                        background: '#0f2f5e',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 700,
                        padding: '4px 12px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🔍 Verify Work
                    </Link>
                  )}
                  <Link to={`/citizen/grievance/${g.id}`} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    Details
                  </Link>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <StatusStepper status={g.status} />
              </div>
            </div>
          );
        })
      )}
    </PageLayout>
  );
}

export default CitizenDashboard;
