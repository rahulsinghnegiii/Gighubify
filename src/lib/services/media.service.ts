import { updateDocument, getDocument } from '../firebase/firestore';
import { COLLECTIONS } from '../firebase/firestore';
import { fileToBase64, resizeImage } from '../utils/imageUtils';
import { uploadToCloudinary, shouldUseCloudinary, MediaType, MediaInfo } from '../utils/cloudinaryUtils';

// Maximum number of media items per service
export const MAX_SERVICE_MEDIA = 10;

// Media item structure
export interface MediaItem {
  id: string;
  url: string;
  publicId?: string;
  type: MediaType;
  format: string;
  isThumbnail: boolean;
  width?: number;
  height?: number;
  duration?: number;
}

/**
 * Upload media (image, video, audio) for a service
 * @param serviceId - The ID of the service
 * @param userId - The ID of the user
 * @param file - The file to upload
 * @param isThumbnail - Whether this media should be set as the thumbnail
 * @returns The uploaded media item
 */
export const uploadServiceMedia = async (
  serviceId: string,
  userId: string,
  file: File,
  isThumbnail: boolean = false
): Promise<MediaItem> => {
  try {
    // Generate a unique ID for the media item
    const mediaId = generateUniqueId();
    
    // Determine how to handle the file based on type and size
    let mediaItem: MediaItem;
    
    // Check if we should use Cloudinary
    if (shouldUseCloudinary(file)) {
      // Upload to Cloudinary
      const folder = `services/${userId}/${serviceId}`;
      const cloudinaryData = await uploadToCloudinary(file, folder);
      
      // Validate the URL returned from Cloudinary
      if (!cloudinaryData.url || typeof cloudinaryData.url !== 'string') {
        console.error('Invalid URL returned from Cloudinary:', cloudinaryData);
        throw new Error('Invalid URL returned from Cloudinary');
      }
      
      console.log(`Cloudinary upload success for ${file.name}:`, {
        url: cloudinaryData.url.substring(0, 50) + '...',
        type: cloudinaryData.type,
        publicId: cloudinaryData.publicId
      });
      
      // Create media item from Cloudinary response
      mediaItem = {
        id: mediaId,
        url: cloudinaryData.url,
        publicId: cloudinaryData.publicId,
        type: cloudinaryData.type,
        format: cloudinaryData.format,
        isThumbnail: isThumbnail,
        width: cloudinaryData.width,
        height: cloudinaryData.height,
        duration: cloudinaryData.duration
      };
    } else {
      // This is a small image, use base64
      // Resize the image (600x400 for service images - optimized for display in cards)
      const resizedImage = await resizeImage(file, 600, 400);
      const base64Image = await fileToBase64(resizedImage);
      
      if (!base64Image || typeof base64Image !== 'string' || !base64Image.startsWith('data:')) {
        console.error('Invalid base64 image generated:', base64Image?.substring(0, 20) + '...');
        throw new Error('Invalid base64 image generated');
      }
      
      console.log(`Base64 image generated for ${file.name}, size: ${Math.round(base64Image.length / 1024)}KB`);
      
      // Create media item for base64 image
      mediaItem = {
        id: mediaId,
        url: base64Image,
        type: MediaType.IMAGE,
        format: file.type.split('/')[1] || 'webp',
        isThumbnail: isThumbnail,
        width: 600,
        height: 400
      };
    }
    
    // Get the current service
    const service = await getDocument(COLLECTIONS.SERVICES, serviceId);
    
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Initialize media array if it doesn't exist
    const media = service.media || [];
    
    // If this is set as thumbnail, update previous thumbnails
    if (isThumbnail) {
      // Set all other items as not thumbnail
      media.forEach((item: MediaItem) => {
        item.isThumbnail = false;
      });
      
      // Add the new media item
      media.push(mediaItem);
      
      console.log(`Setting thumbnail for service ${serviceId} to media item ${mediaId}`);
      
      // Update the service with the updated media array and thumbnail
      await updateDocument(COLLECTIONS.SERVICES, serviceId, {
        media: media,
        thumbnail: mediaItem.url
      });
    } else {
      // Just add to the media array
      media.push(mediaItem);
      
      // Update the service with the updated media array
      await updateDocument(COLLECTIONS.SERVICES, serviceId, {
        media: media
      });
      
      // If this is the first media item, set as thumbnail
      if (media.length === 1) {
        console.log(`First media item for service ${serviceId}, automatically setting as thumbnail`);
        
        // Make sure the first item is marked as thumbnail
        media[0].isThumbnail = true;
        
        await updateDocument(COLLECTIONS.SERVICES, serviceId, {
          media: media,
          thumbnail: mediaItem.url
        });
      }
    }
    
    return mediaItem;
  } catch (error) {
    console.error('Error uploading service media:', error);
    throw error;
  }
};

