import React from 'react';
import { BarChart3, PieChart, TrendingUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

export default function AnalyticsCharts({ grievances = [] }) {
  // Aggregate Category Breakdown
  const categoryCounts = grievances.reduce((acc, g) => {
    const cat = g.category || 'General';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const totalCases = grievances.length || 1;
  const categoriesList = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    count,
    percentage: Math.round((count / totalCases) * 100)
  }));

  // Aggregate Department Performance
  const departmentsData = [
    { name: 'Waste Management', total: 18, resolved: 15, slaRate: 92, avgTime: '28h' },
    { name: 'Roads & Infrastructure', total: 24, resolved: 18, slaRate: 84, avgTime: '46h' },
    { name: 'Water Supply', total: 12, resolved: 11, slaRate: 95, avgTime: '18h' },
    { name: 'Street Lighting & Power', total: 10, resolved: 9, slaRate: 89, avgTime: '22h' }
  ];

  // Colors for charts
  const palette = ['#0f766e', '#0284c7', '#ea580c', '#ca8a04', '#7c3aed', '#db2777'];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', margin: '20px 0' }}>
      {/* 1. Category Distribution Card */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <PieChart size={18} color="#0f766e" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Complaints by Category</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {categoriesList.map((item, i) => (
            <div key={item.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>{item.name}</span>
                <span style={{ color: '#64748b', fontWeight: 700 }}>
                  {item.count} cases ({item.percentage}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${item.percentage}%`,
                    height: '100%',
                    background: palette[i % palette.length],
                    borderRadius: '4px',
                    transition: 'width 0.4s ease'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Department SLA Performance Matrix */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <BarChart3 size={18} color="#0284c7" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Department SLA Compliance</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {departmentsData.map((dept) => (
            <div key={dept.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{dept.name}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                    ({dept.resolved}/{dept.total} resolved)
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: dept.slaRate >= 90 ? '#16a34a' : dept.slaRate >= 80 ? '#ca8a04' : '#dc2626'
                  }}
                >
                  {dept.slaRate}% on-time
                </span>
              </div>

              <div style={{ width: '100%', height: '10px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${dept.slaRate}%`,
                    height: '100%',
                    background:
                      dept.slaRate >= 90 ? '#10b981' : dept.slaRate >= 80 ? '#f59e0b' : '#ef4444',
                    borderRadius: '5px'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Civic Resolution Speed & Inflow Trends */}
      <div className="card" style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingUp size={18} color="#ea580c" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Monthly Resolution Velocity</h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#166534' }}>91.4%</div>
            <div style={{ fontSize: '11px', color: '#15803d', fontWeight: 600 }}>Overall SLA</div>
          </div>
          <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#1e40af' }}>31h</div>
            <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 600 }}>Avg Turnaround</div>
          </div>
          <div style={{ background: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fef3c7' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: '#92400e' }}>4.8 ★</div>
            <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>Citizen Rating</div>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5, background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
          ✓ <strong>88%</strong> of urgent/critical sanitation complaints resolved within the mandatory 24-hour civic window.
        </div>
      </div>
    </div>
  );
}
