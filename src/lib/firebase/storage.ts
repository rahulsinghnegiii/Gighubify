import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  UploadTaskSnapshot,
  StorageError 
} from "firebase/storage";
import { storage } from "./firebase";

// Storage folder paths
const STORAGE_PATHS = {
  PROFILE_IMAGES: "profile-images",
  SERVICE_IMAGES: "service-images",
  GIG_ATTACHMENTS: "gig-attachments"
};

// Upload file and get download URL
export const uploadFile = async (
  filePath: string,
  file: File
): Promise<string> => {
  try {
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

// Upload file with progress tracking
export const uploadFileWithProgress = (
  filePath: string,
  file: File,
  onProgress: (progress: number) => void,
  onError: (error: StorageError) => void,
  onComplete: (downloadURL: string) => void
): () => void => {
  const storageRef = ref(storage, filePath);
  const uploadTask = uploadBytesResumable(storageRef, file);

  // Register observers
  const unsubscribe = uploadTask.on('state_changed',
    // Progress observer
    (snapshot: UploadTaskSnapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      onProgress(progress);
    },
    // Error observer
    (error: StorageError) => {
      onError(error);
    },
    // Completion observer
    async () => {
      try {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onComplete(downloadURL);
      } catch (error) {
        console.error("Error getting download URL:", error);
        onError(error as StorageError);
      }
    }
  );

  // Return function to cancel upload if needed
  return () => {
    uploadTask.cancel();
    unsubscribe();
  };
};

// Delete file from storage
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

// Helper function to generate a unique file path
export const generateUniqueFilePath = (
  folder: string,
  userId: string,
  fileName: string
): string => {
  const timestamp = new Date().getTime();
  const fileExtension = fileName.split('.').pop();
  return `${folder}/${userId}/${timestamp}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
};

// Helper to upload a profile image
export const uploadProfileImage = async (
  userId: string,
  file: File
): Promise<string> => {
  const filePath = generateUniqueFilePath(STORAGE_PATHS.PROFILE_IMAGES, userId, file.name);
  return await uploadFile(filePath, file);
};

// Helper to upload a service/gig image
export const uploadServiceImage = async (
  userId: string,
  serviceId: string,
  file: File
): Promise<string> => {
  const filePath = `${STORAGE_PATHS.SERVICE_IMAGES}/${userId}/${serviceId}/${file.name}`;
  return await uploadFile(filePath, file);
};

export { STORAGE_PATHS }; 