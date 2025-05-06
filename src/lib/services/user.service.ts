import { 
  COLLECTIONS,
  getDocument,
  getDocuments,
  updateDocument,
  setDocument
} from '../firebase/firestore';
import { User, SellerProfile, UserRole } from '../models/user.model';
import { fileToBase64, resizeImage } from '../utils/imageUtils';

/**
 * Get a user profile by ID
 */
export const getUserProfile = async (userId: string): Promise<User | null> => {
  return await getDocument<User>(COLLECTIONS.USERS, userId);
};

/**
 * Update a user profile
 */
export const updateUserProfile = async (
  userId: string,
  updates: Partial<User>
): Promise<void> => {
  try {
    // Check if user document exists first
    const userDoc = await getUserProfile(userId);
    
    if (!userDoc) {
      // User document doesn't exist, so create it
      await setDocument<Partial<User>>(COLLECTIONS.USERS, userId, {
        ...updates,
        id: userId,
        email: updates.email || '',
        displayName: updates.displayName || 'User',
        role: UserRole.USER,
        isSeller: false,
        isVerified: false
      });
    } else {
      // User document exists, update it
      return await updateDocument<User>(COLLECTIONS.USERS, userId, updates);
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Upload a profile image and update the user profile with base64 encoded image
 */
export const updateProfileImage = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    // Resize the image before converting to base64
    const resizedImage = await resizeImage(file, 300, 300);
    
    // Convert resized image to base64
    const base64Image = await fileToBase64(resizedImage);
    
    // Check if user exists
    const user = await getUserProfile(userId);
    
    if (!user) {
      // Create the user document with the base64 image
      await setDocument<Partial<User>>(COLLECTIONS.USERS, userId, {
        id: userId,
        photoURL: base64Image,
        email: '',
        displayName: 'User',
        role: UserRole.USER,
        isSeller: false,
        isVerified: false
      });
    } else {
      // Update the user profile with the base64 image
      await updateDocument<User>(COLLECTIONS.USERS, userId, { photoURL: base64Image });
    }
    
    return base64Image;
  } catch (error) {
    console.error('Error updating profile image:', error);
    throw error;
  }
};

/**
 * Check if a user is a seller
 */
export const isUserSeller = async (userId: string): Promise<boolean> => {
  const user = await getUserProfile(userId);
  return user?.isSeller || false;
};

/**
 * Get a seller profile by user ID
 */
export const getSellerProfile = async (userId: string): Promise<SellerProfile | null> => {
  return await getDocument<SellerProfile>(`${COLLECTIONS.USERS}_seller_profiles`, userId);
};

/**
 * Create or update a seller profile
 */
export const createOrUpdateSellerProfile = async (
  userId: string,
  profileData: Omit<SellerProfile, 'userId' | 'createdAt' | 'updatedAt'>
): Promise<void> => {
  // Check if user is marked as a seller
  const user = await getUserProfile(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // If not already a seller, update the user record
  if (!user.isSeller) {
    await updateUserProfile(userId, { isSeller: true });
  }
  
  // Check if seller profile already exists
  const existingProfile = await getSellerProfile(userId);
  
  if (existingProfile) {
    // Update existing profile
    await updateDocument<SellerProfile>(
      `${COLLECTIONS.USERS}_seller_profiles`,
      userId,
      profileData
    );
  } else {
    // Create new profile
    await setDocument<SellerProfile & { userId: string }>(
      `${COLLECTIONS.USERS}_seller_profiles`,
      userId,
      {
        ...profileData,
        userId
      }
    );
  }
};

/**
 * Get all sellers with optional filters
 */
export const getSellers = async (
  options?: {
    limit?: number;
    skills?: string[];
    searchTerm?: string;
  }
): Promise<User[]> => {
  const queryOptions: any = {
    whereConditions: [
      ['isSeller', '==', true]
    ]
  };
  
  if (options?.limit) {
    queryOptions.limitCount = options.limit;
  }
  
  // Get all seller users
  const users = await getDocuments<User>(COLLECTIONS.USERS, queryOptions);
  
  // If no additional filtering required, return all users
  if (!options?.skills && !options?.searchTerm) {
    return users;
  }
  
  // For more complex filtering, we need to get all seller profiles
  const sellerIds = users.map(user => user.id);
  const sellerProfiles = await Promise.all(
    sellerIds.map(id => getSellerProfile(id))
  );
  
  // Create a map of user ID to seller profile
  const profileMap = new Map<string, SellerProfile | null>();
  sellerProfiles.forEach(profile => {
    if (profile) {
      profileMap.set(profile.userId, profile);
    }
  });
  
  // Filter users based on seller profile attributes
  return users.filter(user => {
    const profile = profileMap.get(user.id);
    
    if (!profile) {
      return false;
    }
    
    // Filter by skills if specified
    if (options?.skills && options.skills.length > 0) {
      const hasMatchingSkill = profile.skills.some(skill => 
        options.skills!.includes(skill.toLowerCase())
      );
      
      if (!hasMatchingSkill) {
        return false;
      }
    }
    
    // Filter by search term if specified
    if (options?.searchTerm) {
      const term = options.searchTerm.toLowerCase();
      const matchesTitle = profile.title.toLowerCase().includes(term);
      const matchesDescription = profile.description.toLowerCase().includes(term);
      
      if (!matchesTitle && !matchesDescription) {
        return false;
      }
    }
    
    return true;
  });
}; 