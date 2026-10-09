// Small coloured pill. "In Progress" -> class "badge-in-progress"
function StatusBadge({ status = '' }) {
  const label = status === 'Resolved' ? 'Awaiting Verification' : status;
  const cls = 'badge badge-' + status.toLowerCase().replace(/\s+/g, '-');
  return <span className={cls}>{label}</span>;
}

export default StatusBadge;
