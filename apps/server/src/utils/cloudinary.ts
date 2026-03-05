/**
 * Cloudinary Integration Utility
 *
 * Provides cloud file storage for production deployments.
 * Replaces local disk storage which is ephemeral on Railway/Render/GCP Cloud Run.
 *
 * Setup:
 * 1. Sign up at cloudinary.com (FREE 25GB storage + bandwidth)
 * 2. Get credentials from dashboard
 * 3. Set environment variables:
 *    - CLOUDINARY_CLOUD_NAME
 *    - CLOUDINARY_API_KEY
 *    - CLOUDINARY_API_SECRET
 *    - CLOUDINARY_FOLDER (optional, e.g., 'talentradar-production')
 *
 * Usage:
 * - uploadToCloudinary(file, folder, category) - Upload file buffer
 * - deleteFromCloudinary(public_id) - Delete file
 * - getCloudinaryUrl(public_id) - Get public URL
 */

import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

/**
 * Check if Cloudinary is configured
 */
export const isCloudinaryConfigured = (): boolean => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

/**
 * Upload file to Cloudinary
 *
 * @param file - Multer file object (with buffer)
 * @param dealId - Deal ID for organizing files
 * @param category - File category (invoices, contracts, compliance, other)
 * @returns Cloudinary upload response with URL
 */
export const uploadToCloudinary = async (
  file: Express.Multer.File,
  dealId: string,
  category: string
): Promise<UploadApiResponse> => {
  // Validate configuration
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_* environment variables.');
  }

  // Generate folder path
  const folderPrefix = process.env.CLOUDINARY_FOLDER || 'talentradar';
  const folder = `${folderPrefix}/deals/${dealId}/${category}`;

  // Generate public_id (filename without extension)
  const timestamp = Date.now();
  const randomHash = Math.random().toString(36).substring(2, 8);
  const sanitizedName = file.originalname
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/\.(\w+)$/, ''); // Remove extension

  const publicId = `${folder}/${timestamp}-${randomHash}-${sanitizedName}`;

  return new Promise((resolve, reject) => {
    // Upload stream
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        folder,
        resource_type: 'auto', // Auto-detect file type
        access_mode: 'public', // Make file publicly accessible
        use_filename: true,
        unique_filename: false, // We're handling uniqueness ourselves
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (!result) {
          reject(new Error('Cloudinary upload failed: No result returned'));
        } else {
          resolve(result);
        }
      }
    );

    // Write file buffer to stream
    uploadStream.end(file.buffer);
  });
};

/**
 * Delete file from Cloudinary
 *
 * @param publicId - Cloudinary public_id (from upload response)
 * @returns Deletion result
 */
export const deleteFromCloudinary = async (publicId: string): Promise<any> => {
  // Validate configuration
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Please set CLOUDINARY_* environment variables.');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'auto',
    });
    return result;
  } catch (error: any) {
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};

/**
 * Get public URL for Cloudinary file
 *
 * @param publicId - Cloudinary public_id
 * @param resourceType - Type of resource (image, video, raw)
 * @returns Public URL
 */
export const getCloudinaryUrl = (publicId: string, resourceType: 'image' | 'video' | 'raw' = 'raw'): string => {
  // Validate configuration
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured.');
  }

  return cloudinary.url(publicId, {
    resource_type: resourceType,
    secure: true, // HTTPS
  });
};

/**
 * Extract public_id from Cloudinary URL
 * Useful for deletion when you only have the URL
 *
 * @param url - Cloudinary URL
 * @returns public_id or null if invalid
 */
export const extractPublicId = (url: string): string | null => {
  try {
    // Example URL: https://res.cloudinary.com/cloud_name/resource_type/upload/v1234567890/folder/file.ext
    const urlParts = url.split('/');
    const uploadIndex = urlParts.indexOf('upload');

    if (uploadIndex === -1) {
      return null;
    }

    // Get everything after 'upload/vXXXXXXXXXX/'
    const publicIdWithExt = urlParts.slice(uploadIndex + 2).join('/');

    // Remove extension
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, '');

    return publicId;
  } catch (error) {
    return null;
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryUrl,
  extractPublicId,
  isCloudinaryConfigured,
};
