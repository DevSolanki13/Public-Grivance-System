import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Camera,
  XCircle,
  Star,
  AlertTriangle,
  ArrowLeft,
  UploadCloud,
  X,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatusStepper from '../../components/StatusStepper';
import Timeline from '../../components/Timeline';
import { useAuth } from '../../components/ProtectedRoute';
import { SAMPLE_REJECTION_PHOTOS } from '../../data/reference';
import { grievanceService } from '../../services/grievanceService';
import { friendlyError } from '../../lib/supabase';
import { useGrievance } from '../../hooks/useGrievances';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import { formatDateTime } from '../../utils/dateUtils';

const SHOW_SAMPLE_PHOTOS = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

function GrievanceDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { grievance: g, loading, error: loadError, reload } = useGrievance(id);
  const { uploading, uploadFromInput, uploadError } = usePhotoUpload(user?.id);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Citizen Decision UI state
  const [verificationMode, setVerificationMode] = useState(null); // 'approve' | 'reject' | null
  const [starRating, setStarRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionPhoto, setRejectionPhoto] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (e) => {
    const url = await uploadFromInput(e);
    if (url) {
      setRejectionPhoto(url);
      setError('');
    }
  };

  const handleSelectSampleRejection = (sample) => {
    setRejectionPhoto(sample.url);
    if (!rejectionReason) {
      setRejectionReason(sample.reason);
    }
    setError('');
  };

  // Citizen Approves & Closes Complaint
  const handleApproveResolution = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await grievanceService.approveResolution(g.id, { rating: starRating, comment: feedbackComment.trim() });
      setVerificationMode(null);
      setSuccessMsg('Thank you! You have confirmed the resolution. The case is now officially Closed.');
      reload();
    } catch (err) {
      console.error(err);
      setError(`Failed to approve resolution: ${friendlyError(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Citizen Rejects Resolution & Reopens Case
  const handleRejectResolution = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Please provide a mandatory explanation describing why the problem was not solved.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await grievanceService.reopenGrievance(g.id, { reason: rejectionReason.trim(), imageUrl: rejectionPhoto });
      setVerificationMode(null);
      setSuccessMsg('Grievance has been reopened! The officer and department head have been notified to re-inspect.');
      reload();
    } catch (err) {
      console.error(err);
      setError(`Failed to submit rejection: ${friendlyError(err)}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout role="citizen" title="Loading..." width="wide">
        <div className="card text-center" style={{ padding: 40 }}><p className="muted">Fetching grievance details...</p></div>
      </PageLayout>
    );
  }

  if (!g) {
    return (
      <PageLayout role="citizen" title="Grievance not found" width="wide">
        <div className="card text-center" style={{ padding: 40 }}>
          {loadError && <p className="error-msg">{loadError}</p>}
          <p>We could not locate this grievance record.</p>
          <Link to="/citizen/my-grievances" className="btn btn-primary" style={{ marginTop: 12 }}>
            <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back to my grievances
          </Link>
        </div>
      </PageLayout>
    );
  }

  const hasResolutionProof = Boolean(g.resolutionImageUrl);
  const isClosed = g.status === 'Closed';
  const isReopened = g.status === 'Reopened';
  const isRejected = g.status === 'Rejected';
  // Only the citizen who filed the case can verify it.
  const isPendingVerification = g.status === 'Resolved' && g.citizenId === user?.id;

  return (
    <PageLayout
      role="citizen"
      title={g.complaintId}
      subtitle={g.subject}
      action={
        <Link to="/citizen/my-grievances" className="btn btn-light" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to My Grievances
        </Link>
      }
      width="wide"
    >
      <div className="card" style={{ marginBottom: 24 }}>
        <StatusStepper status={g.status} />
      </div>

      {(error || uploadError) && <p className="error-msg" role="alert" style={{ marginBottom: 16 }}>{error || uploadError}</p>}
      {successMsg && <p className="saved-msg" role="status" style={{ marginBottom: 16 }}>{successMsg}</p>}

      {isRejected && (
        <div style={{ marginBottom: 20, padding: '16px 20px', background: '#fbe3e1', border: '1.5px solid #f2bcb7', borderRadius: 10, color: '#922b21' }}>
          <strong style={{ fontSize: '1.05rem' }}>Grievance Rejected</strong>
          <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{g.rejectionReason || g.adminRemark}</p>
        </div>
      )}

      {/* Case Status Banners */}
      {isClosed && (
        <div className="alert-banner alert-success" style={{ marginBottom: 20, padding: '16px 20px', background: '#effaf4', border: '1.5px solid var(--green)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 14 }}>
          <CheckCircle2 size={26} color="var(--green)" />
          <div>
            <strong style={{ color: '#14603c', fontSize: '1.05rem' }}>Grievance Verified & Closed</strong>
            <p style={{ margin: '3px 0 0', fontSize: '0.88rem', color: '#14603c' }}>
              You approved the field resolution with {g.rating} ★. Thank you for making our public spaces better!
            </p>
          </div>
        </div>
      )}

      {isReopened && (
        <div style={{ marginBottom: 20, padding: '16px 20px', background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#991b1b', fontWeight: 800, fontSize: '1rem', marginBottom: 6 }}>
            <AlertTriangle size={22} color="#dc2626" />
            <span>Complaint Reopened: Citizen Disagreed with Resolution</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#7f1d1d' }}>
            <strong>Your Stated Rejection Reason:</strong> "{g.reopenReason}"
          </p>
          <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.82rem' }}>
            Location: 📍 {g.location} &bull; The responsible officer and department head have been notified to re-investigate on-site.
          </p>
        </div>
      )}

      {/* Citizen Verification & Decision Callout Box (When Officer has uploaded proof) */}
      {isPendingVerification && (
        <div style={{ background: '#fffbeb', border: '2px solid #f59e0b', borderRadius: 12, padding: 20, marginBottom: 24, boxShadow: '0 4px 12px rgba(245, 158, 11, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: '1.4rem' }}>🔍</span>
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0, color: '#92400e' }}>
                Citizen Verification Required: Inspect Officer's Completed Work
              </h2>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: '0.86rem' }}>
                Officer {g.assignedOfficerName || 'assigned to your case'} has submitted the resolution photo below. Did this solve the problem?
              </p>
            </div>
          </div>

          {!verificationMode && (
            <div style={{ display: 'flex', gap: 14, marginTop: 16, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: 'var(--green)', borderColor: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px' }}
                onClick={() => setVerificationMode('approve')}
              >
                <CheckCircle2 size={18} />
                <span>Yes, Issue Resolved (Approve & Close)</span>
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{ borderColor: '#dc2626', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 22px', background: '#fff' }}
                onClick={() => setVerificationMode('reject')}
              >
                <XCircle size={18} />
                <span>No, Issue NOT Resolved (Reject & Reopen)</span>
              </button>
            </div>
          )}

          {/* Sub-form: Citizen Approves & Rates */}
          {verificationMode === 'approve' && (
            <form onSubmit={handleApproveResolution} style={{ marginTop: 18, background: '#fff', padding: 18, borderRadius: 8, border: '1.5px solid #10b981' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#065f46', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={18} /> Rate Your Satisfaction & Close Grievance
              </h3>
              
              <div className="form-group">
                <label>How satisfied are you with this resolution?</label>
                <div style={{ display: 'flex', gap: 6, margin: '6px 0 12px' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                      aria-pressed={star === starRating}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                    >
                      <Star
                        size={28}
                        color="#f59e0b"
                        fill={star <= starRating ? '#f59e0b' : 'none'}
                      />
                    </button>
                  ))}
                  <span style={{ marginLeft: 10, alignSelf: 'center', fontWeight: 700, color: '#92400e', fontSize: '0.9rem' }}>
                    {starRating} out of 5 stars
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="feedback-comment">Feedback Comments (Optional)</label>
                <input
                  id="feedback-comment"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="e.g. Prompt action taken by the officer, road is smooth now!"
                />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Confirming...' : 'Confirm Resolution & Close Grievance'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setVerificationMode(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Sub-form: Citizen Rejects Resolution & Reopens with Photo of Same Location */}
          {verificationMode === 'reject' && (
            <form onSubmit={handleRejectResolution} style={{ marginTop: 18, background: '#fff', padding: 18, borderRadius: 8, border: '2px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', color: '#991b1b', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <XCircle size={18} /> Reject Officer's Work & Reopen Complaint
                  </h3>
                  <p className="muted" style={{ fontSize: '0.84rem', margin: '4px 0 0' }}>
                    Location is locked to: <strong>📍 {g.location}</strong>. Your follow-up photo must be taken at this same location.
                  </p>
                </div>
                <button type="button" onClick={() => setVerificationMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={20} color="var(--ink-soft)" />
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="reopen-reason">
                  Reason for Rejection (Why is it not fixed?) <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  id="reopen-reason"
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why the problem was not solved (e.g. Loose gravel scattered, pothole opened again, garbage only half-cleared)..."
                  style={{ minHeight: 80 }}
                />
              </div>

              {/* Photo Upload: Citizen provides proof that issue is still present at same location */}
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Attach Photo Showing Problem Still Persists at this Location</span>
                  <span className="muted" style={{ fontSize: '0.78rem' }}>Optional but recommended</span>
                </label>

                {rejectionPhoto ? (
                  <div style={{ position: 'relative', border: '2px solid #ef4444', borderRadius: 8, padding: 6, background: '#fff', marginTop: 4 }}>
                    <img
                      src={rejectionPhoto}
                      alt="Rejection evidence"
                      style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => setRejectionPhoto('')}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 26,
                        height: 26,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <div style={{ border: '1.5px dashed #f87171', borderRadius: 8, padding: '16px 12px', textAlign: 'center', background: '#fef2f2' }}>
                    <Camera size={26} color="#dc2626" style={{ margin: '0 auto 4px', display: 'block' }} />
                    <p style={{ fontWeight: 700, fontSize: '0.86rem', color: '#991b1b', marginBottom: 2 }}>
                      Upload Photo of Unresolved Issue
                    </p>
                    <p className="muted" style={{ fontSize: '0.78rem', marginBottom: 8 }}>
                      Must be taken on-site at {g.location}
                    </p>

                    <label htmlFor="reopen-file-upload" className="btn btn-outline" style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '4px 10px', borderColor: '#ef4444', color: '#dc2626' }}>
                      {uploading ? <Loader2 size={14} className="spin-icon" style={{ marginRight: 4 }} /> : <UploadCloud size={14} style={{ marginRight: 4 }} />}
                      {uploading ? 'Uploading...' : 'Choose Photo'}
                    </label>
                    <input id="reopen-file-upload" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileUpload} disabled={uploading} style={{ display: 'none' }} />

                    {/* Sample rejection photos (demo mode only) */}
                    {SHOW_SAMPLE_PHOTOS && (
                    <div style={{ marginTop: 12, borderTop: '1px solid #fecaca', paddingTop: 8 }}>
                      <p className="muted" style={{ fontSize: '0.75rem', marginBottom: 6, fontWeight: 600 }}>
                        ⚡ Or pick a demo rejection photo:
                      </p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {SAMPLE_REJECTION_PHOTOS.map((s) => (
                          <button
                            key={s.label}
                            type="button"
                            className="pill-btn"
                            style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                            onClick={() => handleSelectSampleRejection(s)}
                          >
                            <ImageIcon size={11} style={{ marginRight: 3, verticalAlign: '-1px' }} />
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                <button
                  type="submit"
                  className="btn"
                  style={{ background: '#dc2626', color: '#fff', fontWeight: 700 }}
                  disabled={submitting || uploading}
                >
                  {submitting ? 'Submitting Rejection...' : 'Submit Rejection & Reopen Complaint'}
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setVerificationMode(null)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Visual Evidence Comparison (Before vs After) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Camera size={20} color="var(--accent-dark)" />
          <span>Photographic Evidence: Issue Reported vs. Resolution Proof</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          
          {/* Photo 1: Problem Reported (Before) */}
          <div style={{ border: '1.5px solid var(--line)', borderRadius: 10, overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '10px 14px', background: '#f6f8fb', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem', color: 'var(--ink)' }}>1. Reported Issue (Before)</strong>
              <span className="badge badge-submitted">Citizen Upload</span>
            </div>
            <div style={{ padding: 12 }}>
              {g.imageUrl ? (
                <div>
                  <a href={g.imageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={g.imageUrl}
                      alt="Reported problem"
                      style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                    />
                  </a>
                  <p className="hint" style={{ marginTop: 6 }}>Original photo submitted by citizen.</p>
                </div>
              ) : (
                <div style={{ height: 180, display: 'grid', placeItems: 'center', color: 'var(--ink-soft)' }}>
                  <p>No initial photo attached</p>
                </div>
              )}
            </div>
          </div>

          {/* Photo 2: Resolution Proof (After) */}
          <div style={{ border: hasResolutionProof ? '2px solid var(--green)' : '1.5px dashed var(--line)', borderRadius: 10, overflow: 'hidden', background: hasResolutionProof ? '#fcfefd' : '#fdfefe' }}>
            <div style={{ padding: '10px 14px', background: hasResolutionProof ? '#effaf4' : '#f6f8fb', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem', color: hasResolutionProof ? '#14603c' : 'var(--ink)' }}>
                2. Solved Problem Proof (After)
              </strong>
              {hasResolutionProof ? (
                <span className="badge badge-resolved">Officer Uploaded</span>
              ) : (
                <span className="badge badge-in-progress">Pending Field Work</span>
              )}
            </div>
            <div style={{ padding: 12 }}>
              {g.resolutionImageUrl ? (
                <div>
                  <a href={g.resolutionImageUrl} target="_blank" rel="noreferrer">
                    <img
                      src={g.resolutionImageUrl}
                      alt="Resolution proof"
                      style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                    />
                  </a>
                  <p className="hint" style={{ marginTop: 6, color: '#14603c', fontWeight: 600 }}>
                    Uploaded by Officer {g.assignedOfficerName} upon completing repair.
                  </p>
                </div>
              ) : (
                <div style={{ height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)', textAlign: 'center', padding: 16 }}>
                  <Clock size={32} style={{ marginBottom: 6, opacity: 0.5 }} />
                  <p style={{ fontWeight: 600, fontSize: '0.92rem', marginBottom: 2 }}>Awaiting Officer Field Repair</p>
                  <p className="muted" style={{ fontSize: '0.82rem' }}>
                    The assigned officer will inspect on-site and upload photographic proof once resolved.
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Photo 3: If Reopened, show citizen's rejection photo */}
        {g.reopenImageUrl && (
          <div style={{ marginTop: 18, border: '2px solid #ef4444', borderRadius: 10, overflow: 'hidden', background: '#fef2f2' }}>
            <div style={{ padding: '10px 14px', background: '#fee2e2', borderBottom: '1px solid #fecaca', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: '0.9rem', color: '#991b1b' }}>3. Citizen Re-inspection Evidence (Problem Still Present)</strong>
              <span className="badge badge-reopened">Reopen Evidence</span>
            </div>
            <div style={{ padding: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <a href={g.reopenImageUrl} target="_blank" rel="noreferrer">
                <img
                  src={g.reopenImageUrl}
                  alt="Reopened evidence"
                  style={{ width: 220, height: 140, objectFit: 'cover', borderRadius: 6, border: '1px solid #ef4444' }}
                />
              </a>
              <div style={{ flex: 1, minWidth: 240 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#991b1b', fontSize: '0.92rem' }}>
                  Citizen's Reported Issue: "{g.reopenReason}"
                </p>
                <p className="muted" style={{ fontSize: '0.82rem', marginTop: 4 }}>
                  Taken at: 📍 {g.location} &bull; Uploaded on {formatDateTime(g.reopenedAt)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="detail-grid">
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: 14 }}>Case Summary</h3>
          <div className="detail-row"><p className="k">Category</p><p><strong>{g.category}</strong></p></div>
          <div className="detail-row"><p className="k">Location</p><p>📍 {g.location}</p></div>
          <div className="detail-row"><p className="k">Description</p><p>{g.description}</p></div>
          <div className="detail-row"><p className="k">Filed Date</p><p>{formatDateTime(g.createdAt)}</p></div>
          {g.resolvedAt && (
            <div className="detail-row"><p className="k">Resolved Date</p><p>{formatDateTime(g.resolvedAt)}</p></div>
          )}
          {g.closedAt && (
            <div className="detail-row"><p className="k">Closed Date</p><p>{formatDateTime(g.closedAt)}</p></div>
          )}
          <div className="detail-row"><p className="k">Responsible Department</p><p>{g.department || 'Under Review & Assignment'}</p></div>
          <div className="detail-row"><p className="k">Assigned Officer</p><p>{g.assignedOfficerName ? `👮 ${g.assignedOfficerName}` : 'Assigning during triage...'}</p></div>
          {g.adminRemark && (
            <div className="detail-row">
              <p className="k">Authority Remark</p>
              <p className="remark" style={{ fontStyle: 'italic' }}>{g.adminRemark}</p>
            </div>
          )}
          {g.rating != null && (
            <div className="detail-row">
              <p className="k">Citizen Rating</p>
              <p style={{ color: '#f59e0b', fontWeight: 700 }}>
                {'★'.repeat(g.rating)}{'☆'.repeat(5 - g.rating)} ({g.rating}/5)
              </p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', marginBottom: 14 }}>Lifecycle Timeline</h3>
<Timeline steps={g.timeline} />
        </div>
      </div>
    </PageLayout>
  );
}

export default GrievanceDetails;
