import React from 'react';

// Small coloured pill. Matches original JanSewa badge styling
export default function StatusBadge({ status }) {
  if (!status) return null;
  const norm = status.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-');
  const display = status.replace(/_/g, ' ');
  return <span className={`badge badge-${norm}`}>{display}</span>;
}
