// Small coloured pill. "In Progress" -> class "badge-in-progress"
function StatusBadge({ status }) {
  const cls = 'badge badge-' + status.toLowerCase().replace(/\s+/g, '-');
  return <span className={cls}>{status}</span>;
}

export default StatusBadge;
