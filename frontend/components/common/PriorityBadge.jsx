import React from 'react';

const PRIORITY_DOTS = {
  LOW: '🟢',
  MEDIUM: '🟡',
  HIGH: '🟠',
  CRITICAL: '🔴',
};

export default function PriorityBadge({ priority = 'MEDIUM' }) {
  const norm = (priority || 'MEDIUM').toUpperCase();
  const dot = PRIORITY_DOTS[norm] || '⚪';

  return (
    <span className={`priority-pill priority-${norm}`}>
      <span>{dot}</span>
      <span>{norm}</span>
    </span>
  );
}
