import { BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { countBy, departmentPerformance, summarize } from '../utils/analytics';

const cardStyle = { padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' };
const palette = ['#0f2f5e', '#0284c7', '#ea580c', '#ca8a04', '#7c3aed', '#db2777', '#0d9488'];

const slaColor = (rate) => (rate == null ? '#94a3b8' : rate >= 90 ? '#16a34a' : rate >= 80 ? '#ca8a04' : '#dc2626');
const slaBar = (rate) => (rate == null ? '#cbd5e1' : rate >= 90 ? '#10b981' : rate >= 80 ? '#f59e0b' : '#ef4444');

// All figures are computed from the grievances passed in — nothing is hardcoded.
export default function AnalyticsCharts({ grievances = [] }) {
  const categories = countBy(grievances, 'category');
  const departments = departmentPerformance(grievances);
  const stats = summarize(grievances);

  if (grievances.length === 0) {
    return (
      <div className="card" style={{ ...cardStyle, margin: '20px 0', textAlign: 'center' }}>
        <p className="muted">No grievance data yet — analytics will appear once complaints are filed.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', margin: '20px 0' }}>
      {/* 1. Category Distribution */}
      <div className="card" style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <PieChart size={18} color="#0f2f5e" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Complaints by Category</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categories.map((item, i) => (
            <div key={item.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>{item.name}</span>
                <span style={{ color: '#64748b', fontWeight: 700 }}>
                  {item.count} {item.count === 1 ? 'case' : 'cases'} ({item.percentage}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${item.percentage}%`, height: '100%', background: palette[i % palette.length], borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Department SLA Performance */}
      <div className="card" style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BarChart3 size={18} color="#0284c7" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Department SLA Compliance</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {departments.map((dept) => (
            <div key={dept.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', gap: 8 }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{dept.name}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                    ({dept.resolved}/{dept.total} resolved)
                  </span>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: slaColor(dept.slaRate), whiteSpace: 'nowrap' }}>
                  {dept.slaRate == null ? 'No resolutions yet' : `${dept.slaRate}% on-time`}
                </span>
              </div>
              <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                <div style={{ width: `${dept.slaRate ?? 0}%`, height: '100%', background: slaBar(dept.slaRate), borderRadius: '5px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Resolution speed & satisfaction */}
      <div className="card" style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingUp size={18} color="#ea580c" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Resolution Performance</h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#166534' }}>{stats.slaRate == null ? '—' : `${stats.slaRate}%`}</div>
            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>Overall SLA</div>
          </div>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e40af' }}>{stats.avgResolutionHours == null ? '—' : `${stats.avgResolutionHours}h`}</div>
            <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 600 }}>Avg Turnaround</div>
          </div>
          <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#92400e' }}>{stats.avgRating == null ? '—' : `${stats.avgRating} ★`}</div>
            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>Citizen Rating</div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
          {stats.closed} of {stats.total} complaints verified &amp; closed by citizens · {stats.rejected} rejected · {stats.overdue} currently past SLA.
        </div>
      </div>
    </div>
  );
}
