import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, History, CheckCircle2, XCircle, Star } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../components/ProtectedRoute';
import { grievanceService } from '../../services/grievanceService';
import { formatDate } from '../../utils/dateUtils';

function MyGrievances() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'history' ? 'history' : 'active';
  const [mainTab, setMainTab] = useState(initialTab); // 'active' | 'history'
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const list = await grievanceService.getGrievances({ user, role: 'citizen' });
        setGrievances(list);
      } catch (err) {
        console.error(err);
        setError('Failed to load your grievances.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.uid) {
      load();
    }
  }, [user?.uid]);

  const activeCases = grievances.filter((g) => g.status !== 'Closed' && g.status !== 'Rejected');
  const historyCases = grievances.filter((g) => g.status === 'Closed' || g.status === 'Rejected');

  const pendingApproval = activeCases.filter(
    (g) => Boolean(g.resolutionImageUrl) && g.status !== 'Closed'
  );

  const displayedList = (mainTab === 'active' ? activeCases : historyCases).filter((g) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      (g.complaintId || '').toLowerCase().includes(q) ||
      (g.subject || '').toLowerCase().includes(q) ||
      (g.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <PageLayout
      role="citizen"
      title="My grievances"
      subtitle="Track active requests and inspect your historical closed and resolved archives."
      action={<Link to="/citizen/submit" className="btn btn-light">Submit new grievance</Link>}
    >
      {error && <p className="error-msg">{error}</p>}

      {/* Prominent Verification Alert if any cases are ready */}
      {pendingApproval.length > 0 && mainTab === 'active' && (
        <div
          style={{
            background: '#fffbeb',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.12)',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="#d97706" />
            <div>
              <strong style={{ fontSize: '15px', color: '#92400e' }}>
                {pendingApproval.length} Grievance(s) Awaiting Your Verification
              </strong>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#78350f' }}>
                The field officer has completed work and uploaded resolution photos. Please inspect to approve or reopen.
              </p>
            </div>
          </div>
          <Link
            to={`/citizen/grievance/${pendingApproval[0].id || pendingApproval[0].complaintId}`}
            className="btn btn-primary"
            style={{
              background: '#0f766e',
              borderColor: '#0f766e',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700
            }}
          >
            Inspect & Verify Now <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Primary Tab Switcher: Active vs Grievance History */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
        <button
          type="button"
          onClick={() => {
            setMainTab('active');
            setSearchParams({});
          }}
          style={{
            background: mainTab === 'active' ? '#0f766e' : '#f8fafc',
            color: mainTab === 'active' ? '#ffffff' : '#475569',
            border: '1px solid ' + (mainTab === 'active' ? '#0f766e' : '#cbd5e1'),
            padding: '8px 18px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          Active Complaints ({activeCases.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setMainTab('history');
            setSearchParams({ tab: 'history' });
          }}
          style={{
            background: mainTab === 'history' ? '#0f766e' : '#f8fafc',
            color: mainTab === 'history' ? '#ffffff' : '#475569',
            border: '1px solid ' + (mainTab === 'history' ? '#0f766e' : '#cbd5e1'),
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
          <History size={16} /> Grievance History ({historyCases.length})
        </button>
      </div>

      <div className="form-group" style={{ maxWidth: 320, marginBottom: '16px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by complaint ID or subject..."
          aria-label="Search complaints"
        />
      </div>

      {loading ? (
        <div className="card"><p className="muted">Loading complaints...</p></div>
      ) : displayedList.length === 0 ? (
        <div className="card" style={{ padding: '30px 20px', textAlign: 'center' }}>
          <p style={{ color: '#475569', fontSize: '15px' }}>
            {mainTab === 'active' ? 'You have no active complaints.' : 'No closed or rejected history records found.'}
          </p>
        </div>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Filed Date</th>
                <th>Status</th>
                <th>{mainTab === 'active' ? 'Action / Inspection' : 'Resolution Outcome'}</th>
              </tr>
            </thead>
            <tbody>
              {displayedList.map((g) => {
                const needsVerify = Boolean(g.resolutionImageUrl) && g.status !== 'Closed';
                return (
                  <tr key={g.id}>
                    <td>
                      <Link to={`/citizen/grievance/${g.id}`} className="link">
                        <strong>{g.complaintId}</strong>
                      </Link>
                    </td>
                    <td>{g.subject}</td>
                    <td>{g.category}</td>
                    <td>{formatDate(g.createdAt)}</td>
                    <td>
                      <StatusBadge status={g.status} />
                    </td>
                    <td>
                      {mainTab === 'active' ? (
                        needsVerify ? (
                          <Link
                            to={`/citizen/grievance/${g.id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: '#0f766e',
                              color: '#ffffff',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              textDecoration: 'none'
                            }}
                          >
                            🔍 Inspect & Approve
                          </Link>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>In Triage / Work</span>
                        )
                      ) : g.status === 'Closed' ? (
                        <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>
                          <span>✓ Verified & Closed ({formatDate(g.closedAt || g.resolvedAt)})</span>
                          {g.rating && (
                            <span style={{ color: '#ca8a04', marginLeft: '6px' }}>
                              ★ {g.rating}/5
                            </span>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
                          <span>✕ Rejected ({formatDate(g.rejectedAt || g.createdAt)})</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageLayout>
  );
}

export default MyGrievances;
