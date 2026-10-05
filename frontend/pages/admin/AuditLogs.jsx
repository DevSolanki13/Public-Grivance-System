import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import api from '../../api/index.js';
import { ShieldCheck, ArrowLeft, History } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLogs() {
      setLoading(true);
      setError('');
      try {
        const res = await api.getAuditLogs();
        if (res.success) {
          setLogs(res.logs || []);
        }
      } catch (err) {
        console.warn('Failed to load audit logs:', err);
        setError('Unable to load audit logs. Please verify credentials or connection.');
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  return (
    <PageLayout
      title="System Audit Trail & Accountability Logs"
      subtitle="Chronological event logs recording every status change, assignment, reopen, and citizen verification"
      action={
        <Link to="/admin/dashboard" className="btn btn-outline" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      }
    >
      {error && <p className="error-msg">{error}</p>}
      <div className="card">
        {loading ? (
          <p style={{ color: '#94a3b8', padding: '20px' }}>Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <p style={{ color: '#64748b', padding: '30px', textAlign: 'center' }}>No audit records found.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Complaint ID</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Role</th>
                  <th>Status Transition</th>
                  <th>Audit Note</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <strong style={{ color: '#0284c7' }}>{log.complaintId}</strong>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: '#f1f5f9',
                          color: '#334155',
                          textTransform: 'uppercase',
                        }}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td><strong>{log.performedBy}</strong></td>
                    <td style={{ textTransform: 'capitalize', color: '#64748b' }}>
                      {log.performedByRole}
                    </td>
                    <td>
                      {log.previousStatus && (
                        <span style={{ fontSize: 11, color: '#64748b' }}>{log.previousStatus} → </span>
                      )}
                      <strong style={{ fontSize: 12, color: '#0f172a' }}>{log.newStatus}</strong>
                    </td>
                    <td style={{ fontSize: 13, color: '#475569' }}>{log.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
