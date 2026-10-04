import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import StatusStepper from '../../components/common/StatusStepper';
import VerificationModal from '../../components/grievance/VerificationModal';
import ResolutionModal from '../../components/grievance/ResolutionModal';
import AssignModal from '../../components/grievance/AssignModal';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/index.js';
import { Star, CheckCircle2, Play, Camera, UserCheck, ArrowLeft } from 'lucide-react';

const STEPS = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

export default function CitizenGrievanceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [g, setG] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getGrievanceById(id);
      if (res.success && res.grievance) {
        setG(res.grievance);
      } else {
        setError(res.message || 'Grievance not found.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load grievance details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleStartWork = async () => {
    setActionLoading(true);
    try {
      const res = await api.startWork(g.id, { remark: 'Officer commenced work on site.' });
      if (res.success) {
        await load();
      }
    } catch (err) {
      setError(err.message || 'Failed to start work.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatWhen = (ts) => {
    if (!ts) return 'Pending';
    const d = new Date(ts);
    return isNaN(d.getTime())
      ? String(ts)
      : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  };

  const getBackLink = () => {
    if (user?.role === 'officer') return { path: '/officer/dashboard', label: 'Back to Officer Cases' };
    if (user?.role === 'department_head') return { path: '/department/dashboard', label: 'Back to Dept Queue' };
    if (user?.role === 'admin') return { path: '/admin/dashboard', label: 'Back to Admin Console' };
    return { path: '/citizen/my-grievances', label: 'Back to My Grievances' };
  };

  const backLink = getBackLink();

  if (loading) {
    return (
      <PageLayout role={user?.role || 'citizen'} title="Loading..." width="narrow">
        <div className="card"><p className="muted">Fetching grievance details...</p></div>
      </PageLayout>
    );
  }

  if (error || !g) {
    return (
      <PageLayout role={user?.role || 'citizen'} title="Grievance not found" width="narrow">
        <div className="card">
          {error && <p className="error-msg">{error}</p>}
          <p>We could not find this grievance.</p>
          <Link to={backLink.path} className="link">{backLink.label}</Link>
        </div>
      </PageLayout>
    );
  }

  const norm = (g.status || 'Submitted').toUpperCase().replace(/\s+/g, '_');
  let currentIndex = 0;
  if (norm === 'SUBMITTED') currentIndex = 0;
  else if (norm === 'UNDER_REVIEW' || norm === 'ASSIGNED') currentIndex = 1;
  else if (norm === 'IN_PROGRESS' || norm === 'RESOLUTION_SUBMITTED' || norm === 'AWAITING_VERIFICATION' || norm === 'REOPENED') currentIndex = 2;
  else if (norm === 'CLOSED' || norm === 'RESOLVED') currentIndex = 3;

  const isAwaitingVerification = norm === 'AWAITING_VERIFICATION' || norm === 'RESOLUTION_SUBMITTED';
  const isOfficerOrAdmin = user?.role === 'officer' || user?.role === 'admin';
  const isDeptHeadOrAdmin = user?.role === 'department_head' || user?.role === 'admin';
  const isCitizenOrAdmin = user?.role === 'citizen' || user?.role === 'admin';

  return (
    <PageLayout
      role={user?.role || 'citizen'}
      title={g.complaintId}
      subtitle={g.subject}
      action={
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to={backLink.path} className="btn btn-light">
            <ArrowLeft size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {backLink.label}
          </Link>

          {/* Department Head: Assign / Reassign Button */}
          {isDeptHeadOrAdmin && !['CLOSED', 'REJECTED'].includes(norm) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setAssignModalOpen(true)}
            >
              <UserCheck size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {g.assignedOfficerId ? 'Reassign Officer' : 'Assign Field Officer'}
            </button>
          )}

          {/* Officer: Start Work Button */}
          {isOfficerOrAdmin && ['SUBMITTED', 'ASSIGNED', 'UNDER_REVIEW', 'REOPENED'].includes(norm) && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartWork}
              disabled={actionLoading}
            >
              <Play size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              {actionLoading ? 'Starting Work...' : 'Start Work on Site'}
            </button>
          )}

          {/* Officer: Submit Resolution Proof Button */}
          {isOfficerOrAdmin && norm === 'IN_PROGRESS' && (
            <button
              type="button"
              className="btn btn-success"
              onClick={() => setResolveModalOpen(true)}
            >
              <Camera size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Submit Resolution Proof
            </button>
          )}

          {/* Citizen: Verify Resolution Button */}
          {isCitizenOrAdmin && isAwaitingVerification && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setVerifyModalOpen(true)}
            >
              <CheckCircle2 size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Verify Resolution
            </button>
          )}
        </div>
      }
    >
      <div className="card" style={{ marginBottom: 20 }}>
        <StatusStepper status={g.status} />
      </div>

      {/* Verification Spotlight Alert for Citizens */}
      {isAwaitingVerification && (
        <div
          style={{
            background: '#fff7ed',
            border: '2px solid #ea580c',
            borderRadius: 12,
            padding: '20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9a3412', fontWeight: 800, fontSize: 16 }}>
              <CheckCircle2 size={18} color="#ea580c" />
              <span>Resolution Proof Submitted by Officer</span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7c2d12' }}>
              The field engineer has submitted completion photos. Please inspect the photos below and confirm satisfaction or reopen.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setVerifyModalOpen(true)}
            style={{ background: '#ea580c', borderColor: '#ea580c', fontWeight: 800 }}
          >
            Review & Verify Resolution
          </button>
        </div>
      )}

      {/* Officer Work in Progress Alert */}
      {norm === 'IN_PROGRESS' && (
        <div
          style={{
            background: '#eff6ff',
            border: '1.5px solid #bfdbfe',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <span style={{ fontWeight: 800, color: '#1e40af', fontSize: 15 }}>
              ⚡ Work In Progress by {g.assignedOfficerName || 'Assigned Officer'}
            </span>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#1e3a8a' }}>
              Field team has accepted and is actively resolving this civic issue on-site.
            </p>
          </div>
          {isOfficerOrAdmin && (
            <button
              type="button"
              className="btn btn-success"
              onClick={() => setResolveModalOpen(true)}
            >
              <Camera size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Upload Completion Proof
            </button>
          )}
        </div>
      )}

      {/* Reopened Alert */}
      {norm === 'REOPENED' && (
        <div
          style={{
            background: '#fff1f2',
            border: '2px solid #e11d48',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 20,
          }}
        >
          <div style={{ color: '#9f1239', fontWeight: 800, fontSize: 15 }}>
            ⚠️ Reopened & Escalated by Citizen
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#881337' }}>
            Reason: {g.verification?.reopenReason || g.escalationReason || 'Citizen indicated the issue was not resolved.'}
          </p>
        </div>
      )}

      <div className="grid-2 detail-grid">
        <div className="card">
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>Details</h3>

          <div className="detail-row">
            <p className="k">Department</p>
            <p className="v">{g.department || g.departmentId}</p>
          </div>

          <div className="detail-row">
            <p className="k">Category</p>
            <p className="v">{g.category || g.categoryId}</p>
          </div>

          <div className="detail-row">
            <p className="k">Subcategory</p>
            <p className="v">{g.subcategory || g.subcategoryId || 'General'}</p>
          </div>

          <div className="detail-row">
            <p className="k">Priority</p>
            <p className="v">{g.priority}</p>
          </div>

          <div className="detail-row">
            <p className="k">Citizen Name</p>
            <p className="v">{g.citizenName || 'Citizen'}</p>
          </div>

          <div className="detail-row">
            <p className="k">Assigned Officer</p>
            <p className="v">{g.assignedOfficerName || 'Not yet assigned'}</p>
          </div>

          <div className="detail-row">
            <p className="k">Area / Address</p>
            <p className="v">{g.location?.address || g.location?.area || 'Ward Area'}</p>
          </div>

          <div className="detail-row">
            <p className="k">Description</p>
            <p className="v" style={{ whiteSpace: 'pre-wrap' }}>{g.description}</p>
          </div>

          {/* Citizen Uploaded Evidence */}
          {g.evidence && g.evidence.length > 0 && (
            <div className="detail-row">
              <p className="k">Citizen Photo Evidence</p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                {g.evidence.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer">
                    <img
                      src={src}
                      alt={`Evidence ${i + 1}`}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #cbd5e1' }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Proof Section */}
          {g.resolution && (
            <div style={{ marginTop: 20, padding: 16, background: '#f0fdf4', borderRadius: 10, border: '1.5px solid #86efac' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 800, color: '#166534', fontSize: 14 }}>
                  ✓ Official Resolution Proof Submitted
                </span>
                <span style={{ fontSize: 12, color: '#15803d' }}>
                  {formatWhen(g.resolution.resolvedAt)}
                </span>
              </div>

              <p style={{ margin: '0 0 10px', fontSize: 13, color: '#14532d' }}>
                {g.resolution.summary || g.resolution.text || g.resolution.remarks}
              </p>

              {g.resolution.proofFiles && g.resolution.proofFiles.length > 0 && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {g.resolution.proofFiles.map((proof, i) => (
                    <a key={i} href={proof} target="_blank" rel="noreferrer">
                      <img
                        src={proof}
                        alt={`Proof ${i + 1}`}
                        style={{ width: 90, height: 90, objectFit: 'cover', borderRadius: 8, border: '2px solid #22c55e' }}
                      />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Citizen Verification & Feedback */}
          {g.verification && g.verification.satisfied && (
            <div style={{ marginTop: 16, padding: 14, background: '#fefce8', borderRadius: 8, border: '1px solid #fef08a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, color: '#854d0e', fontSize: 13, marginRight: 6 }}>
                  Citizen Feedback:
                </span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    fill={star <= (g.verification.rating || 5) ? '#eab308' : 'none'}
                    color="#eab308"
                  />
                ))}
                <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e', marginLeft: 6 }}>
                  {g.verification.rating} / 5
                </span>
              </div>
              {g.verification.feedback && (
                <p style={{ fontSize: 13, color: '#78350f', fontStyle: 'italic', margin: 0 }}>
                  "{g.verification.feedback}"
                </p>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 16 }}>Audit & Progress Timeline</h3>
          <ul className="timeline">
            {STEPS.map((step, i) => {
              const matchingTimeline = g.timeline?.find((t) => {
                const s = (t.status || t.title || '').toUpperCase();
                if (step === 'Submitted') return s.includes('SUBMIT');
                if (step === 'Under Review') return s.includes('REVIEW') || s.includes('ASSIGN');
                if (step === 'In Progress') return s.includes('PROGRESS') || s.includes('WORK');
                if (step === 'Resolved') return s.includes('RESOLVE') || s.includes('CLOSE');
                return false;
              });

              const cls = i < currentIndex ? 'done' : i === currentIndex ? 'current' : '';
              return (
                <li key={step} className={cls}>
                  <span className="dot" />
                  <p className="step">{step}</p>
                  <p className="when">
                    {matchingTimeline ? formatWhen(matchingTimeline.timestamp || matchingTimeline.at) : (i <= currentIndex ? 'Completed' : 'Pending')}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Verification Modal */}
      {verifyModalOpen && (
        <VerificationModal
          grievance={g}
          isOpen={verifyModalOpen}
          onClose={() => setVerifyModalOpen(false)}
          onVerified={() => load()}
        />
      )}

      {/* Resolution Modal */}
      {resolveModalOpen && (
        <ResolutionModal
          grievance={g}
          isOpen={resolveModalOpen}
          onClose={() => setResolveModalOpen(false)}
          onResolved={() => load()}
        />
      )}

      {/* Assignment Modal */}
      {assignModalOpen && (
        <AssignModal
          grievance={g}
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          onAssigned={() => load()}
        />
      )}
    </PageLayout>
  );
}
