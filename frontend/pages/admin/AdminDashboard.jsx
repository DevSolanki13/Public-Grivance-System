import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import AssignModal from '../../components/grievance/AssignModal';
import api from '../../api/index.js';
import { ClipboardList, Eye, Wrench, Check, MapPin, RefreshCw } from 'lucide-react';

const FILTERS = ['All', 'Pending', 'In Progress', 'Resolved'];

export default function AdminDashboard() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [activeAssignGrievance, setActiveAssignGrievance] = useState(null);
  const [resetting, setResetting] = useState(false);

  const loadData = async () => {
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
    loadData();
  }, []);

  const handleReset = async () => {
    if (!window.confirm('Reset all grievances back to default seed records?')) return;
    setResetting(true);
    try {
      await api.resetData();
      await loadData();
    } catch (err) {
      alert('Failed to reset data.');
    } finally {
      setResetting(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const isPending = (g) => {
    const s = (g.status || '').toUpperCase().replace(/\s+/g, '_');
    return s === 'SUBMITTED' || s === 'UNDER_REVIEW' || s === 'ASSIGNED';
  };

  const countPending = grievances.filter(isPending).length;
  const countInProgress = grievances.filter((g) => {
    const s = (g.status || '').toUpperCase().replace(/\s+/g, '_');
    return s === 'IN_PROGRESS' || s === 'REOPENED' || s === 'AWAITING_VERIFICATION' || s === 'RESOLUTION_SUBMITTED';
  }).length;
  const countResolved = grievances.filter((g) => {
    const s = (g.status || '').toUpperCase().replace(/\s+/g, '_');
    return s === 'CLOSED' || s === 'RESOLVED';
  }).length;

  const matchesFilter = (g, f) => {
    if (f === 'All') return true;
    if (f === 'Pending') return isPending(g);
    if (f === 'In Progress') {
      const s = (g.status || '').toUpperCase().replace(/\s+/g, '_');
      return s === 'IN_PROGRESS' || s === 'REOPENED' || s === 'AWAITING_VERIFICATION' || s === 'RESOLUTION_SUBMITTED';
    }
    if (f === 'Resolved') {
      const s = (g.status || '').toUpperCase().replace(/\s+/g, '_');
      return s === 'CLOSED' || s === 'RESOLVED';
    }
    return true;
  };

  const shown = grievances
    .filter((g) => matchesFilter(g, filter))
    .filter((g) => {
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        g.complaintId.toLowerCase().includes(q) ||
        (g.citizenName || '').toLowerCase().includes(q) ||
        g.subject.toLowerCase().includes(q) ||
        (g.department || '').toLowerCase().includes(q)
      );
    });

  return (
    <PageLayout
      role="admin"
      title="Admin dashboard"
      subtitle="All grievances across departments."
      action={
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/admin/map"
            className="btn btn-outline"
            style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)', color: '#fff', fontSize: 13 }}
          >
            <MapPin size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Complaint map
          </Link>
          <button
            type="button"
            className="btn btn-outline"
            style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)', color: '#fff', fontSize: 13 }}
            onClick={handleReset}
            disabled={resetting}
            title="Reset database to default sample records"
          >
            <RefreshCw size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {resetting ? 'Resetting...' : 'Reset demo data'}
          </button>
        </div>
      }
    >
      {error && <p className="error-msg">{error}</p>}

      <div className="stats-grid">
        <StatCard icon={ClipboardList} tone="total" value={loading ? '-' : grievances.length} label="Total" />
        <StatCard icon={Eye} tone="review" value={loading ? '-' : countPending} label="Pending" />
        <StatCard icon={Wrench} tone="progress" value={loading ? '-' : countInProgress} label="In progress" />
        <StatCard icon={Check} tone="resolved" value={loading ? '-' : countResolved} label="Resolved" />
      </div>

      <div className="section-head">
        <div className="chips" style={{ marginBottom: 0 }}>
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

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search complaint ID or citizen"
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
        <div className="card"><p className="muted">Loading grievances...</p></div>
      ) : shown.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <p style={{ margin: 0 }}>No grievances match this filter or search.</p>
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
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
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
                  <td>{g.citizenName || 'Citizen'}</td>
                  <td>{g.category}</td>
                  <td>{g.department || '—'}</td>
                  <td>{g.assignedOfficerName || <span style={{ color: '#ea580c' }}>Unassigned</span>}</td>
                  <td>{formatDate(g.createdAt)}</td>
                  <td><StatusBadge status={g.status} /></td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                      onClick={() => setActiveAssignGrievance(g)}
                    >
                      {g.assignedOfficerId ? 'Reassign' : 'Assign'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {activeAssignGrievance && (
        <AssignModal
          grievance={activeAssignGrievance}
          isOpen={!!activeAssignGrievance}
          onClose={() => setActiveAssignGrievance(null)}
          onAssigned={() => loadData()}
        />
      )}
    </PageLayout>
  );
}
