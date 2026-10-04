import React from 'react';

// icon = a lucide icon component, tone = 'total' | 'review' | 'progress' | 'resolved' | 'overdue' | 'awaiting'
export default function StatCard({ icon: Icon, value, label, tone = 'total' }) {
  return (
    <div className="card stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={26} />
      </div>
      <div>
        <p className="num">{value}</p>
        <p className="label">{label}</p>
      </div>
    </div>
  );
}
