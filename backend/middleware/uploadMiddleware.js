import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Map allowed MIME types strictly to safe extensions
const MIME_EXTENSION_MAP = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    // Force safe extension matching the validated MIME type
    const safeExt = MIME_EXTENSION_MAP[file.mimetype] || (ALLOWED_EXTENSIONS.has(rawExt) ? rawExt : '.jpg');
    const cleanBase = path
      .basename(file.originalname, rawExt)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `${cleanBase || 'upload'}-${uniqueSuffix}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const isValidMime = Boolean(MIME_EXTENSION_MAP[file.mimetype]);
  const isValidExt = ALLOWED_EXTENSIONS.has(ext);

  if (isValidMime && isValidExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP image files are permitted.'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max per photo
    files: 5,                  // Max 5 files per request
  },
});

export function validateImageMagicBytes(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(12);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 12, 0);
    fs.closeSync(fd);

    if (bytesRead < 4) return false;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return true;
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return true;
    }
    // WEBP: RIFF....WEBP
    if (
      bytesRead >= 12 &&
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46 &&
      buffer.toString('utf8', 8, 12) === 'WEBP'
    ) {
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

export function verifyUploadedImages(req, res, next) {
  const files = req.files || (req.file ? [req.file] : []);
  for (const file of files) {
    if (!validateImageMagicBytes(file.path)) {
      try {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      } catch (_) {}
      return res.status(400).json({
        success: false,
        message: `File '${file.originalname}' has invalid image content (magic byte check failed). Only authentic JPEG, PNG, or WEBP images are allowed.`,
      });
    }
  }
  next();
}

// Targeted middleware for specific endpoints
export const uploadEvidence = upload.array('evidence', 5);
export const uploadProof = upload.array('proofFiles', 5);
