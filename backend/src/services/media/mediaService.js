const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const Media = require('../../models/Media');
const config = require('../../config/env');

const UPLOAD_DIR = config.uploadDir || path.join(__dirname, '../../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed MIME types and extensions
const ALLOWED_MIME_TYPES = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'application/pdf': '.pdf'
};

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.mp4', '.webm', '.mov', '.pdf'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanExt = ALLOWED_EXTENSIONS.includes(ext) ? ext : '.bin';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    cb(null, `media-${uniqueSuffix}${cleanExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const mime = (file.mimetype || '').toLowerCase();
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES[mime] || !ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error('نوع الملف غير مدعوم. الأنواع المسموح بها: PNG, JPG, JPEG, WEBP, SVG, MP4, PDF'), false);
  }

  // Reject dangerous executables
  if (['.exe', '.sh', '.bat', '.cmd', '.js', '.php', '.py', '.html', '.htm'].includes(ext)) {
    return cb(new Error('الملفات التنفيذية والبرمجية ممنوعة تماماً لأسباب أمنية'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max limit for video
  }
});

/**
 * Helper to delete a file from disk safely
 */
const deleteFileFromDisk = (filename) => {
  try {
    // Sanitize filename against path traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(UPLOAD_DIR, safeFilename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (err) {
    console.warn('[MediaService] Delete disk file warning:', err.message);
  }
  return false;
};

module.exports = {
  upload,
  UPLOAD_DIR,
  deleteFileFromDisk,
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES
};
