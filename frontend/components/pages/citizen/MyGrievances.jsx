import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import StatusBadge from '../../components/common/StatusBadge';
import VerificationModal from '../../components/grievance/VerificationModal';
import api from '../../../api/index.js';

const FILTERS = ['All', 'Submitted', 'Under Review', 'In Progress', 'Resolved'];

export default function MyGrievances() {
  const [searchParams] = useSearchParams();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeVerifyGrievance, setActiveVerifyGrievance] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getGrievances();
      if (res.success) {
        setGrievances(res.grievances || []);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load grievances.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const matchesFilter = (g, f) => {
    if (f === 'All') return true;
    const s = (g.status || '').toUpperCase().replace(/\s+/g, '_');
    if (f === 'Submitted') return s === 'SUBMITTED';
    if (f === 'Under Review') return s === 'UNDER_REVIEW' || s === 'ASSIGNED';
    if (f === 'In Progress') return s === 'IN_PROGRESS' || s === 'REOPENED' || s === 'AWAITING_VERIFICATION' || s === 'RESOLUTION_SUBMITTED';
    if (f === 'Resolved') return s === 'CLOSED' || s === 'RESOLVED';
    return false;
  };

  const shown = grievances
    .filter((g) => matchesFilter(g, filter))
    .filter((g) => !search || g.complaintId.toLowerCase().includes(search.trim().toLowerCase()) || g.subject.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <PageLayout
      role="citizen"
      title="My grievances"
      subtitle="Select a complaint ID to see its full status."
      action={<Link to="/citizen/submit" className="btn btn-light">Submit new grievance</Link>}
    >
      {error && <p className="error-msg">{error}</p>}

      <div className="form-group" style={{ maxWidth: 320 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by complaint ID"
          aria-label="Search by complaint ID"
        />
      </div>

      <div className="chips">
        {FILTERS.map((f) => (
          <button
            key={f}
            className={'chip ' + (filter === f ? 'on' : '')}
            onClick={() => setFilter(f)}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card"><p className="muted">Loading your grievances...</p></div>
      ) : shown.length === 0 ? (
        <div className="card">
          <p>{grievances.length === 0 ? 'You have not submitted any grievances yet.' : 'No grievances match this search or filter.'}</p>
        </div>
      ) : (
        <div className="table-wrap card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Subject</th>
                <th>Category</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((g) => {
                const isAwaiting = ['AWAITING_VERIFICATION', 'RESOLUTION_SUBMITTED'].includes((g.status || '').toUpperCase().replace(/\s+/g, '_'));
                return (
                  <tr key={g.id}>
                    <td>
                      <Link to={`/citizen/grievance/${g.id}`} className="link">
                        {g.complaintId}
                      </Link>
                    </td>
                    <td>{g.subject}</td>
                    <td>{g.category}</td>
                    <td>{formatDate(g.createdAt)}</td>
                    <td><StatusBadge status={g.status} /></td>
                    <td>
                      {isAwaiting ? (
                        <button
                          type="button"
                          className="btn btn-primary"
                          style={{ fontSize: 12, padding: '4px 10px', background: '#ea580c', borderColor: '#ea580c' }}
                          onClick={() => setActiveVerifyGrievance(g)}
                        >
                          Verify
                        </button>
                      ) : (
                        <Link to={`/citizen/grievance/${g.id}`} className="link" style={{ fontSize: 13 }}>
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Verification Modal */}
      {activeVerifyGrievance && (
        <VerificationModal
          grievance={activeVerifyGrievance}
          isOpen={!!activeVerifyGrievance}
          onClose={() => setActiveVerifyGrievance(null)}
          onVerified={() => load()}
        />
      )}
    </PageLayout>
  );
}
