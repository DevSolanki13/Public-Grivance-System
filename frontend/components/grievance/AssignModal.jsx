import React, { useState, useEffect } from 'react';
import { departmentApi, grievanceApi } from '../../api/index.js';
import { UserCheck, X } from 'lucide-react';

export default function AssignModal({ grievance, isOpen, onClose, onAssigned }) {
  const [officers, setOfficers] = useState([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !grievance) return;
    async function loadOfficers() {
      setLoading(true);
      try {
        const res = await departmentApi.getOfficers(grievance.departmentId);
        if (res.success) {
          setOfficers(res.officers || []);
          if (res.officers.length > 0) {
            setSelectedOfficerId(res.officers[0].id);
          }
        }
      } catch (err) {
        setError('Failed to load available officers.');
      } finally {
        setLoading(false);
      }
    }
    loadOfficers();
  }, [isOpen, grievance]);

  if (!isOpen || !grievance) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!selectedOfficerId) {
      setError('Please choose an officer to assign.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await grievanceApi.assignOfficer(grievance.id, selectedOfficerId, remark.trim() || undefined);
      if (res.success) {
        onAssigned(res.grievance);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to assign officer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
            Assign Officer: {grievance.complaintId}
          </h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {error && <p style={{ background: '#fef2f2', color: '#991b1b', padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16 }}>{error}</p>}

        <form onSubmit={handleAssign}>
          <div className="form-group">
            <label>Department</label>
            <input type="text" value={grievance.department || 'Not Assigned'} disabled style={{ background: '#f1f5f9' }} />
          </div>

          <div className="form-group">
            <label>Select Field Officer *</label>
            {loading ? (
              <p style={{ fontSize: 13, color: '#64748b' }}>Loading officers in this department...</p>
            ) : officers.length === 0 ? (
              <p style={{ fontSize: 13, color: '#dc2626' }}>No officers currently registered in this department.</p>
            ) : (
              <select
                value={selectedOfficerId}
                onChange={(e) => setSelectedOfficerId(e.target.value)}
                required
              >
                {officers.map((off) => (
                  <option key={off.id} value={off.id}>
                    {off.name} ({off.designation || 'Officer'}) — {off.activeCases} active cases ({off.workloadLevel} workload)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label>Assignment Instructions / Remarks</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Inspect the transformer connection and submit photos by tomorrow."
              rows={3}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || officers.length === 0}>
            {submitting ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </form>
      </div>
    </div>
  );
}
