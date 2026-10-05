import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import GrievanceMap from '../components/GrievanceMap';
import { grievanceService } from '../services/grievanceService';

export default function GISMapPage() {
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await grievanceService.getGrievances();
        setGrievances(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PageLayout
      title="Civic GIS Map & Hotspot Intelligence"
      subtitle="Geographic tracking of municipal complaints, priority clusters, and resolution density."
    >
      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
          <p className="muted">Loading geospatial grievance data...</p>
        </div>
      ) : (
        <GrievanceMap grievances={grievances} height="600px" showHotspots={true} />
      )}
    </PageLayout>
  );
}
