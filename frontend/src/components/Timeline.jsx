import { formatDateTime } from '../utils/dateUtils';

// Lifecycle timeline built from the grievance's events.
function Timeline({ steps = [] }) {
  if (steps.length === 0) return <p className="muted">No activity recorded yet.</p>;
  return (
    <ul className="timeline">
      {steps.map((step) => (
        <li key={step.id ?? `${step.status}-${step.at}`}>
          <span className="dot" style={{ background: step.status === 'Reopened' || step.status === 'Rejected' ? '#ef4444' : 'var(--accent-dark)' }} />
          <div>
            <strong>{step.status}</strong>
            <div className="muted" style={{ fontSize: '0.82rem' }}>
              {formatDateTime(step.at)}{step.actor ? ` · ${step.actor}` : ''}
            </div>
            {step.remark && <p style={{ fontSize: '0.84rem', marginTop: 2, fontStyle: 'italic' }}>{step.remark}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default Timeline;
