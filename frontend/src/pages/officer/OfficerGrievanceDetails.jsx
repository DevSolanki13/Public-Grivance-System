import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Camera, CheckCircle2, ArrowLeft, UploadCloud, X, Image as ImageIcon, AlertTriangle, Loader2 } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import StatusBadge from '../../components/StatusBadge';
import Timeline from '../../components/Timeline';
import { SAMPLE_RESOLVED_PHOTOS } from '../../data/reference';
import { useAuth } from '../../context/AuthContext';
import { grievanceService } from '../../services/grievanceService';
import { friendlyError } from '../../lib/supabase';
import { useGrievance } from '../../hooks/useGrievances';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import { formatDateTime } from '../../utils/dateUtils';

const SHOW_SAMPLE_PHOTOS = import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';

function OfficerGrievanceDetails() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const { grievance: g, loading, error: loadError, reload } = useGrievance(id);
  const { uploading, uploadFromInput, uploadError } = usePhotoUpload(user?.id);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Resolution form state
  const [resolutionPhoto, setResolutionPhoto] = useState('');
  const [resolutionRemark, setResolutionRemark] = useState('');
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e) => {
    const url = await uploadFromInput(e);
    if (url) {
      setResolutionPhoto(url);
      setError('');
    }
  };

  const handleSelectSampleResolved = (sample) => {
    setResolutionPhoto(sample.url);
    if (!resolutionRemark) {
      setResolutionRemark(sample.remark);
    }
    setError('');
  };

  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolutionPhoto) {
      setError('A photo of the solved / replaced problem is mandatory as proof of resolution.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      await grievanceService.resolveGrievance(g.id, { resolutionImageUrl: resolutionPhoto, remark: resolutionRemark.trim() });
      setSuccessMsg('Resolution proof uploaded! The grievance has been marked as Resolved and sent to the citizen for verification.');
      setResolutionPhoto('');
      setResolutionRemark('');
      reload();
    } catch (err) {
      console.error(err);
      setError(`Failed to submit resolution: ${friendlyError(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLayout role="officer" title="Loading..." width="wide">
        <div className="card text-center" style={{ padding: 40 }}>
          <p className="muted">Loading case details and evidence...</p>
        </div>
      </PageLayout>
    );
  }

  if (!g) {
    return (
      <PageLayout role="officer" title="Case not found" width="wide">
        <div className="card text-center" style={{ padding: 40 }}>
          <p className="error-msg">{loadError || 'Case not found'}</p>
          <Link to="/officer/dashboard" className="btn btn-outline" style={{ marginTop: 12 }}>
            <ArrowLeft size={16} /> Back to Officer Portal
          </Link>
        </div>
      </PageLayout>
    );
  }

  const isResolved = g.status === 'Resolved' || g.status === 'Closed';
  const canResolve = (g.status === 'In Progress' || g.status === 'Reopened')
    && (g.assignedOfficerId === user?.id || role === 'admin');

  return (
    <PageLayout
      role="officer"
      title={`Case Inspection: ${g.complaintId}`}
      subtitle={`Assigned to ${g.assignedOfficerName || 'no officer yet'} • ${g.category}`}
      action={
        <Link to="/officer/dashboard" className="btn btn-light" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={16} /> Back to Assigned Cases
        </Link>
      }
    >
      {(error || uploadError) && <p className="error-msg" role="alert">{error || uploadError}</p>}
      {successMsg && <p className="saved-msg" role="status">{successMsg}</p>}

      <div className="two-col">

        {/* Left Column: Problem Information & Citizen's "Before" Photo */}
        <div className="col-stack">
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Reported Problem Dossier</h2>
              <StatusBadge status={g.status} />
            </div>

            <div className="detail-row"><p className="k">Category</p><p><strong>{g.category}</strong></p></div>
            <div className="detail-row"><p className="k">Subject</p><p style={{ fontWeight: 600 }}>{g.subject}</p></div>
            <div className="detail-row"><p className="k">Description</p><p>{g.description}</p></div>
            <div className="detail-row"><p className="k">Location</p><p>📍 {g.location}</p></div>
            <div className="detail-row"><p className="k">Citizen Contact</p><p>{g.citizenName} ({g.citizenEmail})</p></div>
            <div className="detail-row"><p className="k">Priority</p>
              <span className={`priority-badge priority-${(g.priority || 'medium').toLowerCase()}`}>
                {g.priority || 'Medium'}
              </span>
            </div>
            <div className="detail-row"><p className="k">Filed Date</p><p>{formatDateTime(g.createdAt)}</p></div>
          </div>

          {/* Citizen's Problem Photo ("Before") */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: 10, color: 'var(--ink)' }}>
              📷 Problem to Fix / Replace (Citizen's Photo)
            </h3>
            <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 12 }}>
              Inspect the damaged or defective item reported by the citizen:
            </p>

            {g.imageUrl ? (
              <div>
                <a href={g.imageUrl} target="_blank" rel="noreferrer">
                  <img
                    src={g.imageUrl}
                    alt="Problem to fix"
                    style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8, border: '1.5px solid var(--line)' }}
                  />
                </a>
                <p className="hint" style={{ marginTop: 6 }}>Click photo to expand.</p>
              </div>
            ) : (
              <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>No problem photo attached.</p>
            )}
          </div>
        </div>

        {/* Right Column: Officer Resolution Proof ("After" Photo) */}
        <div className="col-stack">
          <div className={`card ${isResolved ? 'success-box' : ''}`} style={isResolved ? { textAlign: 'left', background: '#f3f6fb', border: '2px solid var(--green)' } : {}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <CheckCircle2 size={22} color={isResolved ? 'var(--green)' : 'var(--accent-dark)'} />
              <h2 style={{ fontSize: '1.25rem', margin: 0, color: isResolved ? '#14603c' : 'var(--ink)' }}>
                {isResolved ? 'Problem Solved & Proof Verified' : 'Upload Proof of Solved Problem'}
              </h2>
            </div>

            {isResolved ? (
              <div>
                <p style={{ color: '#14603c', fontWeight: 600, marginBottom: 14 }}>
                  ✓ This grievance has been completed and marked Resolved.
                </p>

                {g.resolutionImageUrl && (
                  <div style={{ marginBottom: 14 }}>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 6 }}>
                      Resolution Proof Photo (After Repair):
                    </p>
                    <a href={g.resolutionImageUrl} target="_blank" rel="noreferrer">
                      <img
                        src={g.resolutionImageUrl}
                        alt="Solved Proof"
                        style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--green)' }}
                      />
                    </a>
                  </div>
                )}

                <div className="detail-row">
                  <p className="k">Officer Remark</p>
                  <p style={{ fontWeight: 600 }}>{g.adminRemark}</p>
                </div>
                <div className="detail-row">
                  <p className="k">Resolved On</p>
                  <p>{formatDateTime(g.resolvedAt)}</p>
                </div>
              </div>
            ) : !canResolve ? (
              <p className="muted">
                {g.status === 'Rejected'
                  ? 'This grievance was rejected during triage; no field work is required.'
                  : 'This case is not assigned to you for field work yet.'}
              </p>
            ) : (
              <form onSubmit={handleSubmitResolution}>
                {g.status === 'Reopened' && (
                  <div style={{ background: '#fee2e2', border: '2px solid #ef4444', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#991b1b', fontWeight: 800, marginBottom: 4 }}>
                      <AlertTriangle size={18} color="#dc2626" />
                      <span>Work Rejected by Citizen — Re-inspection Required</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#7f1d1d' }}>
                      <strong>Citizen's Reason:</strong> "{g.reopenReason}"
                    </p>
                    {g.reopenImageUrl && (
                      <div style={{ marginTop: 10 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>
                          Photo Uploaded by Citizen at {g.location}:
                        </p>
                        <a href={g.reopenImageUrl} target="_blank" rel="noreferrer">
                          <img
                            src={g.reopenImageUrl}
                            alt="Citizen rejection evidence"
                            style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 6, border: '1px solid #ef4444' }}
                          />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <p className="muted" style={{ fontSize: '0.86rem', marginBottom: 16 }}>
                  Once the field repair or replacement is finished, take a photo of the completed work to resolve the case.
                </p>

                {/* Solved Photo Upload */}
                <div className="form-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Photo of the Solved Problem (Proof) *</span>
                    <span className="muted" style={{ fontSize: '0.78rem' }}>Mandatory</span>
                  </label>

                  {resolutionPhoto ? (
                    <div style={{ border: '2px solid var(--green)', borderRadius: 8, padding: 8, background: '#fff', position: 'relative' }}>
                      <img
                        src={resolutionPhoto}
                        alt="Solved problem proof"
                        style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 6, display: 'block' }}
                      />
                      <button
                        type="button"
                        onClick={() => setResolutionPhoto('')}
                        style={{
                          position: 'absolute',
                          top: 14,
                          right: 14,
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        border: '2px dashed var(--line)',
                        borderRadius: 8,
                        padding: '20px 14px',
                        textAlign: 'center',
                        background: '#fcfdfd',
                      }}
                    >
                      <Camera size={30} color="var(--accent-dark)" style={{ margin: '0 auto 6px', display: 'block' }} />
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>Click or Upload Photo of Solved Problem</p>
                      <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 10 }}>Show the fixed road, replaced light, or cleared waste.</p>

                      <label
                        htmlFor="officer-file-upload"
                        className="btn btn-outline"
                        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem' }}
                      >
                        {uploading ? <Loader2 size={15} className="spin-icon" /> : <UploadCloud size={15} />}
                        {uploading ? 'Uploading...' : 'Upload Fixed Photo'}
                      </label>
                      <input
                        id="officer-file-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        style={{ display: 'none' }}
                      />

                      {/* Sample photos (demo mode only) */}
                      {SHOW_SAMPLE_PHOTOS && (
                      <div style={{ marginTop: 14, borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                        <p className="muted" style={{ fontSize: '0.78rem', marginBottom: 6, fontWeight: 600 }}>
                          ⚡ Or pick demo solved photo:
                        </p>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                          {SAMPLE_RESOLVED_PHOTOS.map((s) => (
                            <button
                              key={s.label}
                              type="button"
                              className="pill-btn"
                              style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                              onClick={() => handleSelectSampleResolved(s)}
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

                <div className="form-group" style={{ marginTop: 14 }}>
                  <label htmlFor="res-remark">Work Completion Remarks *</label>
                  <textarea
                    id="res-remark"
                    required
                    minLength={5}
                    value={resolutionRemark}
                    onChange={(e) => setResolutionRemark(e.target.value)}
                    placeholder="Describe how the problem was resolved (e.g. Cleared 1.5 tons of garbage; Installed new 45W LED streetlight)..."
                    style={{ minHeight: 75 }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={saving || uploading}
                  style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <CheckCircle2 size={18} />
                  {saving ? 'Uploading Resolution Proof...' : 'Upload Proof & Mark Problem Solved'}
                </button>
              </form>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Case Activity Timeline</h3>
<Timeline steps={g.timeline} />
          </div>
        </div>

      </div>
    </PageLayout>
  );
}

export default OfficerGrievanceDetails;
