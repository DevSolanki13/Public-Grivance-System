import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, RefreshCw, AlertCircle, Check } from 'lucide-react';

export default function PhotoUploader({
  files = [],
  onChange,
  label = 'Photos / Evidence',
  maxFiles = 5,
  required = false,
}) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);

  // Stop camera stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to mobile camera input
        mobileCameraInputRef.current?.click();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      // Connect stream to video element once state updates
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((err) => console.warn('Video play error:', err));
        }
      }, 100);
    } catch (err) {
      console.warn('Webcam permission or device error:', err);
      // Fallback to native device camera dialog
      if (mobileCameraInputRef.current) {
        mobileCameraInputRef.current.click();
      } else {
        setCameraError('Camera access not permitted. Please upload photos from device.');
      }
    }
  };

  const handleCloseCamera = () => {
    stopCameraStream();
    setIsCameraOpen(false);
    setCameraError('');
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    setCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const capturedFile = new File(
              [blob],
              `camera_snap_${Date.now()}.jpg`,
              { type: 'image/jpeg' }
            );

            // Add to files list
            if (files.length < maxFiles) {
              onChange([...files, capturedFile]);
            }
          }
          setCapturing(false);
          handleCloseCamera();
        },
        'image/jpeg',
        0.92
      );
    } catch (err) {
      console.error('Frame capture error:', err);
      setCapturing(false);
      handleCloseCamera();
    }
  };

  const handleFilesChosen = (e) => {
    const selected = Array.from(e.target.files);
    if (!selected.length) return;

    const availableSlots = maxFiles - files.length;
    const filesToAdd = selected.slice(0, availableSlots);
    onChange([...files, ...filesToAdd]);

    // Reset input
    e.target.value = '';
  };

  const handleRemovePhoto = (indexToRemove) => {
    const updated = files.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="photo-uploader-component" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
          {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
        </label>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>
          {files.length}/{maxFiles} attached
        </span>
      </div>

      {/* Action Buttons: Upload Files or Click Photo */}
      {!isCameraOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          {/* Option 1: File Uploader */}
          <button
            type="button"
            className="btn btn-outline"
            style={{
              padding: '10px 14px',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              background: '#fff',
              borderColor: 'var(--accent-dark)',
              color: 'var(--accent-dark)',
              borderRadius: 8,
            }}
            onClick={() => fileInputRef.current?.click()}
            disabled={files.length >= maxFiles}
          >
            <Upload size={16} />
            <span>Upload from Device</span>
          </button>

          {/* Option 2: Live Camera Click Photo */}
          <button
            type="button"
            className="btn btn-primary"
            style={{
              padding: '10px 14px',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              borderRadius: 8,
            }}
            onClick={handleStartCamera}
            disabled={files.length >= maxFiles}
          >
            <Camera size={16} />
            <span>Click Photo (Camera)</span>
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFilesChosen}
        style={{ display: 'none' }}
      />
      {/* Mobile/Fallback capture input */}
      <input
        ref={mobileCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFilesChosen}
        style={{ display: 'none' }}
      />

      {cameraError && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#991b1b',
            fontSize: 12,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <AlertCircle size={14} />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Live Camera Viewfinder */}
      {isCameraOpen && (
        <div
          style={{
            background: '#0b3d3b',
            borderRadius: 12,
            padding: '14px',
            marginBottom: 14,
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(11, 61, 59, 0.25)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, color: '#fff' }}>
            <span style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
              Live Camera Viewfinder
            </span>
            <button
              type="button"
              onClick={handleCloseCamera}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: 26,
                height: 26,
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
              title="Close Camera"
            >
              <X size={15} />
            </button>
          </div>

          <div
            style={{
              position: 'relative',
              borderRadius: 8,
              overflow: 'hidden',
              background: '#000',
              maxHeight: 280,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }}
            />
          </div>

          {/* Shutter / Snap Button */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-light"
              style={{ fontSize: 12, padding: '6px 14px' }}
              onClick={handleCloseCamera}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                background: '#12c88f',
                borderColor: '#12c88f',
                fontSize: 13,
                fontWeight: 800,
                padding: '8px 22px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
              onClick={handleCaptureFrame}
              disabled={capturing}
            >
              <Camera size={16} />
              {capturing ? 'Snapping...' : 'Snap & Use Photo'}
            </button>
          </div>
        </div>
      )}

      {/* Thumbnails of Attached Photos */}
      {files.length > 0 && (
        <div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            {files.map((file, idx) => {
              const previewUrl = typeof file === 'string' ? file : URL.createObjectURL(file);
              const fileName = file.name || `Photo #${idx + 1}`;

              return (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: 84,
                    height: 84,
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: '1.5px solid var(--line)',
                    background: '#edf4f3',
                    boxShadow: '0 2px 8px rgba(11, 61, 59, 0.08)',
                  }}
                >
                  <img
                    src={previewUrl}
                    alt={fileName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      background: 'rgba(0,0,0,0.65)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    title="Remove Photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6 }}>
            ✓ {files.length} photo(s) selected and ready for submission.
          </p>
        </div>
      )}
    </div>
  );
}
