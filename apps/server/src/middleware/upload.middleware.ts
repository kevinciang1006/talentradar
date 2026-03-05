import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

/**
 * Determine storage strategy based on environment
 *
 * PRODUCTION (Cloudinary configured):
 *   - Uses memoryStorage (files stored in buffer)
 *   - Uploaded to Cloudinary in controllers
 *   - Persistent, scalable storage
 *
 * DEVELOPMENT (Cloudinary not configured):
 *   - Uses diskStorage (files saved locally)
 *   - Falls back to local disk
 *   - Ephemeral on Railway/Render but OK for dev
 */
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// Memory storage for Cloudinary (production)
const memoryStorage = multer.memoryStorage();

// Disk storage for local development (fallback)
const diskStorage = multer.diskStorage({
  destination: (req: Request, file, cb) => {
    const { id } = req.params; // dealId
    const dealId = typeof id === 'string' ? id : 'temp';
    const category = req.path.includes('invoice') ? 'invoices'
                   : req.path.includes('contract') ? 'contracts'
                   : req.path.includes('compliance') ? 'compliance'
                   : 'other';

    const uploadPath = path.join(
      __dirname,
      '../../uploads/deals',
      dealId || 'temp',
      category
    );

    // Create directory if it doesn't exist
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, uniqueSuffix + '-' + sanitizedName);
  }
});

// Select storage strategy
const storage = useCloudinary ? memoryStorage : diskStorage;

// File validation
const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Allowed file extensions
  const allowedExtensions = /pdf|doc|docx|xls|xlsx|png|jpg|jpeg/;
  const extname = allowedExtensions.test(
    path.extname(file.originalname).toLowerCase()
  );

  // Allowed MIME types
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];
  const mimetypeValid = allowedMimeTypes.includes(file.mimetype);

  if (mimetypeValid && extname) {
    return cb(null, true);
  }

  cb(new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG are allowed'));
};

// Create multer instance with configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Helper function to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Export storage configuration for controllers
export const isUsingCloudinary = useCloudinary;
