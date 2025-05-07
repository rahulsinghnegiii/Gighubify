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
import { collection, where, getDocs, query, limit as limitQuery } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { DocumentData, Query, WhereFilterOp } from 'firebase/firestore';

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
export const getServices = async (filter: ServiceFilter = {}, limit: number = 20): Promise<Service[]> => {
  try {
    // Create query with where conditions
    const collectionRef = collection(db, 'services');
    const whereConditions: [string, WhereFilterOp, any][] = [];
    
    // Add where conditions based on filter
    if (filter.minPrice !== undefined && filter.minPrice > 0) {
      whereConditions.push(['packages.0.price', '>=', filter.minPrice]);
    }
    
    if (filter.maxPrice !== undefined) {
      whereConditions.push(['packages.0.price', '<=', filter.maxPrice]);
    }
    
    if (filter.category) {
      whereConditions.push(['category', '==', filter.category]);
    }
    
    if (filter.isStarterGig) {
      whereConditions.push(['isStarterGig', '==', true]);
    }
    
    // Apply where conditions to query
    let firestoreQuery: Query<DocumentData>;
    
    if (whereConditions.length > 0) {
      // Build the query with conditions
      const queryConstraints = whereConditions.map(condition => 
        where(condition[0], condition[1], condition[2])
      );
      
      // Add limit constraint
      queryConstraints.push(limitQuery(limit));
      
      // Create the query with all constraints
      firestoreQuery = query(collectionRef, ...queryConstraints);
    } else {
      // Simple query with just the limit
      firestoreQuery = query(collectionRef, limitQuery(limit));
    }
    
    // Execute query
    const querySnapshot = await getDocs(firestoreQuery);
    let services: Service[] = [];
    
    // Convert query results to Service objects
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Partial<Service>;
      services.push({
        ...data,
        id: doc.id
      } as Service);
    });
    
    // Apply additional filters that can't be done directly in Firestore
    
    // Filter by categories array (if specified)
    if (filter.categories && filter.categories.length > 0) {
      services = services.filter(service => 
        filter.categories!.includes(service.category)
      );
    }
    
    // Filter by tags (we can only use one array-contains-any per query in Firestore)
    if (filter.tags && filter.tags.length > 0) {
      const tagsSet = new Set(filter.tags);
      services = services.filter(service => 
        service.tags && service.tags.some(tag => tagsSet.has(tag))
      );
    }
    
    // Filter by vibes (similar to tags)
    if (filter.vibes && filter.vibes.length > 0) {
      const vibesSet = new Set(filter.vibes);
      services = services.filter(service => 
        service.vibes && service.vibes.some(vibe => vibesSet.has(vibe))
      );
    }
    
    // Filter by express delivery (24 hours or less)
    if (filter.expressDelivery) {
      services = services.filter(service => {
        const deliveryTimeInHours = (service.packages[0]?.deliveryTime || 1) * 24;
        return deliveryTimeInHours <= 24;
      });
    }
    
    // Search query - filter by title or description (case insensitive)
    if (filter.searchQuery) {
      const searchLower = filter.searchQuery.toLowerCase();
      services = services.filter(service => 
        service.title.toLowerCase().includes(searchLower) || 
        service.description.toLowerCase().includes(searchLower)
      );
    }
    
    return services;
  } catch (error) {
    console.error('Error getting services:', error);
    throw error;
  }
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