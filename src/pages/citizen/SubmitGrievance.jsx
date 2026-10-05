import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Camera, UploadCloud, X, Check, Image as ImageIcon, Navigation, MapPin, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import PageLayout from '../../components/PageLayout';
import { useAuth } from '../../components/ProtectedRoute';
import { CATEGORIES, SAMPLE_PROBLEM_PHOTOS, CATEGORY_DEPARTMENT_MAP } from '../../data/mockData';
import { grievanceService } from '../../services/grievanceService';
import { notificationService } from '../../services/notificationService';

const emptyForm = {
  category: '',
  subject: '',
  description: '',
  location: '',
  imageUrl: '',
};

function SubmitGrievance() {
  const { user, profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    ...emptyForm,
    category: searchParams.get('category') || '',
  });
  const [coords, setCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Duplicate detection state
  const [existingGrievances, setExistingGrievances] = useState([]);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  useEffect(() => {
    grievanceService.getGrievances().then(setExistingGrievances).catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.category || (!form.location && !coords)) {
      setDuplicateWarning(null);
      return;
    }

    const similar = existingGrievances.find((g) => {
      if (g.status === 'CLOSED' || g.status === 'REJECTED') return false;
      const catMatch = (g.category || '').toLowerCase() === form.category.toLowerCase();
      if (!catMatch) return false;

      if (coords?.latitude && g.location?.latitude) {
        const latDiff = Math.abs(coords.latitude - g.location.latitude);
        const lonDiff = Math.abs(coords.longitude - g.location.longitude);
        if (latDiff < 0.008 && lonDiff < 0.008) return true;
      }

      if (form.location && (g.location?.address || g.location?.area)) {
        const locA = form.location.toLowerCase();
        const locB = (g.location.address || g.location.area || '').toLowerCase();
        const words = locA.split(/[\s,]+/).filter((w) => w.length >= 4);
        const matchCount = words.filter((w) => locB.includes(w)).length;
        if (matchCount >= 2) return true;
      }

      return false;
    });

    setDuplicateWarning(similar || null);
  }, [form.category, form.location, coords, existingGrievances]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'category' && !prev.imageUrl) {
        const match = SAMPLE_PROBLEM_PHOTOS.find((p) => p.category === value);
        if (match) {
          updated.imageUrl = match.url;
        }
      }
      return updated;
    });
  };

  // Detect Current Location using Geolocation API + Reverse Geocoding
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLocating(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const acc = Math.round(position.coords.accuracy || 15);
        setCoords({ latitude: lat, longitude: lon, accuracy: acc });

        try {
          // Reverse geocode via OpenStreetMap
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          if (res.ok) {
            const data = await res.json();
            const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || '';
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
            const postcode = data.address?.postcode ? `, ${data.address.postcode}` : '';
            const state = data.address?.state || '';

            const formattedAddress = [road, city, state].filter(Boolean).join(', ') + postcode;
            setForm((prev) => ({
              ...prev,
              location: formattedAddress || data.display_name?.slice(0, 75) || `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`,
            }));
          } else {
            setForm((prev) => ({
              ...prev,
              location: `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
            }));
          }
        } catch {
          setForm((prev) => ({
            ...prev,
            location: `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          }));
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        console.warn('Geolocation permission or error, using demo position:', err);
        setLocating(false);
        // Fallback for local testing or when browser permission is denied
        const demoAddress = 'Global City, Avenue D, Virar West, Palghar - 401303';
        setForm((prev) => ({
          ...prev,
          location: demoAddress,
        }));
        setCoords({ latitude: 19.4521, longitude: 72.8012, accuracy: 12 });
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleSelectPresetArea = (areaName, lat, lon) => {
    setForm((prev) => ({ ...prev, location: areaName }));
    setCoords({ latitude: lat, longitude: lon, accuracy: 10 });
  };

  // Handle local image file upload (converts to DataURL for immediate preview & persistence)
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({ ...prev, imageUrl: event.target.result }));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSamplePhoto = (url) => {
    setForm((prev) => ({ ...prev, imageUrl: url }));
    setError('');
  };

  const handleRemovePhoto = () => {
    setForm((prev) => ({ ...prev, imageUrl: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.imageUrl) {
      setError('Please upload or select a photo of the problem/item to be fixed.');
      return;
    }

    setSubmitting(true);
    try {
      const department = CATEGORY_DEPARTMENT_MAP[form.category] || '';
      const payload = {
        ...form,
        department,
        coordinates: coords,
      };

      const created = await grievanceService.createGrievance(payload, user, profile);
      setComplaintId(created.complaintId);

      // Trigger Civic Notifications
      notificationService.addNotification({
        role: 'department_head',
        title: 'New Citizen Grievance Filed',
        message: `New case ${created.complaintId || created.id} reported for ${form.category} in ${form.location}. Pending assignment.`,
        grievanceId: created.complaintId || created.id,
        link: `/admin/grievance/${created.complaintId || created.id}`,
        type: 'assignment'
      });

      notificationService.addNotification({
        role: 'citizen',
        title: 'Grievance Submitted Successfully',
        message: `Your grievance ${created.complaintId || created.id} has been registered with photo evidence.`,
        grievanceId: created.complaintId || created.id,
        link: `/citizen/grievance/${created.complaintId || created.id}`,
        type: 'info'
      });
    } catch (err) {
      console.error(err);
      setError('Could not submit grievance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setCoords(null);
    setComplaintId('');
  };

  return (
    <PageLayout
      role="citizen"
      title="Submit a Grievance"
      subtitle="Report an issue to municipal authorities with photo evidence and location."
      width="narrow"
    >
      {complaintId ? (
        <div className="card success-box">
          <h2>Grievance Registered Successfully</h2>
          <p className="big-id">{complaintId}</p>
          <p className="muted" style={{ marginBottom: 20 }}>
            Your complaint with evidence has been submitted to the triage queue. Authorities will review and assign a field officer.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/citizen/my-grievances" className="btn btn-primary">
              Track My Grievances
            </Link>
            <button type="button" className="btn btn-outline" onClick={reset}>
              Submit Another Request
            </button>
          </div>
        </div>
      ) : (
        <form className="card" onSubmit={handleSubmit}>
          {error && <p className="error-msg">{error}</p>}

          {/* Duplicate Grievance Alert */}
          {duplicateWarning && (
            <div
              style={{
                background: '#fffbeb',
                border: '1.5px solid #fde68a',
                borderRadius: '10px',
                padding: '14px 16px',
                marginBottom: '20px',
                display: 'flex',
                gap: '12px'
              }}
            >
              <AlertTriangle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '13px', color: '#92400e', lineHeight: 1.4 }}>
                <strong>Notice: Similar Grievance Already Reported Nearby</strong>
                <div style={{ margin: '4px 0 6px', color: '#78350f' }}>
                  <strong>{duplicateWarning.id || duplicateWarning.grievanceId}</strong>: "{duplicateWarning.title || duplicateWarning.subject}" (Status: {duplicateWarning.status?.replace(/_/g, ' ')}) in {duplicateWarning.location?.area || duplicateWarning.location?.address}.
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                  <Link
                    to={`/citizen/grievance/${duplicateWarning.id || duplicateWarning.grievanceId}`}
                    target="_blank"
                    style={{ color: '#b45309', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  >
                    View existing grievance <ExternalLink size={12} />
                  </Link>
                  <span style={{ color: '#a16207', fontSize: '12px' }}>
                    • You can still proceed if this is an additional problem.
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              required
              value={form.category}
              onChange={handleChange}
            >
              <option value="">Select issue category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject / Title *</label>
            <input
              id="subject"
              name="subject"
              required
              value={form.subject}
              onChange={handleChange}
              placeholder="e.g. Broken streetlight or Deep pothole"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Detailed Description *</label>
            <textarea
              id="description"
              name="description"
              required
              value={form.description}
              onChange={handleChange}
              placeholder="Explain what is broken or damaged, since when, and the safety hazards..."
            />
          </div>

          {/* Location Field with GPS Auto-Detect Button */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
              <label htmlFor="location" style={{ margin: 0 }}>
                Exact Location / Address *
              </label>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={locating}
                className="btn btn-outline"
                style={{
                  fontSize: '0.8rem',
                  padding: '4px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  borderRadius: 999,
                  background: '#eef3fa',
                  borderColor: 'var(--accent-dark)',
                  color: 'var(--accent-dark)',
                }}
                title="Detect your device coordinates automatically"
              >
                {locating ? (
                  <Loader2 size={13} className="spin-icon" />
                ) : (
                  <Navigation size={13} />
                )}
                <span>{locating ? 'Acquiring GPS...' : 'Use Current Location'}</span>
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                id="location"
                name="location"
                required
                value={form.location}
                onChange={handleChange}
                placeholder="Street name, landmark, area, or sector"
                style={{ paddingRight: coords ? 36 : 12 }}
              />
              {coords && (
                <MapPin
                  size={18}
                  color="var(--accent-dark)"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                />
              )}
            </div>

            {/* GPS Lock Badge */}
            {coords && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  background: '#effaf4',
                  border: '1px solid #b7e8cd',
                  color: '#14603c',
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  marginTop: 6,
                  fontWeight: 600,
                }}
              >
                <Check size={13} />
                <span>
                  GPS Tagged: {coords.latitude.toFixed(4)}° N, {coords.longitude.toFixed(4)}° E (Accuracy &plusmn;{coords.accuracy}m)
                </span>
              </div>
            )}

            {/* Quick Demo Location Presets */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
              <span className="muted" style={{ fontSize: '0.78rem', fontWeight: 600 }}>Quick Select:</span>
              <button
                type="button"
                className="pill-btn"
                style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                onClick={() => handleSelectPresetArea('Global City, Avenue D, Virar West - 401303', 19.4521, 72.8012)}
              >
                📍 Global City, Virar
              </button>
              <button
                type="button"
                className="pill-btn"
                style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                onClick={() => handleSelectPresetArea('Station Road, Market Area, Bhayandar West - 401101', 19.3012, 72.8521)}
              >
                📍 Station Rd, Bhayandar
              </button>
              <button
                type="button"
                className="pill-btn"
                style={{ fontSize: '0.74rem', padding: '3px 8px' }}
                onClick={() => handleSelectPresetArea('Shanti Park, Sector 5, Mira Road East - 401107', 19.2814, 72.8689)}
              >
                📍 Mira Road East
              </button>
            </div>
          </div>

          {/* Citizen Photo Upload (Required) */}
          <div className="form-group" style={{ marginTop: 22 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Photo of the Issue to be Fixed / Replaced <span style={{ color: '#c44018' }}>*</span>
              </span>
              <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>
                Required for field verification
              </span>
            </label>

            {form.imageUrl ? (
              <div
                style={{
                  position: 'relative',
                  border: '2px solid var(--accent)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  background: '#f9fbfb',
                  padding: 8,
                  marginTop: 6,
                }}
              >
                <div style={{ position: 'relative', width: '100%', maxHeight: 260, overflow: 'hidden', borderRadius: 6 }}>
                  <img
                    src={form.imageUrl}
                    alt="Problem to be fixed"
                    style={{ width: '100%', height: 'auto', maxHeight: 260, objectFit: 'cover', display: 'block' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title="Remove Photo"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--green)', fontSize: '0.86rem', fontWeight: 700 }}>
                  <Check size={16} /> Photo attached: Ready for officer investigation
                </div>
              </div>
            ) : (
              <div
                style={{
                  border: '2px dashed var(--line)',
                  borderRadius: 10,
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#fafcfb',
                  marginTop: 6,
                }}
              >
                <Camera size={34} color="var(--accent-dark)" style={{ margin: '0 auto 8px', display: 'block' }} />
                <p style={{ fontWeight: 700, marginBottom: 4 }}>Upload Photo of Broken / Damaged Item</p>
                <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 14 }}>
                  Take a clear photo showing the item, defect, and surrounding area.
                </p>

                <label
                  htmlFor="file-upload"
                  className="btn btn-outline"
                  style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}
                >
                  <UploadCloud size={16} /> Choose Image File
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                {/* Instant Sample Photos for Quick Demo */}
                <div style={{ marginTop: 18, borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                  <p className="muted" style={{ fontSize: '0.8rem', marginBottom: 8, fontWeight: 600 }}>
                    ⚡ Or select a demo problem photo:
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {SAMPLE_PROBLEM_PHOTOS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        className="pill-btn"
                        style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                        onClick={() => handleSelectSamplePhoto(p.url)}
                      >
                        <ImageIcon size={12} style={{ marginRight: 4, verticalAlign: '-1px' }} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
            style={{ marginTop: 24 }}
          >
            {submitting ? 'Submitting Grievance & Evidence...' : 'Submit Grievance with Photo'}
          </button>
        </form>
      )}
    </PageLayout>
  );
}

export default SubmitGrievance;
