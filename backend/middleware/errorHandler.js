/**
 * HTTP Error and Centralized Error Handler Middleware
 */

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'HttpError';
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export function errorHandler(err, req, res, next) {
  // Handle Multer errors as 400 Bad Request
  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE' || (err.message && err.message.includes('file type'))) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload validation error.',
    });
  }

  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';

  // In production, avoid leaking stack traces or internal server error messages
  const message = (status === 500 && isProd)
    ? 'Internal server error occurred.'
    : (err.message || 'An unexpected error occurred.');

  if (status >= 500) {
    console.error('[Internal Error]:', err);
  }

  res.status(status).json({
    success: false,
    message,
  });
}
