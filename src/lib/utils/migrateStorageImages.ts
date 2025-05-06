/**
 * Utility for migrating images from Firebase Storage to base64 encoded strings
 */
import { getDocument, updateDocument, COLLECTIONS } from '../firebase/firestore';
import { urlToBase64 } from './imageUtils';

/**
 * Migrate user profile images from Firebase Storage URLs to base64
 */
export const migrateUserProfileImages = async (): Promise<{
  success: number;
  failed: number;
  total: number;
}> => {
  try {
    // Get all users
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    
    const users = await response.json();
    console.log(`Starting migration for ${users.length} users`);
    
    let success = 0;
    let failed = 0;
    
    // Process each user
    for (const user of users) {
      try {
        // Skip users without a photo URL or with base64 already
        if (!user.photoURL || user.photoURL.startsWith('data:image')) {
          continue;
        }
        
        console.log(`Processing user ${user.id}: ${user.displayName}`);
        
        // Convert URL to base64
        const base64Image = await urlToBase64(user.photoURL);
        
        // Update user document
        await updateDocument(COLLECTIONS.USERS, user.id, {
          photoURL: base64Image
        });
        
        console.log(`Successfully migrated image for user ${user.id}`);
        success++;
      } catch (error) {
        console.error(`Failed to migrate image for user ${user.id}:`, error);
        failed++;
      }
    }
    
    console.log(`Migration complete. Success: ${success}, Failed: ${failed}, Total: users.length`);
    return { success, failed, total: users.length };
  } catch (error) {
    console.error('Error in migration process:', error);
    throw error;
  }
};

/**
 * Migrate service images from Firebase Storage URLs to base64
 */
export const migrateServiceImages = async (): Promise<{
  success: number;
  failed: number;
  total: number;
}> => {
  try {
    // Get all services
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services`);
    if (!response.ok) {
      throw new Error(`Failed to fetch services: ${response.statusText}`);
    }
    
    const services = await response.json();
    console.log(`Starting migration for ${services.length} services`);
    
    let success = 0;
    let failed = 0;
    
    // Process each service
    for (const service of services) {
      try {
        // Skip services without images
        if (!service.images || service.images.length === 0) {
          continue;
        }
        
        console.log(`Processing service ${service.id}: ${service.title}`);
        
        // Check if any images need migration (not base64 already)
        const imagesToMigrate = service.images.filter(
          (img: string) => img && !img.startsWith('data:image')
        );
        
        if (imagesToMigrate.length === 0) {
          console.log(`No images to migrate for service ${service.id}`);
          continue;
        }
        
        // Convert each URL to base64
        const migratedImages = await Promise.all(
          imagesToMigrate.map((url: string) => urlToBase64(url, 600, 400))
        );
        
        // Replace old URLs with base64 strings
        const updatedImages = [...service.images];
        imagesToMigrate.forEach((oldUrl: string, index: number) => {
          const oldUrlIndex = updatedImages.findIndex(url => url === oldUrl);
          if (oldUrlIndex >= 0) {
            updatedImages[oldUrlIndex] = migratedImages[index];
          }
        });
        
        // Handle thumbnail if it's an old URL
        let thumbnail = service.thumbnail;
        if (thumbnail && !thumbnail.startsWith('data:image')) {
          // Find if we already converted this image
          const matchingIndex = imagesToMigrate.findIndex(url => url === thumbnail);
          if (matchingIndex >= 0) {
            // Reuse already converted image
            thumbnail = migratedImages[matchingIndex];
          } else {
            // Convert thumbnail
            thumbnail = await urlToBase64(thumbnail, 600, 400);
          }
        }
        
        // Update service document
        await updateDocument(COLLECTIONS.SERVICES, service.id, {
          images: updatedImages,
          thumbnail
        });
        
        console.log(`Successfully migrated images for service ${service.id}`);
        success++;
      } catch (error) {
        console.error(`Failed to migrate images for service ${service.id}:`, error);
        failed++;
      }
    }
    
    console.log(`Migration complete. Success: ${success}, Failed: ${failed}, Total: ${services.length}`);
    return { success, failed, total: services.length };
  } catch (error) {
    console.error('Error in migration process:', error);
    throw error;
  }
};

/**
 * Run the complete migration process
 */
export const migrateAllImages = async (): Promise<void> => {
  console.log('Starting image migration process...');
  
  try {
    // Migrate user profile images
    console.log('Migrating user profile images...');
    const userResult = await migrateUserProfileImages();
    console.log('User profile image migration complete:', userResult);
    
    // Migrate service images
    console.log('Migrating service images...');
    const serviceResult = await migrateServiceImages();
    console.log('Service image migration complete:', serviceResult);
    
    console.log('Migration process completed successfully!');
  } catch (error) {
    console.error('Migration process failed:', error);
    throw error;
  }
}; 