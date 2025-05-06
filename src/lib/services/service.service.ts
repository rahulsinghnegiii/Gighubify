import { 
  COLLECTIONS,
  addDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  subscribeToDocument,
  subscribeToCollection
} from '../firebase/firestore';
import { Service, ServiceFilter } from '../models/service.model';
import { uploadServiceImage } from '../firebase/storage';

/**
 * Create a new service/gig
 */
export const createService = async (
  sellerId: string,
  serviceData: Omit<Service, 'id' | 'sellerId' | 'createdAt' | 'updatedAt' | 'averageRating' | 'totalReviews' | 'isActive'>
): Promise<string> => {
  const service = {
    ...serviceData,
    sellerId,
    averageRating: 0,
    totalReviews: 0,
    isActive: true
  };
  
  return await addDocument<Partial<Service>>(COLLECTIONS.SERVICES, service);
};

/**
 * Get a single service by ID
 */
export const getService = async (serviceId: string): Promise<Service | null> => {
  return await getDocument<Service>(COLLECTIONS.SERVICES, serviceId);
};

/**
 * Subscribe to real-time updates for a service
 */
export const subscribeToService = (
  serviceId: string,
  callback: (service: Service | null) => void
): () => void => {
  return subscribeToDocument<Service>(COLLECTIONS.SERVICES, serviceId, callback);
};

/**
 * Get all services with optional filtering
 */
export const getServices = async (filter?: ServiceFilter): Promise<Service[]> => {
  const options: any = {};
  const whereConditions: [string, any, any][] = [];
  
  // Apply filters if provided
  if (filter) {
    if (filter.category) {
      whereConditions.push(['category', '==', filter.category]);
    }
    
    if (filter.subcategory) {
      whereConditions.push(['subcategory', '==', filter.subcategory]);
    }
    
    if (filter.minRating) {
      whereConditions.push(['averageRating', '>=', filter.minRating]);
    }
    
    if (filter.tags && filter.tags.length > 0) {
      // Note: This is a simplification - array-contains-any would be more appropriate
      // but is limited to 10 values and can't be combined with other array queries
      whereConditions.push(['tags', 'array-contains-any', filter.tags.slice(0, 10)]);
    }
    
    if (filter.searchTerm) {
      // Note: Full text search would require a specialized solution like Algolia
      // This is a simple approximation
      whereConditions.push(['title', '>=', filter.searchTerm]);
      whereConditions.push(['title', '<=', filter.searchTerm + '\uf8ff']);
    }
  }
  
  // Always filter for active services
  whereConditions.push(['isActive', '==', true]);
  
  if (whereConditions.length > 0) {
    options.whereConditions = whereConditions;
  }
  
  // Set orderBy if specified, default to newest first
  options.orderByField = 'createdAt';
  options.orderDirection = 'desc';
  
  return await getDocuments<Service>(COLLECTIONS.SERVICES, options);
};

/**
 * Get services by seller ID
 */
export const getServicesBySeller = async (sellerId: string): Promise<Service[]> => {
  try {
    // Option 1: Use a simpler query without sorting to avoid needing an index
    const options = {
      whereConditions: [
        ['sellerId', '==', sellerId]
      ]
      // Not specifying orderByField to avoid the index requirement
    };
    
    const services = await getDocuments<Service>(COLLECTIONS.SERVICES, options);
    
    // Sort the results in JavaScript instead
    return services.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime(); // descending order (newest first)
    });
  } catch (error) {
    console.error('Error fetching seller services:', error);
    // Return empty array on error rather than crashing
    return [];
  }
};

/**
 * Subscribe to real-time updates for a seller's services
 */
export const subscribeToSellerServices = (
  sellerId: string,
  callback: (services: Service[]) => void
): () => void => {
  // Return subscription to the collection
  return subscribeToCollection<Service>(
    COLLECTIONS.SERVICES,
    (services) => {
      // Sort the services in JavaScript after receiving them
      const sortedServices = services.sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime(); // descending order (newest first)
      });
      callback(sortedServices);
    },
    {
      whereConditions: [
        ['sellerId', '==', sellerId]
      ]
      // Not specifying orderByField to avoid the index requirement
    }
  );
};

/**
 * Update an existing service
 */
export const updateService = async (
  serviceId: string,
  updates: Partial<Service>
): Promise<void> => {
  return await updateDocument<Service>(COLLECTIONS.SERVICES, serviceId, updates);
};

/**
 * Delete a service
 */
export const deleteService = async (serviceId: string): Promise<void> => {
  // Instead of a hard delete, just mark as inactive
  return await updateDocument<Service>(COLLECTIONS.SERVICES, serviceId, { isActive: false });
};

/**
 * Upload a service image
 */
export const uploadImage = async (
  userId: string,
  serviceId: string,
  file: File
): Promise<string> => {
  return await uploadServiceImage(userId, serviceId, file);
};

/**
 * Add a service image
 */
export const addServiceImage = async (
  serviceId: string,
  userId: string,
  file: File
): Promise<void> => {
  const imageUrl = await uploadImage(userId, serviceId, file);
  
  // Get the current service
  const service = await getService(serviceId);
  
  if (!service) {
    throw new Error('Service not found');
  }
  
  // Update the service with the new image
  const updatedImages = [...(service.images || []), imageUrl];
  
  await updateService(serviceId, { images: updatedImages });
}; 