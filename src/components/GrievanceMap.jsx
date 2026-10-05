import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Filter, Layers, AlertCircle, ArrowUpRight, Flame } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Priority pin color definitions
const PRIORITY_COLORS = {
  CRITICAL: '#dc2626',
  HIGH: '#ea580c',
  MEDIUM: '#ca8a04',
  LOW: '#16a34a'
};

const createCustomIcon = (priority = 'MEDIUM') => {
  const color = PRIORITY_COLORS[priority.toUpperCase()] || '#0f766e';
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
  const { currentRole } = useAuth();
  const navigate = useNavigate();
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Compute hotspots from grievance data
  const hotspotMap = grievances.reduce((acc, g) => {
    const area = g.location?.area || g.location?.address || 'City Center';
    if (!acc[area]) {
      acc[area] = { area, count: 0, critical: 0, grievances: [] };
    }
    acc[area].count += 1;
    if (g.priority === 'CRITICAL' || g.priority === 'HIGH') {
      acc[area].critical += 1;
    }
    acc[area].grievances.push(g);
    return acc;
  }, {});

  const hotspots = Object.values(hotspotMap).sort((a, b) => b.count - a.count);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center: Vasai-Virar / Mumbai suburban coords
    const defaultCenter = [19.456, 72.808];

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: true,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      const markersGroup = L.featureGroup().addTo(map);
      markersLayerRef.current = markersGroup;
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

    const filtered = grievances.filter((g) => {
      const matchesPriority =
        priorityFilter === 'ALL' || (g.priority || 'MEDIUM').toUpperCase() === priorityFilter;
      const matchesStatus = statusFilter === 'ALL' || g.status === statusFilter;
      return matchesPriority && matchesStatus;
    });

    const bounds = [];

    filtered.forEach((g) => {
      const lat = parseFloat(g.location?.latitude || 19.456);
      const lng = parseFloat(g.location?.longitude || 72.808);

      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], {
        icon: createCustomIcon(g.priority)
      });

      const detailUrl =
        currentRole === 'officer'
          ? `/officer/grievance/${g.id || g.grievanceId}`
          : currentRole === 'citizen'
          ? `/citizen/grievance/${g.id || g.grievanceId}`
          : `/admin/grievance/${g.id || g.grievanceId}`;

      const popupContent = document.createElement('div');
      popupContent.style.fontFamily = 'inherit';
      popupContent.style.padding = '4px';
      popupContent.innerHTML = `
        <div style="font-size: 11px; font-weight: 700; color: #0f766e; text-transform: uppercase;">
          ${g.id || g.grievanceId}
        </div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin: 2px 0 4px;">
          ${g.title || g.subject || 'Civic Issue'}
        </div>
        <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">
          📍 ${g.location?.area || g.location?.address || 'Global City'}
        </div>
        <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 8px;">
          <span style="
            background: #e2e8f0; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-size: 10px; 
            font-weight: 600; 
            color: #334155;
          ">
            ${g.status?.replace(/_/g, ' ') || 'UNDER_REVIEW'}
          </span>
          <span style="
            background: ${PRIORITY_COLORS[g.priority?.toUpperCase()] || '#0f766e'}; 
            color: #fff; 
            padding: 2px 6px; 
            border-radius: 4px; 
            font-size: 10px; 
            font-weight: 700;
          ">
            ${g.priority || 'MEDIUM'}
          </span>
        </div>
        <button id="btn-${g.id || g.grievanceId}" style="
          width: 100%;
          background: #0f766e;
          color: white;
          border: none;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        ">
          View Grievance Case →
        </button>
      `;

      popupContent.querySelector(`#btn-${g.id || g.grievanceId}`)?.addEventListener('click', () => {
        navigate(detailUrl);
      });

      marker.bindPopup(popupContent);
      markersGroup.addLayer(marker);
      bounds.push([lat, lng]);
    });

    if (bounds.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [grievances, priorityFilter, statusFilter, currentRole, navigate]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: showHotspots ? '1fr 320px' : '1fr', gap: '20px' }}>
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
            <MapPin size={18} color="#0f766e" />
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
              {grievances.length} cases plotted
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Priority Legend / Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '12px', color: '#64748b', marginRight: '4px' }}>Priority:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(p)}
                  style={{
                    background: priorityFilter === p ? '#0f766e' : '#f8fafc',
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
              <option value="SUBMITTED">Submitted</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="AWAITING_VERIFICATION">Awaiting Verification</option>
              <option value="CLOSED">Resolved & Closed</option>
              <option value="REOPENED">Reopened</option>
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
            Geographic density ranking of reported complaints needing municipal attention:
          </p>

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
                      background: idx === 0 ? '#ea580c' : '#0f766e',
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
