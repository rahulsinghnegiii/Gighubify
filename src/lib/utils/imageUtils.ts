/**
 * Image utility functions for GigHubify
 * Handles resizing, conversion to base64, and external URL downloading
 */

/**
 * Convert a File or Blob to base64 string
 */
export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Resize an image to specific dimensions while preserving aspect ratio
 */
export const resizeImage = async (
  file: File | Blob, 
  maxWidth: number, 
  maxHeight: number,
  fileType: string = 'image/webp',
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        fileType,  // File type (webp recommended for better compression)
        quality    // Quality (0.8 = 80%)
      );
      
      // Clean up object URL
      URL.revokeObjectURL(img.src);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
  });
};

/**
 * Download an image from a URL and convert it to base64
 * Useful for migrating from Firebase Storage URLs to base64
 */
export const urlToBase64 = async (
  url: string, 
  maxWidth: number = 300, 
  maxHeight: number = 300
): Promise<string> => {
  try {
    // Fetch the image
    const response = await fetch(url, { 
      mode: 'cors',
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    // Convert to blob
    const blob = await response.blob();
    
    // Resize the image
    const resizedBlob = await resizeImage(blob, maxWidth, maxHeight);
    
    // Convert to base64
    return await fileToBase64(resizedBlob);
  } catch (error) {
    console.error('Error converting URL to base64:', error);
    throw error;
  }
};

/**
 * Check if a string is a valid base64 image
 */
export const isBase64Image = (str: string): boolean => {
  return str?.startsWith('data:image/');
};

/**
 * Check if a string is a valid image URL
 */
export const isImageUrl = (str: string): boolean => {
  if (!str || typeof str !== 'string') return false;
  
  // Check if it's an HTTP/HTTPS URL
  if (!str.startsWith('http')) return false;
  
  // Check common image extensions
  const endsWithImageExt = 
    str.endsWith('.jpg') || 
    str.endsWith('.jpeg') || 
    str.endsWith('.png') || 
    str.endsWith('.gif') || 
    str.endsWith('.webp');
    
  // Check for known image hosting services
  const isKnownImageHost = 
    str.includes('firebasestorage.googleapis.com') ||
    str.includes('cloudinary.com') || 
    str.includes('res.cloudinary.com');
  
  // Image URLs often contain these fragments
  const containsImageParams = 
    str.includes('/image/') || 
    str.includes('/images/') ||
    str.includes('/upload/');
    
  return endsWithImageExt || isKnownImageHost || containsImageParams;
};

/**
 * Check if a string is a valid image (either URL or base64)
 */
export const isValidImage = (str?: string | null): boolean => {
  if (!str) return false;
  return isBase64Image(str) || isImageUrl(str);
};

/**
 * Calculate the approximate size of a base64 string in KB
 */
export const getBase64Size = (base64String: string): number => {
  // Remove the data URL prefix (e.g., "data:image/png;base64,")
  const base64 = base64String.split(',')[1];
  if (!base64) return 0;
  
  // Calculate size in bytes (3/4 of the base64 length)
  const sizeInBytes = (base64.length * 3) / 4;
  
  // Convert to KB
  return sizeInBytes / 1024;
}; 