import React from 'react';
import { Check, Circle } from 'lucide-react';

const STEPS = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];

// Pills joined by lines: done = teal, current = dark teal, pending = grey
export default function StatusStepper({ status }) {
  const norm = (status || 'Submitted').toUpperCase().replace(/\s+/g, '_');

  let currentIndex = 0;
  if (norm === 'SUBMITTED') currentIndex = 0;
  else if (norm === 'UNDER_REVIEW' || norm === 'ASSIGNED') currentIndex = 1;
  else if (norm === 'IN_PROGRESS' || norm === 'RESOLUTION_SUBMITTED' || norm === 'AWAITING_VERIFICATION' || norm === 'REOPENED') currentIndex = 2;
  else if (norm === 'CLOSED' || norm === 'RESOLVED') currentIndex = 3;

  if (norm === 'REJECTED') {
    return (
      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#991b1b', fontSize: 13, fontWeight: 700 }}>
        ✕ This grievance was reviewed and rejected.
      </div>
    );
  }

  return (
    <div>
      <div className="stepper">
        {STEPS.map((step, i) => {
          const state = i < currentIndex ? 'done' : (i === currentIndex && norm !== 'CLOSED' && norm !== 'RESOLVED') ? 'current' : (i === 3 && (norm === 'CLOSED' || norm === 'RESOLVED')) ? 'done' : '';
          return (
            <div key={step} style={{ display: 'contents' }}>
              {i > 0 && <span className={'line ' + (i <= currentIndex ? 'done' : '')} />}
              <span className={'pill ' + state}>
                {state === 'done' || (i === currentIndex && state === 'current') ? (
                  <Check size={16} />
                ) : (
                  <Circle size={14} />
                )}
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {norm === 'REOPENED' && (
        <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, margin: '6px 0 0' }}>
          ⚠️ Case was reopened by citizen and escalated for urgent re-inspection.
        </p>
      )}
    </div>
  );
}
