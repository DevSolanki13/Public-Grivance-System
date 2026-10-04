export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const now = Date.now();
  const past = new Date(dateString).getTime();
  const diffMs = now - past;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatStatusLabel(status) {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ');
}

export function getPriorityColor(priority) {
  switch ((priority || '').toUpperCase()) {
    case 'URGENT':
    case 'CRITICAL':
      return { bg: '#fee2e2', text: '#991b1b', border: '#f87171' };
    case 'HIGH':
      return { bg: '#ffedd5', text: '#9a3412', border: '#fb923c' };
    case 'MEDIUM':
      return { bg: '#fef9c3', text: '#854d0e', border: '#facc15' };
    case 'LOW':
    default:
      return { bg: '#f0fdf4', text: '#166534', border: '#86efac' };
  }
}

export function getStatusColor(status) {
  switch ((status || '').toUpperCase()) {
    case 'SUBMITTED':
      return { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' };
    case 'UNDER_REVIEW':
      return { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' };
    case 'ASSIGNED':
      return { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' };
    case 'IN_PROGRESS':
      return { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' };
    case 'RESOLUTION_SUBMITTED':
    case 'AWAITING_VERIFICATION':
      return { bg: '#fef08a', text: '#713f12', border: '#eab308' };
    case 'CLOSED':
      return { bg: '#dcfce7', text: '#15803d', border: '#86efac' };
    case 'REOPENED':
      return { bg: '#ffedd5', text: '#c2410c', border: '#fb923c' };
    case 'ESCALATED':
    case 'REJECTED':
      return { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };
    default:
      return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
  }
}
