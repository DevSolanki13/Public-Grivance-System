import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import PageLayout from '../../components/layout/PageLayout';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import SLABadge from '../../components/common/SLABadge';
import AssignModal from '../../components/grievance/AssignModal';
import api from '../../api/index.js';
import { Building2, Users, AlertTriangle, CheckCircle2, UserPlus } from 'lucide-react';

export default function DepartmentDashboard() {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAssignGrievance, setActiveAssignGrievance] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState('All');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = selectedDeptId !== 'All' ? { departmentId: selectedDeptId } : {};
      const [gRes, oRes] = await Promise.all([
        api.getGrievances(params),
        api.getOfficers(selectedDeptId !== 'All' ? { departmentId: selectedDeptId } : {}),
      ]);
      if (gRes.success) setGrievances(gRes.grievances || []);
      if (oRes.success) setOfficers(oRes.officers || []);
    } catch (err) {
      console.warn('Dept dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDeptId, user?.departmentId]);

  const unassigned = grievances.filter((g) => !g.assignedOfficerId);
  const activeCases = grievances.filter((g) => !['CLOSED', 'REJECTED'].includes(g.status));
  const overdueCases = activeCases.filter((g) => g.slaInfo?.isOverdue);
  const reopenedCases = grievances.filter((g) => g.status === 'REOPENED');

  return (
    <PageLayout
      role="department_head"
      title={`Department Redressal: ${user?.departmentName || 'Department'}`}
      subtitle={`Department Head: ${user?.name || 'Administrator'} • Real-time field supervision and officer assignment`}
      action={
        <Link to="/department/workload" className="btn btn-light">
          <Users size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Officer Workload
        </Link>
      }
    >
      <div className="stats-grid">
        <StatCard
          icon={Building2}
          tone="total"
          value={loading ? '-' : grievances.length}
          label="Total Department Cases"
        />
        <StatCard
          icon={UserPlus}
          tone="review"
          value={loading ? '-' : unassigned.length}
          label="Unassigned Complaints"
        />
        <StatCard
          icon={AlertTriangle}
          tone="overdue"
          value={loading ? '-' : overdueCases.length}
          label="SLA Breaches"
        />
        <StatCard
          icon={CheckCircle2}
          tone="resolved"
          value={loading ? '-' : grievances.filter((g) => g.status === 'CLOSED').length}
          label="Completed & Verified"
        />
      </div>

      {/* Escalated / Reopened Alert */}
      {reopenedCases.length > 0 && (
        <div
          style={{
            background: '#fff1f2',
            border: '1.5px solid #fecdd3',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <h4 style={{ color: '#be123c', fontWeight: 800, fontSize: 15, margin: '0 0 4px' }}>
            🚨 {reopenedCases.length} Grievance(s) Escalated by Citizens
          </h4>
          <p style={{ color: '#9f1239', fontSize: 13, margin: 0 }}>
            Citizens rejected the field officer resolution reports because issues returned or were incomplete. Immediate re-inspection required.
          </p>
        </div>
      )}

      {/* Department Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Department Queue:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'All', name: 'All Departments' },
                { id: 'dept-roads', name: 'Roads & Infra' },
                { id: 'dept-sanitation', name: 'Sanitation' },
                { id: 'dept-water', name: 'Water Supply' },
                { id: 'dept-electrical', name: 'Electricity' },
              ].map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`chip-btn ${selectedDeptId === d.id ? 'active' : ''}`}
                  onClick={() => setSelectedDeptId(d.id)}
                  style={{ fontSize: 12, padding: '5px 12px' }}
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)' }}>
            Showing: {selectedDeptId === 'All' ? 'All Municipal Departments' : selectedDeptId}
          </span>
        </div>
      </div>

      {/* Unassigned Grievance Queue */}
      <div className="section-head" style={{ marginTop: 24 }}>
        <div>
          <h2>Pending Officer Assignment Queue</h2>
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>
            Incoming citizen complaints requiring field engineer dispatch ({unassigned.length} waiting)
          </p>
        </div>
      </div>

      {unassigned.length === 0 ? (
        <div className="card" style={{ marginBottom: 24, padding: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--green)', fontWeight: 700, margin: 0 }}>
            ✓ All incoming department grievances have been assigned to officers.
          </p>
        </div>
      ) : (
        <div className="table-wrap card" style={{ padding: 0, marginBottom: 28 }}>
          <table>
            <thead>
              <tr>
                <th>Complaint ID</th>
                <th>Subject</th>
                <th>Locality</th>
                <th>Priority</th>
                <th>SLA Deadline</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {unassigned.map((g) => (
                <tr key={g.id}>
                  <td>
                    <Link to={`/citizen/grievance/${g.id}`} className="link">
                      {g.complaintId}
                    </Link>
                  </td>
                  <td>{g.subject}</td>
                  <td>{g.location?.area || g.location?.address || 'Ward Area'}</td>
                  <td><PriorityBadge priority={g.priority} /></td>
                  <td><SLABadge slaInfo={g.slaInfo} /></td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveAssignGrievance(g)}
                    >
                      <UserPlus size={13} /> Assign Officer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All Department Cases Table */}
      <div className="section-head" style={{ marginTop: 28 }}>
        <h2>All Department Cases & Live Status</h2>
      </div>

      <div className="table-wrap card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Complaint ID</th>
              <th>Subject</th>
              <th>Assigned Officer</th>
              <th>Priority</th>
              <th>SLA Status</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {grievances.map((g) => (
              <tr key={g.id}>
                <td>
                  <Link to={`/citizen/grievance/${g.id}`} className="link">
                    {g.complaintId}
                  </Link>
                </td>
                <td>{g.subject}</td>
                <td>
                  {g.assignedOfficerName ? (
                    <strong>{g.assignedOfficerName}</strong>
                  ) : (
                    <span style={{ color: '#ea580c', fontWeight: 600 }}>Unassigned</span>
                  )}
                </td>
                <td><PriorityBadge priority={g.priority} /></td>
                <td><SLABadge slaInfo={g.slaInfo} /></td>
                <td><StatusBadge status={g.status} /></td>
                <td>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
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
