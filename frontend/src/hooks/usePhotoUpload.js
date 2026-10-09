import { useState } from 'react';
import { grievanceService } from '../services/grievanceService';
import { friendlyError } from '../lib/supabase';

// Uploads a picked image to Supabase Storage and reports progress/errors.
export function usePhotoUpload(userId) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const uploadFromInput = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return null;
    setUploading(true);
    setUploadError('');
    try {
      return await grievanceService.uploadPhoto(file, userId);
    } catch (err) {
      setUploadError(friendlyError(err));
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { uploading, uploadError, setUploadError, uploadFromInput };
}
