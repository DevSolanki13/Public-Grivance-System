// icon = a lucide icon component, tone = 'total' | 'review' | 'progress' | 'resolved'
function StatCard({ icon: Icon, value, label, tone }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={26} /></div>
      <div>
        <p className="num">{value}</p>
        <p className="label">{label}</p>
      </div>
    </div>
  );
}

export default StatCard;
