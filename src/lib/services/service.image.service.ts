import { updateDocument } from '../firebase/firestore';
import { COLLECTIONS } from '../firebase/firestore';
import { fileToBase64, resizeImage } from '../utils/imageUtils';

/**
 * Maximum number of images allowed per service
 */
export const MAX_SERVICE_IMAGES = 5;

/**
 * Upload a service image as base64
 * @param serviceId - The ID of the service
 * @param file - The image file to upload
 * @param isThumbnail - Whether this image should be set as the thumbnail
 * @returns The base64 encoded image string
 */
export const addServiceImage = async (
  serviceId: string,
  file: File,
  isThumbnail: boolean = false
): Promise<string> => {
  try {
    // Resize the image (600x400 for service images - optimized for display in service cards)
    const resizedImage = await resizeImage(file, 600, 400);
    
    // Convert to base64
    const base64Image = await fileToBase64(resizedImage);
    
    // Get current service data
    const serviceRef = `${COLLECTIONS.SERVICES}/${serviceId}`;
    
    // Update the images array
    if (isThumbnail) {
      // Set as the thumbnail and also add to images array
      await updateDocument(COLLECTIONS.SERVICES, serviceId, {
        thumbnail: base64Image,
        images: [base64Image]
      });
    } else {
      // Add to the images array using arrayUnion
      await updateDocument(COLLECTIONS.SERVICES, serviceId, {
        images: [base64Image]
      }, true); // true for array union operation
    }
    
    return base64Image;
  } catch (error) {
    console.error('Error uploading service image:', error);
    throw error;
  }
};

/**
 * Remove a service image
 * @param serviceId - The ID of the service
 * @param imageUrl - The base64 image to remove
 * @returns void
 */
export const removeServiceImage = async (
  serviceId: string,
  imageUrl: string
): Promise<void> => {
  try {
    // Update the images array using arrayRemove
    await updateDocument(COLLECTIONS.SERVICES, serviceId, {
      images: [imageUrl]
    }, false, true); // false for array union, true for array remove
    
    // If this was the thumbnail, we need to update that as well
    // First check if the service still has other images
    const serviceRef = `${COLLECTIONS.SERVICES}/${serviceId}`;
    const service = await fetch(serviceRef).then(res => res.json());
    
    if (service.thumbnail === imageUrl && service.images && service.images.length > 0) {
      // Set the first available image as the new thumbnail
      await updateDocument(COLLECTIONS.SERVICES, serviceId, {
        thumbnail: service.images[0]
      });
    } else if (service.thumbnail === imageUrl) {
      // No more images, clear the thumbnail
      await updateDocument(COLLECTIONS.SERVICES, serviceId, {
        thumbnail: null
      });
    }
    
  } catch (error) {
    console.error('Error removing service image:', error);
    throw error;
  }
};

/**
 * Set a service image as the thumbnail
 * @param serviceId - The ID of the service
 * @param imageUrl - The base64 image to set as thumbnail
 * @returns void
 */
export const setServiceThumbnail = async (
  serviceId: string,
  imageUrl: string
): Promise<void> => {
  try {
    await updateDocument(COLLECTIONS.SERVICES, serviceId, {
      thumbnail: imageUrl
    });
  } catch (error) {
    console.error('Error setting service thumbnail:', error);
    throw error;
  }
}; 