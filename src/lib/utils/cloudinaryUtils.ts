/**
 * Cloudinary utility functions for GigHubify
 * Handles uploading and managing media types (images, videos, audio)
 */

/**
 * Cloudinary configuration
 * These values should be set in your .env file
 */
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

// Log environment variables only in development
if (import.meta.env.DEV) {
  console.log('Cloudinary config:');
  console.log('- Cloud name:', CLOUDINARY_CLOUD_NAME ? '[Set]' : '[Missing]');
  console.log('- Upload preset:', CLOUDINARY_UPLOAD_PRESET ? '[Set]' : '[Missing]');
}

// Type for Cloudinary upload response
interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
  width?: number;
  height?: number;
  duration?: number;
}

// Media types
export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document'
}

// Media info type
export interface MediaInfo {
  url: string;
  publicId: string;
  type: MediaType;
  format: string;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Upload media to Cloudinary
 * @param file - The file to upload
 * @param folder - The folder to upload to (e.g., 'services/{serviceId}')
 * @returns MediaInfo object with the uploaded media information
 */
export const uploadToCloudinary = async (
  file: File,
  folder: string
): Promise<MediaInfo> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary configuration missing. Please check your environment variables.'
    );
  }

  // Determine resource type based on file mime type
  let resourceType = 'auto';
  if (file.type.startsWith('image/')) resourceType = 'image';
  if (file.type.startsWith('video/')) resourceType = 'video';
  if (file.type.startsWith('audio/')) resourceType = 'audio';

  // Create form data for upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);

  try {
    // Upload to Cloudinary
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
    }

    const data: CloudinaryUploadResponse = await response.json();

    // Determine media type
    let mediaType = MediaType.DOCUMENT;
    if (data.resource_type === 'image') mediaType = MediaType.IMAGE;
    if (data.resource_type === 'video') mediaType = MediaType.VIDEO;
    if (data.resource_type === 'audio') mediaType = MediaType.AUDIO;

    // Return media info
    return {
      url: data.secure_url,
      publicId: data.public_id,
      type: mediaType,
      format: data.format,
      width: data.width,
      height: data.height,
      duration: data.duration
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete media from Cloudinary
 * @param publicId - The public ID of the media to delete
 * @param resourceType - The resource type (image, video, audio)
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: string = 'image'
): Promise<boolean> => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary configuration missing. Please check your environment variables.'
    );
  }

  // Create form data for deletion
  const formData = new FormData();
  formData.append('public_id', publicId);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    // Send deletion request
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/destroy`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Delete failed: ${error.message || 'Unknown error'}`);
    }

    const result = await response.json();
    return result.result === 'ok';
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

/**
 * Determine if a file should use Cloudinary or base64
 * Images under 1MB can use base64, everything else should use Cloudinary
 */
export const shouldUseCloudinary = (file: File): boolean => {
  // Images under 1MB can use base64
  if (file.type.startsWith('image/') && file.size < 1024 * 1024) {
    return false;
  }
  
  // All other files should use Cloudinary
  return true;
}; 