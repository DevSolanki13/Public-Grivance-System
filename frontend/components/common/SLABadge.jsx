import React from 'react';
import { Clock, AlertTriangle, CheckCheck } from 'lucide-react';

export default function SLABadge({ slaInfo }) {
  if (!slaInfo) return null;

  const { status, timeText, isOverdue } = slaInfo;

  return (
    <span className={`sla-badge sla-${status}`}>
      {isOverdue ? (
        <AlertTriangle size={13} strokeWidth={2.4} />
      ) : status.includes('RESOLVED') ? (
        <CheckCheck size={13} strokeWidth={2.4} />
      ) : (
        <Clock size={13} strokeWidth={2.2} />
      )}
      <span>{timeText || status}</span>
    </span>
  );
}