/**
 * Remove a media item from a service
 * @param serviceId - The ID of the service
 * @param mediaId - The ID of the media item to remove
 */
export const removeServiceMedia = async (
  serviceId: string,
  mediaId: string
): Promise<void> => {
  try {
    // Get the current service
    const service = await getDocument(COLLECTIONS.SERVICES, serviceId);
    
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Find the media item
    const media = service.media || [];
    const mediaIndex = media.findIndex((item: MediaItem) => item.id === mediaId);
    
    if (mediaIndex === -1) {
      throw new Error('Media item not found');
    }
    
    const mediaItem = media[mediaIndex];
    
    // Remove the media item
    media.splice(mediaIndex, 1);
    
    // If this was the thumbnail, update the thumbnail
    let thumbnailUpdate = {};
    if (mediaItem.isThumbnail) {
      // Find the first media item to set as thumbnail
      const newThumbnail = media.length > 0 ? media[0] : null;
      
      if (newThumbnail) {
        newThumbnail.isThumbnail = true;
        thumbnailUpdate = { thumbnail: newThumbnail.url };
      } else {
        thumbnailUpdate = { thumbnail: null };
      }
    }
    
    // Update the service with the updated media array
    await updateDocument(COLLECTIONS.SERVICES, serviceId, {
      media: media,
      ...thumbnailUpdate
    });
    
    // Delete from Cloudinary if needed
    if (mediaItem.publicId) {
      const resourceType = mediaItem.type === MediaType.VIDEO ? 'video' : 
                          mediaItem.type === MediaType.AUDIO ? 'audio' : 'image';
      
      // This is non-blocking - we don't wait for it
      deleteFromCloudinary(mediaItem.publicId, resourceType).catch(console.error);
    }
  } catch (error) {
    console.error('Error removing service media:', error);
    throw error;
  }
};

/**
 * Set a media item as the thumbnail for a service
 * @param serviceId - The ID of the service
 * @param mediaId - The ID of the media item to set as thumbnail
 */
export const setServiceThumbnail = async (
  serviceId: string,
  mediaId: string
): Promise<void> => {
  try {
    // Get the current service
    const service = await getDocument(COLLECTIONS.SERVICES, serviceId);
    
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Find the media item
    const media = service.media || [];
    const mediaIndex = media.findIndex((item: MediaItem) => item.id === mediaId);
    
    if (mediaIndex === -1) {
      throw new Error('Media item not found');
    }
    
    // Set all items as not thumbnail
    media.forEach((item: MediaItem) => {
      item.isThumbnail = false;
    });
    
    // Set the selected item as thumbnail
    media[mediaIndex].isThumbnail = true;
    
    // Update the service with the updated media array and thumbnail
    await updateDocument(COLLECTIONS.SERVICES, serviceId, {
      media: media,
      thumbnail: media[mediaIndex].url
    });
  } catch (error) {
    console.error('Error setting service thumbnail:', error);
    throw error;
  }
};

/**
 * Generate a unique ID for media items
 */
function generateUniqueId(): string {
  return 'media_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Helper function for Cloudinary delete
 * This is imported here to avoid circular dependencies
 */
async function deleteFromCloudinary(publicId: string, resourceType: string): Promise<boolean> {
  // Dynamically import to avoid circular dependencies
  const { deleteFromCloudinary } = await import('../utils/cloudinaryUtils');
  return deleteFromCloudinary(publicId, resourceType);
} 