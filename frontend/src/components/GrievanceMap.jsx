import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PRIORITIES } from '../data/reference';

// Priority pin color definitions
const PRIORITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#ca8a04',
  LOW: '#16a34a'
};

const STATUS_FILTERS = ['Submitted', 'In Progress', 'Resolved', 'Reopened', 'Closed', 'Rejected'];

// "Road, Sector 4, Bhayandar West" -> "Bhayandar West"
const areaOf = (location = '') => location.split(',').map((p) => p.trim()).filter(Boolean).pop() || 'Unknown area';

const DETAIL_PATH = {
  officer: '/officer/grievance/',
  citizen: '/citizen/grievance/',
  department_head: '/admin/grievance/',
  admin: '/admin/grievance/',
};

// Builds popup DOM with textContent so user-entered text can never inject HTML.
function buildPopup(g, onOpen) {
  const root = document.createElement('div');
  root.style.padding = '4px';
  const add = (tag, text, style) => {
    const el = document.createElement(tag);
    el.textContent = text;
    Object.assign(el.style, style);
    root.appendChild(el);
    return el;
  };
  add('div', g.complaintId, { fontSize: '11px', fontWeight: '700', color: '#0f2f5e' });
  add('div', g.subject, { fontSize: '13px', fontWeight: '700', color: '#0f172a', margin: '2px 0 4px' });
  add('div', `📍 ${g.location}`, { fontSize: '12px', color: '#64748b', marginBottom: '6px' });
  add('div', `${g.status} · ${g.priority}`, { fontSize: '11px', fontWeight: '600', color: '#334155', marginBottom: '8px' });
  const btn = add('button', 'View Grievance Case →', {
    width: '100%', background: '#0f2f5e', color: '#fff', border: 'none', padding: '6px 10px',
    borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
  });
  btn.type = 'button';
  btn.addEventListener('click', onOpen);
  return root;
}

const createCustomIcon = (priority = 'MEDIUM') => {
  const color = PRIORITY_COLORS[priority.toUpperCase()] || '#0f2f5e';
  const html = `
    <div style="
      background-color: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background-color: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

export default function GrievanceMap({ grievances = [], height = '520px', showHotspots = true }) {
  const { role } = useAuth();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const mappable = grievances.filter((g) => Number.isFinite(g.latitude) && Number.isFinite(g.longitude));

  // Rank areas by number of open complaints.
  const hotspotMap = grievances
    .filter((g) => g.status !== 'Closed' && g.status !== 'Rejected')
    .reduce((acc, g) => {
      const area = areaOf(g.location);
      if (!acc[area]) acc[area] = { area, count: 0, critical: 0 };
      acc[area].count += 1;
      if (g.priority === 'Critical' || g.priority === 'High') acc[area].critical += 1;
      return acc;
    }, {});
  const hotspots = Object.values(hotspotMap).sort((a, b) => b.count - a.count);

  useEffect(() => {
    if (!mapContainerRef.current) return undefined;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, { center: [19.35, 72.84], zoom: 11, zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
      markersLayerRef.current = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers on filter or data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const markersGroup = markersLayerRef.current;
    markersGroup.clearLayers();
    const bounds = [];

    grievances
      .filter((g) => Number.isFinite(g.latitude) && Number.isFinite(g.longitude))
      .filter((g) => priorityFilter === 'ALL' || g.priority.toUpperCase() === priorityFilter)
      .filter((g) => statusFilter === 'ALL' || g.status === statusFilter)
      .forEach((g) => {
        const marker = L.marker([g.latitude, g.longitude], { icon: createCustomIcon(g.priority) });
        const detailUrl = `${DETAIL_PATH[role] || DETAIL_PATH.admin}${g.id}`;
        marker.bindPopup(buildPopup(g, () => navigate(detailUrl)));
        markersGroup.addLayer(marker);
        bounds.push([g.latitude, g.longitude]);
      });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [grievances, priorityFilter, statusFilter, role, navigate]);

  return (
    <div className={showHotspots ? 'map-layout' : undefined}>
      <div className="card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        {/* Map Filter Controls */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '14px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#0f2f5e" />
            <h3 style={{ fontSize: '15px', margin: 0, fontWeight: 700 }}>Civic GIS Complaint Map</h3>
            <span
              style={{
                fontSize: '11px',
                background: '#f1f5f9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 600
              }}
            >
              {mappable.length} of {grievances.length} cases geo-tagged
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Priority Legend / Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', marginRight: '4px' }}>Priority:</span>
              {['ALL', ...PRIORITIES.map((x) => x.toUpperCase()).reverse()].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(p)}
                  style={{
                    background: priorityFilter === p ? '#0f2f5e' : '#f8fafc',
                    color: priorityFilter === p ? '#ffffff' : '#475569',
                    border: '1px solid #e2e8f0',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              aria-label="Filter by status"
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#fff'
              }}
            >
              <option value="ALL">All Statuses</option>
              {STATUS_FILTERS.map((st) => (
                <option key={st} value={st}>{st === 'Resolved' ? 'Awaiting Verification' : st}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Leaflet Map Box */}
        <div
          ref={mapContainerRef}
          style={{
            height,
            width: '100%',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            zIndex: 1
          }}
        />

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '10px',
            fontSize: '12px',
            color: '#64748b'
          }}
        >
          <span style={{ fontWeight: 600 }}>Pin Colors:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }} /> Critical
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ea580c' }} /> High
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ca8a04' }} /> Medium
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16a34a' }} /> Low
          </span>
        </div>
      </div>

      {/* Hotspots Analysis Sidebar */}
      {showHotspots && (
        <div className="card" style={{ padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Flame size={18} color="#ea580c" />
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Civic Hotspot Zones</h4>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px', lineHeight: 1.4 }}>
            Areas ranked by open complaints needing municipal attention:
          </p>
          {hotspots.length === 0 && <p className="muted" style={{ fontSize: '12px' }}>No open complaints.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {hotspots.slice(0, 5).map((h, idx) => (
              <div
                key={h.area}
                style={{
                  background: idx === 0 ? '#fff7ed' : '#f8fafc',
                  border: `1px solid ${idx === 0 ? '#fed7aa' : '#e2e8f0'}`,
                  borderRadius: '8px',
                  padding: '10px 12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{h.area}</strong>
                  <span
                    style={{
                      background: idx === 0 ? '#ea580c' : '#0f2f5e',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 7px',
                      borderRadius: '999px'
                    }}
                  >
                    {h.count} cases
                  </span>
                </div>
                {h.critical > 0 && (
                  <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
                    ⚠ {h.critical} high/critical priority
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
