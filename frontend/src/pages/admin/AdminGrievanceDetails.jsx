import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { UserCheck, XCircle, CheckCircle, ShieldAlert, ArrowLeft, AlertTriangle } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import { DEPARTMENTS, CATEGORY_DEPARTMENT_MAP, PRIORITIES } from '../../data/reference';
import { useAuth, ROLE_HOME } from '../../context/AuthContext';
import { grievanceService } from '../../services/grievanceService';
import { friendlyError } from '../../lib/supabase';
import { useGrievance } from '../../hooks/useGrievances';
import { formatDateTime } from '../../utils/dateUtils';
import { isActive } from '../../utils/analytics';

const PRIORITY_HINTS = {
  Low: 'Low (Routine maintenance - 7 days)',
  Medium: 'Medium (Standard civic issue - 72 hrs)',
  High: 'High (Urgent hazard - 48 hrs)',
  Critical: 'Critical (Immediate safety risk - 24 hrs)',
};

function AdminGrievanceDetails() {
  const { id } = useParams();
  const { role, profile } = useAuth();
  const { grievance: g, loading, error: loadError, reload } = useGrievance(id);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form overrides; null means "use the value from the loaded grievance".
  const [departmentChoice, setDepartmentChoice] = useState(null);
  const [officerChoice, setOfficerChoice] = useState(null);
  const [priorityChoice, setPriorityChoice] = useState(null);
  const [remark, setRemark] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [officers, setOfficers] = useState([]);
  const [workload, setWorkload] = useState({});

  const isDeptHead = role === 'department_head';
  const department = departmentChoice
    ?? (isDeptHead ? profile?.department : null)
    ?? g?.department
    ?? CATEGORY_DEPARTMENT_MAP[g?.category]
    ?? DEPARTMENTS[0];
  const assignedOfficerId = officerChoice ?? (g?.department === department ? g?.assignedOfficerId : '') ?? '';
  const priority = priorityChoice ?? g?.priority ?? 'Medium';

  // Officers of the selected department, with their current active case load.
  useEffect(() => {
    let cancelled = false;
    Promise.all([grievanceService.getOfficers({ department }), grievanceService.getGrievances()])
      .then(([list, all]) => {
        if (cancelled) return;
        setOfficers(list);
        const counts = {};
        all.filter(isActive).forEach((x) => {
          if (x.assignedOfficerId) counts[x.assignedOfficerId] = (counts[x.assignedOfficerId] || 0) + 1;
        });
        setWorkload(counts);
      })
      .catch((err) => !cancelled && setError(`Could not load officers: ${friendlyError(err)}`));
    return () => {
      cancelled = true;
    };
  }, [department]);

  const officerOptions = useMemo(() => officers.filter((o) => o.department === department), [officers, department]);

  // Assign (or re-assign) a field officer; moves the case to In Progress.
  const handleAssignOfficer = async (e) => {
    e.preventDefault();
    if (!assignedOfficerId) {
      setError('Please select an officer to assign to this grievance.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const updated = await grievanceService.assignGrievance(g.id, {
        department,
        officerId: assignedOfficerId,
        priority,
        remark: remark.trim(),
      });
      setSuccessMsg(`Grievance assigned to Officer ${updated.assignedOfficerName}. Work is now in progress.`);
      setOfficerChoice(null);
      setDepartmentChoice(null);
      setPriorityChoice(null);
      setRemark('');
      reload();
    } catch (err) {
      console.error(err);
      setError(`Failed to assign officer: ${friendlyError(err)}`);
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
      await grievanceService.rejectGrievance(g.id, rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason('');
      setSuccessMsg('Grievance has been formally rejected with stated justification.');
      reload();
    } catch (err) {
      console.error(err);
      setError(`Failed to reject grievance: ${friendlyError(err)}`);
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

  const backLink = ROLE_HOME[role] || '/admin/dashboard';

  if (!g) {
    return (
      <PageLayout role={role} title="Grievance not found" width="wide">
        <div className="card text-center" style={{ padding: 40 }}>
          <p className="error-msg">{loadError || 'Grievance not found'}</p>
          <Link to={backLink} className="btn btn-outline" style={{ marginTop: 12 }}>
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
        </div>
      </PageLayout>
    );
  }

  const isSubmittedState = g.status === 'Submitted' || g.status === 'Under Review';
  const isRejectedState = g.status === 'Rejected';
  const isResolvedState = g.status === 'Resolved' || g.status === 'Closed';
  // Admins and the owning department head can (re)assign while work is open.
  const canManage = role === 'admin' || (isDeptHead && g.department === profile?.department);
  const canAssign = canManage && ['Submitted', 'Under Review', 'In Progress', 'Reopened'].includes(g.status);
  const canReject = canManage && isSubmittedState;

  return (
    <PageLayout
      role={role === 'department_head' ? 'department_head' : 'admin'}
      title={`${g.complaintId} — Triage & Review`}
      subtitle={`Submitted by ${g.citizenName} • Category: ${g.category}`}
      action={
        <Link to={backLink} className="btn btn-light" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to All Grievances
        </Link>
      }
    >
      {error && <p className="error-msg" role="alert">{error}</p>}
      {successMsg && <p className="saved-msg" role="status">{successMsg}</p>}

      <div className="two-col wide-left">

        {/* Left Column: Complaint Details & Citizen Problem Photo ("Before") */}
        <div className="col-stack">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Grievance Dossier</h2>
              <StatusBadge status={g.status} />
            </div>

            <div className="detail-row"><p className="k">Subject</p><p style={{ fontWeight: 700 }}>{g.subject}</p></div>
            <div className="detail-row"><p className="k">Description</p><p>{g.description}</p></div>
            <div className="detail-row"><p className="k">Location</p><p>📍 {g.location}</p></div>
            <div className="detail-row"><p className="k">Department</p><p>{g.department || '—'}</p></div>
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
            <div className="card" style={{ border: '2px solid var(--green)', background: '#f3f6fb' }}>
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
        <div className="col-stack">
          
          {/* Action Box: Triage & Assignment */}
          <div className="card">
            <h3 style={{ fontSize: '1.15rem', marginBottom: 14 }}>
              {isSubmittedState ? 'Triage Decision: Assign Officer or Reject' : 'Department Assignment & Officer Status'}
            </h3>

            {canAssign && !isSubmittedState && (
              <div style={{ background: '#effaf4', padding: 14, borderRadius: 8, borderLeft: '4px solid var(--green)', marginBottom: 16 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#14603c' }}>
                  Currently assigned to: {g.assignedOfficerName || '—'}
                </p>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                  Department: {g.department} • Priority: {g.priority}. You can re-assign below.
                </p>
              </div>
            )}

            {canAssign ? (
              <form onSubmit={handleAssignOfficer}>
                {isSubmittedState && (
                <div style={{ background: '#eef3fa', padding: 12, borderRadius: 8, marginBottom: 16, borderLeft: '4px solid var(--accent)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--accent-dark)', fontWeight: 600, margin: 0 }}>
                    1. Review the citizen's photo and details on the left.<br />
                    2. Select the responsible department and officer to handle the repair.<br />
                    3. Or reject if invalid, duplicate, or out of jurisdiction.
                  </p>
                </div>
                )}

                <div className="form-group">
                  <label htmlFor="dept-select">Department *</label>
                  <select
                    id="dept-select"
                    value={department}
                    disabled={isDeptHead}
                    onChange={(e) => {
                      setDepartmentChoice(e.target.value);
                      setOfficerChoice('');
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
                    onChange={(e) => setOfficerChoice(e.target.value)}
                    required
                  >
                    <option value="">-- Choose an Officer to Investigate --</option>
                    {officerOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.designation || 'Field Officer'} • {workload[o.id] || 0} active {workload[o.id] === 1 ? 'case' : 'cases'})
                      </option>
                    ))}
                  </select>
                  {officerOptions.length === 0 && (
                    <p className="hint">No active field officers in this department yet.</p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="priority-select">Severity & Priority</label>
                  <select
                    id="priority-select"
                    value={priority}
                    onChange={(e) => setPriorityChoice(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{PRIORITY_HINTS[p]}</option>
                    ))}
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
                    {saving ? 'Assigning Officer...' : isSubmittedState ? 'Assign Officer & Start Field Work' : 'Re-assign Officer'}
                  </button>

                  {canReject && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowRejectModal(true)}
                    style={{ borderColor: '#e53e3e', color: '#c53030' }}
                  >
                    <XCircle size={16} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                    Reject Grievance Case
                  </button>
                  )}
                </div>
              </form>
            ) : isRejectedState ? (
              <div style={{ background: '#fadcd8', padding: 16, borderRadius: 8, color: '#922b21' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: 6 }}>
                  <ShieldAlert size={20} /> Case Formally Rejected
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{g.rejectionReason || g.adminRemark}</p>
              </div>
            ) : (
              <div style={{ background: '#effaf4', padding: 14, borderRadius: 8, borderLeft: '4px solid var(--green)' }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#14603c' }}>
                  Assigned to: {g.assignedOfficerName || 'Not assigned'}
                </p>
                <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                  Department: {g.department || '—'} • Priority: {g.priority}
                  {g.status === 'Resolved' && ' • Awaiting citizen verification'}
                  {g.status === 'Closed' && g.rating != null && ` • Citizen rating ${g.rating}/5`}
                </p>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: 12 }}>Case Progress Timeline</h3>
<Timeline steps={g.timeline} />
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
                minLength={5}
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
