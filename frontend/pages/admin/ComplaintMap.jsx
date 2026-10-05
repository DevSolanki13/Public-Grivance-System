import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import api from '../../api/index.js';
import StatusBadge from '../../components/common/StatusBadge';
import PriorityBadge from '../../components/common/PriorityBadge';
import SLABadge from '../../components/common/SLABadge';
import { MapPin, ArrowLeft, ExternalLink, Navigation, Layers } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function ComplaintMap() {
  const [markers, setMarkers] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Load map data
  useEffect(() => {
    async function loadMapData() {
      setLoading(true);
      setError('');
      try {
        const res = await api.getMapMarkers();
        if (res.success) {
          const list = res.markers || [];
          setMarkers(list);
          if (list.length > 0) {
            setSelectedMarker(list[0]);
          }
        }
      } catch (err) {
        console.warn('Map load error:', err);
        setError('Unable to load GIS complaint coordinates. Please verify API connection.');
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, []);

  // Filter markers based on priority
  const filteredMarkers = markers.filter((m) => {
    if (filterPriority === 'ALL') return true;
    return (m.priority || '').toUpperCase() === filterPriority;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Default center around municipal region
      const initialLat = 19.3012;
      const initialLng = 72.8519;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });

      // Use CartoDB Voyager or OpenStreetMap tiles for clean, crisp civic display
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const markersGroup = L.featureGroup().addTo(map);
      mapInstanceRef.current = map;
      markersLayerRef.current = markersGroup;

      // Fix Leaflet tile loading glitch on resize
      setTimeout(() => {
        map.invalidateSize();
      }, 250);
    }

    return () => {
      // Clean up map instance on component unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
      }
    };
  }, []);

  // Update Markers when filteredMarkers or selectedMarker changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds = [];

    filteredMarkers.forEach((m, idx) => {
      const lat = Number(m.latitude) || 19.3012;
      const lng = Number(m.longitude) || 72.8519;
      bounds.push([lat, lng]);

      const isSelected = selectedMarker?.id === m.id;
      const pinColor = isSelected ? '#0b3d3b' : m.color || '#0284c7';

      // Custom Leaflet DivIcon with styled municipal marker
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            background: ${pinColor};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #ffffff;
            box-shadow: ${isSelected ? '0 6px 16px rgba(0,0,0,0.45)' : '0 3px 8px rgba(0,0,0,0.3)'};
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <span style="
              transform: rotate(45deg);
              color: #ffffff;
              font-family: Mukta, sans-serif;
              font-weight: 800;
              font-size: ${isSelected ? '13px' : '11px'};
              line-height: 1;
            ">${idx + 1}</span>
          </div>
        `,
        iconSize: [isSelected ? 38 : 32, isSelected ? 38 : 32],
        iconAnchor: [isSelected ? 19 : 16, isSelected ? 38 : 32],
        popupAnchor: [0, isSelected ? -38 : -32],
      });

      const leafletMarker = L.marker([lat, lng], { icon: customIcon });

      // Click event on marker updates state
      leafletMarker.on('click', () => {
        setSelectedMarker(m);
      });

      // Marker Tooltip
      leafletMarker.bindTooltip(
        `<div style="font-family: Mukta, sans-serif; font-size: 12px; font-weight: 700; color: #0b3d3b;">
          <strong>#${idx + 1}</strong> ${m.complaintId}: ${m.subject}
        </div>`,
        { direction: 'top', offset: [0, -25] }
      );

      markersGroup.addLayer(leafletMarker);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [filteredMarkers, selectedMarker]);

  // Recenter map on selected marker
  const handleRecenter = () => {
    if (mapInstanceRef.current && selectedMarker) {
      const lat = Number(selectedMarker.latitude) || 19.3012;
      const lng = Number(selectedMarker.longitude) || 72.8519;
      mapInstanceRef.current.setView([lat, lng], 16, { animate: true });
    }
  };

  return (
    <PageLayout
      title="Interactive Municipal Grievance Map"
      subtitle="Geographical GIS tracking of civic infrastructure breakdowns, potholes, and sanitation alerts"
      action={
        <Link
          to="/admin/dashboard"
          className="btn btn-outline"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white', borderColor: 'rgba(255,255,255,0.4)', fontSize: 13 }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      }
    >
      {error && <p className="error-msg">{error}</p>}
      {/* Priority Legend & Filter Bar */}
      <div className="card" style={{ padding: '14px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Filter Priority:</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`chip-btn ${filterPriority === p ? 'active' : ''}`}
                  onClick={() => setFilterPriority(p)}
                  style={{ fontSize: 12, padding: '5px 12px' }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: '#ef4444' }}>●</span> Critical</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: '#f97316' }}>●</span> High</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: '#eab308' }}>●</span> Medium</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ color: '#10b981' }}>●</span> Low</span>
          </div>
        </div>
      </div>

      {/* Map Layout Grid: Real Leaflet Map + Detail Inspector Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Real OpenStreetMap Container */}
        <div
          className="card"
          style={{
            minHeight: 560,
            padding: 0,
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 'var(--radius)',
            border: '2px solid var(--border)',
            boxShadow: 'var(--shadow)',
          }}
        >
          {loading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(255,255,255,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--ink)'
            }}>
              Loading municipal GIS data...
            </div>
          )}

          {/* Map canvas */}
          <div
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%', minHeight: 560, zIndex: 1 }}
          />

          {/* Quick Recenter Button on Map */}
          {selectedMarker && (
            <button
              type="button"
              onClick={handleRecenter}
              style={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                zIndex: 900,
                background: 'white',
                border: '1px solid #cbd5e1',
                padding: '8px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                cursor: 'pointer',
              }}
            >
              <Navigation size={13} color="var(--primary)" />
              Focus on #{selectedMarker.complaintId}
            </button>
          )}
        </div>

        {/* Selected Marker Inspector Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {selectedMarker ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>
                  {selectedMarker.complaintId}
                </span>
                <PriorityBadge priority={selectedMarker.priority} />
              </div>

              <h4 style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)', marginBottom: 6, lineHeight: 1.3 }}>
                {selectedMarker.subject}
              </h4>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-soft)', marginBottom: 16 }}>
                <MapPin size={15} color="var(--primary)" />
                {selectedMarker.address || selectedMarker.area}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--paper)', padding: 14, borderRadius: 8, marginBottom: 20, border: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Department</span>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{selectedMarker.department}</div>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Status</span>
                  <div style={{ marginTop: 4 }}><StatusBadge status={selectedMarker.status} /></div>
                </div>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: 0.5 }}>SLA Target</span>
                  <div style={{ marginTop: 4 }}><SLABadge slaInfo={selectedMarker.slaInfo} /></div>
                </div>
              </div>

              <Link
                to={`/citizen/grievance/${selectedMarker.id}`}
                className="btn btn-primary btn-block"
                style={{ fontSize: 13, justifyContent: 'center' }}
              >
                Inspect Full Case Details <ExternalLink size={14} />
              </Link>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--ink-soft)' }}>
              <MapPin size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600 }}>Click any marker on the map to inspect case details and SLA targets.</p>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
