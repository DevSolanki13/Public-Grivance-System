import React, { useState } from 'react';
import { grievanceApi } from '../../api/grievanceApi.js';
import PhotoUploader from '../common/PhotoUploader';
import { X } from 'lucide-react';

export default function ResolutionModal({ grievance, isOpen, onClose, onResolved }) {
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !grievance) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a detailed summary of the work completed (at least 10 characters).');
      return;
    }

    if (files.length === 0) {
      setError('Please upload or click at least one site completion photo as resolution proof.');
      return;
    }

    setSubmitting(true);
    setError('');

    const formData = new FormData();
    formData.append('description', description.trim());
    files.forEach((file) => {
      formData.append('proofFiles', file);
    });

    try {
      const res = await grievanceApi.resolveGrievance(grievance.id, formData);
      if (res.success) {
        onResolved(res.grievance);
        onClose();
      } else {
        setError(res.message || 'Failed to submit resolution.');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit resolution.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
            Submit Resolution Proof: {grievance.complaintId}
          </h2>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-soft)' }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <p
            style={{
              background: '#fef2f2',
              color: '#991b1b',
              padding: '10px 14px',
              borderRadius: 8,
              fontSize: 13,
              marginBottom: 16,
              border: '1px solid #fecaca',
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="res-description">Field Action & Work Description *</label>
            <textarea
              id="res-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dispatched repair crew; replaced broken LED bulb; tested connection."
              rows={4}
              required
            />
          </div>

          <PhotoUploader
            files={files}
            onChange={setFiles}
            label="Resolution Proof Photos"
            required={true}
            maxFiles={5}
          />

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
            style={{ marginTop: 8 }}
          >
            {submitting ? 'Submitting Resolution Proof...' : 'Send for Citizen Verification'}
          </button>
        </form>
      </div>
    </div>
  );
}
