import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { UserCheck, XCircle, CheckCircle, ShieldAlert, ArrowLeft, Clock, Eye, AlertTriangle } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import { STEPS, DEPARTMENTS, OFFICERS, CATEGORY_DEPARTMENT_MAP } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { grievanceService } from '../../services/grievanceService';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

function AdminGrievanceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role, profile } = useAuth();

  const [g, setG] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for assignment / update
  const [department, setDepartment] = useState('');
  const [assignedOfficerId, setAssignedOfficerId] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Submitted');
  const [remark, setRemark] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await grievanceService.getGrievanceById(id, user);
        if (data) {
          setG(data);
          const defaultDept = data.department || CATEGORY_DEPARTMENT_MAP[data.category] || DEPARTMENTS[0];
          setDepartment(defaultDept);
          setAssignedOfficerId(data.assignedOfficerId || '');
          setPriority(data.priority || 'Medium');
          setStatus(data.status || 'Submitted');
          setRemark(data.adminRemark || '');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load grievance details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      load();
    }
  }, [id, user]);

  // Filter officers matching selected department
  const availableOfficers = OFFICERS.filter((o) =>
    !department || o.department.toLowerCase().includes(department.split(' ')[0].toLowerCase())
  );

  // Accept & Assign Officer (Moves to In Progress / Assigned)
  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    if (!assignedOfficerId) {
      setError('Please select an officer to assign to this grievance.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    const officerObj = OFFICERS.find((o) => o.id === assignedOfficerId) || { name: 'Field Officer' };

    try {
      const updates = {
        department,
        assignedOfficerId,
        assignedOfficerName: officerObj.name,
        priority,
        status: 'In Progress',
        adminRemark: remark.trim() || `Assigned to ${officerObj.name} for on-site inspection and repair.`,
      };

      await grievanceService.updateGrievance(id, updates, user);
      setG((prev) => ({ ...prev, ...updates }));
      setStatus('In Progress');
      setSuccessMsg(`Grievance approved & assigned to Officer ${officerObj.name}! Work is now in progress.`);
    } catch (err) {
      console.error(err);
      setError('Failed to assign officer.');
    } finally {
      setSaving(false);
    }
  };

  // Reject Grievance
  const handleRejectCase = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a mandatory reason for rejecting this grievance.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const updates = {
        status: 'Rejected',
        adminRemark: `REJECTED: ${rejectReason.trim()}`,
      };

      await grievanceService.updateGrievance(id, updates, user);
      setG((prev) => ({ ...prev, ...updates }));
      setStatus('Rejected');
      setShowRejectModal(false);
      setSuccessMsg('Grievance has been formally rejected with stated justification.');
    } catch (err) {
      console.error(err);
      setError('Failed to reject grievance.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout role={role} title="Loading..." width="wide">
        <div className="card text-center" style={{ padding: 40 }}>
          <p className="muted">Fetching grievance record and evidence...</p>
        </div>
      </PageLayout>
    );
  }

  if (error && !g) {
    return (
      <PageLayout role={role} title="Grievance not found" width="wide">
        <div className="card text-center" style={{ padding: 40 }}>
          <p className="error-msg">{error || 'Grievance not found'}</p>
          <Link to="/admin/dashboard" className="btn btn-outline" style={{ marginTop: 12 }}>
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
        </div>
      </PageLayout>
    );
  }

  const isSubmittedState = g.status === 'Submitted';
  const isRejectedState = g.status === 'Rejected';
  const isResolvedState = g.status === 'Resolved' || g.status === 'Closed';

  return (
    <PageLayout
      role={role === 'department_head' ? 'department_head' : 'admin'}
      title={`${g.complaintId} — Triage & Review`}
      subtitle={`Submitted by ${g.citizenName} &bull; Category: ${g.category}`}
      action={
        <Link to="/admin/dashboard" className="btn btn-light" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to All Grievances
        </Link>
      }
    >
      {error && <p className="error-msg">{error}</p>}
      {successMsg && <p className="saved-msg">{successMsg}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* Left Column: Complaint Details & Citizen Problem Photo ("Before") */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Grievance Dossier</h2>
              <StatusBadge status={g.status} />
            </div>

            <div className="detail-row"><p className="k">Subject</p><p style={{ fontWeight: 700 }}>{g.subject}</p></div>
            <div className="detail-row"><p className="k">Description</p><p>{g.description}</p></div>
            <div className="detail-row"><p className="k">Location</p><p>📍 {g.location}</p></div>
            <div className="detail-row"><p className="k">Citizen Contact</p><p>{g.citizenName} ({g.citizenEmail})</p></div>
            <div className="detail-row"><p className="k">Priority</p>
              <span className={`priority-badge priority-${(g.priority || 'medium').toLowerCase()}`}>
                {g.priority || 'Medium'}
              </span>
            </div>
            <div className="detail-row"><p className="k">Filed Date</p><p>{formatDateTime(g.createdAt)}</p></div>
            {g.resolvedAt && (
              <div className="detail-row"><p className="k">Resolved Date</p><p>{formatDateTime(g.resolvedAt)}</p></div>
            )}
            {g.assignedOfficerName && (
              <div className="detail-row">
                <p className="k">Assigned Officer</p>
                <p style={{ fontWeight: 700, color: 'var(--accent-dark)' }}>👮 {g.assignedOfficerName}</p>
              </div>
            )}
            {g.adminRemark && (
              <div className="detail-row">
                <p className="k">Authority Remark</p>
                <p style={{ fontStyle: 'italic', color: isRejectedState ? '#922b21' : 'var(--ink)' }}>{g.adminRemark}</p>
              </div>
            )}
          </div>

          {/* Citizen Photo Card (Problem to be Fixed / Replaced) */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📷 Issue Reported by Citizen (Problem Photo)</span>
            </h3>

            {g.imageUrl ? (
              <div>
                <a href={g.imageUrl} target="_blank" rel="noreferrer">
                  <img
                    src={g.imageUrl}
                    alt="Citizen Problem Evidence"
                    style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }}
                  />
                </a>
                <p className="hint" style={{ marginTop: 6 }}>Click photo to open full resolution.</p>
              </div>
            ) : (
              <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No problem photo provided with this complaint.</p>
            )}
          </div>

          {/* If Resolved: Also show the Officer's Resolution Proof Photo ("After") */}
          {isResolvedState && (
            <div className="card" style={{ border: '2px solid var(--green)', background: '#f5fcf8' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={20} /> Resolution Proof Uploaded by Officer
              </h3>

              {g.resolutionImageUrl ? (
                <div>
                  <a href={g.resolutionImageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={g.resolutionImageUrl}
                      alt="Officer Solved Proof"
                      style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #28a745' }}
                    />
                  </a>
                  <p style={{ marginTop: 8, fontWeight: 600, color: '#14603c' }}>
                    Officer Verification: Problem inspected, repaired, and verified on-site.
                  </p>
                </div>
              ) : (
                <p className="muted">No resolution photo attached.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Triage & Action Console */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Action Box: Triage & Assignment */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: 14 }}>
              {isSubmittedState ? 'Triage Decision: Assign Officer or Reject' : 'Department Assignment & Officer Status'}
            </h3>

            {isSubmittedState ? (
              <form onSubmit={handleAssignOfficer}>
                <div style={{ background: '#f0f9f6', padding: 12, borderRadius: 8, marginBottom: 16, borderLeft: '4px solid var(--accent)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent-dark)', fontWeight: 600, margin: 0 }}>
                    1. Review the citizen's photo and details on the left.<br />
                    2. Select the responsible department and officer to handle the repair.<br />
                    3. Or reject if invalid, duplicate, or out of jurisdiction.
                  </p>
                </div>

                <div className="form-group">
                  <label htmlFor="dept-select">Department *</label>
                  <select
                    id="dept-select"
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      setAssignedOfficerId('');
                    }}
                    required
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="officer-select">Assign Field Officer *</label>
                  <select
                    id="officer-select"
                    value={assignedOfficerId}
                    onChange={(e) => setAssignedOfficerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose an Officer to Investigate --</option>
                    {availableOfficers.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.role} &bull; {o.activeCases} active cases)
                      </option>
                    ))}
                    {availableOfficers.length === 0 && (
                      <option value="demo-officer-01">Rahul Sharma (Field Officer)</option>
                    )}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="priority-select">Severity & Priority</label>
                  <select
                    id="priority-select"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="Low">Low (Routine maintenance - 7 days)</option>
                    <option value="Medium">Medium (Standard civic issue - 72 hrs)</option>
                    <option value="High">High (Urgent hazard - 48 hrs)</option>
                    <option value="Critical">Critical (Immediate safety risk - 24 hrs)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="admin-remark">Dispatch Instructions / Remarks</label>
                  <textarea
                    id="admin-remark"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Instructions for the field officer (e.g. Inspect pothole depth, arrange cold mix bitumen)"
                    style={{ minHeight: 70 }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <UserCheck size={18} />
                    {saving ? 'Assigning Officer...' : 'Assign Officer & Start Field Work'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowRejectModal(true)}
                    style={{ borderColor: '#e53e3e', color: '#c53030' }}
                  >
                    <XCircle size={16} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                    Reject Grievance Case
                  </button>
                </div>
              </form>
            ) : isRejectedState ? (
              <div style={{ background: '#fadcd8', padding: 16, borderRadius: 8, color: '#922b21' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
                  <ShieldAlert size={20} /> Case Formally Rejected
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{g.adminRemark}</p>
              </div>
            ) : (
              <div>
                <div style={{ background: '#effaf4', padding: 14, borderRadius: 8, borderLeft: '4px solid var(--green)', marginBottom: 16 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: '#14603c' }}>
                    Assigned to: {g.assignedOfficerName || 'Rahul Sharma'}
                  </p>
                  <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                    Department: {g.department || department} &bull; Priority: {g.priority}
                  </p>
                </div>

                <div style={{ padding: '12px 0' }}>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6 }}>Quick Actions:</p>
                  <Link
                    to="/officer/dashboard"
                    className="btn btn-outline btn-block"
                    style={{ textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    <Eye size={16} /> Switch to Officer View to Solve & Upload Proof
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Case Progress Timeline</h3>
            <ul className="timeline">
              {g.timeline?.map((step, idx) => (
                <li key={idx}>
                  <span className="dot" style={{ background: 'var(--accent-dark)' }} />
                  <div>
                    <strong>{step.status}</strong>
                    <div className="muted" style={{ fontSize: '0.82rem' }}>{step.time || 'Recently'}</div>
                    {step.remark && <p style={{ fontSize: '0.84rem', marginTop: 2, fontStyle: 'italic' }}>{step.remark}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-backdrop">
          <div className="modal card" style={{ maxWidth: 440, textAlign: 'left' }}>
            <h2 style={{ color: '#922b21', display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={22} /> Reject Grievance
            </h2>
            <p className="muted" style={{ fontSize: '0.88rem', margin: '8px 0 16px' }}>
              You are about to reject this case. A clear reason must be given to the citizen.
            </p>

            <div className="form-group">
              <label htmlFor="reject-reason">Mandatory Rejection Reason *</label>
              <textarea
                id="reject-reason"
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Complaint falls under Private Housing Society jurisdiction; Duplicate complaint already registered as GRV-2026-00109."
                style={{ minHeight: 90 }}
              />
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: 16 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn"
                style={{ background: '#c53030', color: '#fff' }}
                onClick={handleRejectCase}
                disabled={saving}
              >
                {saving ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  );
}

export default AdminGrievanceDetails;
