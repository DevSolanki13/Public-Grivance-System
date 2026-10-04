/**
 * Central HTTP Gateway Client for JanSewa API
 * Handles token attachment, multipart uploads, and unified error responses
 */

const BASE_URL = import.meta.env?.VITE_API_URL || '/api';

export async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('jansewa_token');

  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    if (options.body && typeof options.body === 'object') {
      options.body = JSON.stringify(options.body);
    }
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    // Parse response
    let data;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = { message: await res.text() };
    }

    if (!res.ok) {
      const error = new Error(data?.message || `HTTP error ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.warn(`[API Client Error] ${options.method || 'GET'} ${endpoint}:`, err.message);
    throw err;
  }
}

export const client = {
  get: (url, options = {}) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => request(url, { ...options, method: 'POST', body }),
  patch: (url, body, options = {}) => request(url, { ...options, method: 'PATCH', body }),
  put: (url, body, options = {}) => request(url, { ...options, method: 'PUT', body }),
  delete: (url, options = {}) => request(url, { ...options, method: 'DELETE' }),
  upload: (url, formData, options = {}) => request(url, { ...options, method: 'POST', body: formData }),
};

export default client;
