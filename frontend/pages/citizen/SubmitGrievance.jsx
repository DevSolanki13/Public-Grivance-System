import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout';
import PhotoUploader from '../../components/common/PhotoUploader';
import api from '../../api/index.js';
import { MapPin } from 'lucide-react';

const CATEGORIES = [
  'Roads & Infrastructure',
  'Water Supply & Sewage',
  'Sanitation & Solid Waste',
  'Street Lighting & Electricity',
];

const emptyForm = {
  category: '',
  subject: '',
  description: '',
  location: '',
  priority: 'MEDIUM',
};

export default function SubmitGrievance() {
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({
    ...emptyForm,
    category: searchParams.get('category') || '',
  });
  const [files, setFiles] = useState([]);
  const [complaintId, setComplaintId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleDetectGPS = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`;
          setForm((prev) => ({
            ...prev,
            location: prev.location ? `${prev.location} (${coords})` : coords,
          }));
        },
        () => {
          setError('Could not access device location. Please enter location manually.');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.subject.trim() || !form.description.trim() || !form.location.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('categoryId', form.category);
      formData.append('subject', form.subject.trim());
      formData.append('description', form.description.trim());
      formData.append('address', form.location.trim());
      formData.append('area', form.location.trim());
      formData.append('priority', form.priority);

      files.forEach((file) => {
        formData.append('evidence', file);
      });

      const res = await api.createGrievance(formData);
      if (res.success && res.grievance) {
        setComplaintId(res.grievance.complaintId);
      } else {
        setError(res.message || 'Submission failed.');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit grievance.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setForm(emptyForm);
    setFiles([]);
    setComplaintId('');
  };

  return (
    <PageLayout
      role="citizen"
      title="Submit a grievance"
      subtitle="Fields marked * are required."
      width="narrow"
    >
      {complaintId ? (
        <div className="card success-box" style={{ textAlign: 'center', padding: '36px 20px' }}>
          <h2>Grievance submitted</h2>
          <p className="big-id" style={{ fontSize: 28, fontWeight: 700, margin: '14px 0', color: 'var(--brand-dark)' }}>
            {complaintId}
          </p>
          <p className="muted" style={{ marginBottom: 20 }}>Use this ID to track your grievance.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/citizen/my-grievances" className="btn btn-primary">View my grievances</Link>
            <button type="button" className="btn btn-outline" onClick={reset}>Submit another</button>
          </div>
        </div>
      ) : (
        <form className="card" onSubmit={handleSubmit}>
          {error && <p className="error-msg" style={{ marginBottom: 14 }}>{error}</p>}

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              required
              value={form.category}
              onChange={handleChange}
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject *</label>
            <input
              id="subject"
              name="subject"
              required
              value={form.subject}
              onChange={handleChange}
              placeholder="e.g. Street light not working"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              required
              value={form.description}
              onChange={handleChange}
              placeholder="What is wrong, and since when?"
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label htmlFor="location" style={{ margin: 0 }}>Location *</label>
              <button
                type="button"
                onClick={handleDetectGPS}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand-dark)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontFamily: 'inherit',
                }}
              >
                <MapPin size={13} /> Detect GPS
              </button>
            </div>
            <input
              id="location"
              name="location"
              required
              value={form.location}
              onChange={handleChange}
              placeholder="Area or landmark"
            />
          </div>

          {/* Photo Evidence with Device Upload and Camera Capture */}
          <PhotoUploader
            files={files}
            onChange={setFiles}
            label="Photo evidence (optional)"
            required={false}
            maxFiles={5}
          />

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit grievance'}
          </button>
        </form>
      )}
    </PageLayout>
  );
}
