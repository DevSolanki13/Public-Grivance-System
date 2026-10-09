import PageLayout from '../components/PageLayout';
import GrievanceMap from '../components/GrievanceMap';
import { useGrievances } from '../hooks/useGrievances';

// Staff-only map of the grievances visible to the signed-in user.
export default function GISMapPage() {
  const { grievances, loading, error } = useGrievances();

  return (
    <PageLayout
      title="Civic GIS Map & Hotspot Intelligence"
      subtitle="Geographic tracking of municipal complaints, priority clusters, and resolution density."
    >
      {error && <p className="error-msg" role="alert">{error}</p>}
      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>
          <p className="muted">Loading geospatial grievance data...</p>
        </div>
      ) : (
        <GrievanceMap grievances={grievances} height="600px" showHotspots />
      )}
    </PageLayout>
  );
}
