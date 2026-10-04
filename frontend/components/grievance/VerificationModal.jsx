import React, { useState } from 'react';
import { grievanceApi } from '../../api/grievanceApi.js';
import { CheckCircle2, AlertTriangle, Star, X } from 'lucide-react';

export default function VerificationModal({ grievance, isOpen, onClose, onVerified }) {
  const [mode, setMode] = useState('verify'); // 'verify' | 'reopen'
  const [rating, setRating] = useState(5);
  const [satisfaction, setSatisfaction] = useState('Very Satisfied');
  const [comment, setComment] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !grievance) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await grievanceApi.verifyGrievance(grievance.id, {
        satisfied: true,
        rating,
        feedback: comment || satisfaction,
      });
      if (res.success) {
        onVerified(res.grievance);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to verify resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReopen = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim() || reopenReason.trim().length < 8) {
      setError('Please provide a specific explanation of why the problem is not fixed (at least 8 characters).');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await grievanceApi.verifyGrievance(grievance.id, {
        satisfied: false,
        reopenReason: reopenReason.trim(),
      });
      if (res.success) {
        onVerified(res.grievance);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to reopen grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
            Resolution Verification: {grievance.complaintId}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {error && <p style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</p>}

        {/* Officer Resolution Details */}
        {grievance.resolution && (
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
              Officer's Completion Report ({grievance.resolution.submittedByName || 'Officer'})
            </p>
            <p style={{ fontSize: 14, color: '#1e293b', marginBottom: 10 }}>{grievance.resolution.description}</p>
            {grievance.resolution.proofFiles?.length > 0 && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {grievance.resolution.proofFiles.map((pf) => (
                  <a key={pf.id || pf.url} href={pf.url} target="_blank" rel="noreferrer">
                    <img
                      src={pf.url}
                      alt="Site resolution proof"
                      style={{ width: 100, height: 75, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1' }}
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Mode Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <button
            type="button"
            className={`btn ${mode === 'verify' ? 'btn-success' : 'btn-outline'}`}
            onClick={() => setMode('verify')}
            style={{ fontSize: 13 }}
          >
            <CheckCircle2 size={16} />
            Issue Resolved
          </button>
          <button
            type="button"
            className={`btn ${mode === 'reopen' ? 'btn-danger' : 'btn-outline'}`}
            onClick={() => setMode('reopen')}
            style={{ fontSize: 13 }}
          >
            <AlertTriangle size={16} />
            Not Resolved (Reopen)
          </button>
        </div>

        {mode === 'verify' ? (
          <form onSubmit={handleVerify}>
            <div className="form-group">
              <label>Citizen Rating</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  >
                    <Star
                      size={28}
                      fill={star <= rating ? '#eab308' : 'none'}
                      color={star <= rating ? '#eab308' : '#cbd5e1'}
                    />
                  </button>
                ))}
                <span style={{ fontSize: 14, fontWeight: 700, marginLeft: 8, color: '#334155' }}>
                  {rating} of 5 Stars
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Satisfaction Level</label>
              <select value={satisfaction} onChange={(e) => setSatisfaction(e.target.value)}>
                <option value="Very Satisfied">Very Satisfied</option>
                <option value="Satisfied">Satisfied</option>
                <option value="Neutral">Neutral</option>
                <option value="Unsatisfied">Unsatisfied</option>
              </select>
            </div>

            <div className="form-group">
              <label>Public Feedback (Optional)</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with the municipal repair..."
                rows={3}
              />
            </div>

            <button type="submit" className="btn btn-success btn-block" disabled={submitting}>
              {submitting ? 'Confirming...' : 'Verify & Close Grievance'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReopen}>
            <div className="form-group">
              <label>Reason for Reopening *</label>
              <textarea
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Describe what is still broken or incomplete on site..."
                rows={4}
                required
              />
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                This grievance will be flagged as <strong>REOPENED</strong> and escalated directly to the Department Head.
              </p>
            </div>

            <button type="submit" className="btn btn-danger btn-block" disabled={submitting}>
              {submitting ? 'Reopening...' : 'Reopen Grievance & Escalate'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
