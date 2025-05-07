import {
  COLLECTIONS,
  getDocument,
  getDocuments,
  updateDocument,
  addDocument,
  serverTimestamp
} from '../firebase/firestore';
import { Service } from '../models/service.model';
import { getUserProfile } from './user.service';
import { Order } from '../models/order.model';

// Define Fresh Picks Config interface
export interface FreshPicksConfig {
  currentGigs: string[]; // Array of gigIds
  lastRotation: any; // Timestamp
  recentlyShownGigs: string[]; // Array of gigIds to avoid repeats
}

// Define the collection name for FreshPicks config
const FRESH_PICKS_COLLECTION = 'freshPicks';
const FRESH_PICKS_CONFIG_ID = 'config';

/**
 * Get the current fresh picks configuration
 */
export const getFreshPicksConfig = async (): Promise<FreshPicksConfig | null> => {
  try {
    // Try to get from Firestore first
    const config = await getDocument<FreshPicksConfig>(FRESH_PICKS_COLLECTION, FRESH_PICKS_CONFIG_ID);
    return config;
  } catch (error) {
    console.error('Error fetching fresh picks config from Firestore:', error);
    
    // Try to get from localStorage as fallback
    try {
      const localConfig = localStorage.getItem('freshPicks');
      
      if (localConfig) {
        const parsedConfig = JSON.parse(localConfig);
        
        // Convert the ISO date string back to a Date object that mimics Firestore timestamp
        if (parsedConfig.lastRotation) {
          const date = new Date(parsedConfig.lastRotation);
          parsedConfig.lastRotation = {
            toDate: () => date
          };
        }
        
        console.log('Using fresh picks config from localStorage fallback');
        return parsedConfig as FreshPicksConfig;
      }
    } catch (storageError) {
      console.error('Error reading from localStorage:', storageError);
    }
    
    return null;
  }
};

/**
 * Get the current fresh picks gigs
 */
export const getFreshPicks = async (limit: number = 6): Promise<Service[]> => {
  try {
    // Get the current configuration
    const config = await getFreshPicksConfig();
    
    if (!config) {
      // If no config exists, get fresh picks based on criteria
      return await getNewFreshPicks(limit);
    }
    
    // Check if we need to rotate (lastRotation was more than 1 hour ago)
    const lastRotation = config.lastRotation?.toDate ? config.lastRotation.toDate() : new Date(0);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    if (lastRotation < oneHourAgo) {
      // Time to rotate - get new fresh picks
      console.log('Fresh picks are stale, getting new ones');
      return await getNewFreshPicks(limit, config.recentlyShownGigs);
    }
    
    // Otherwise, use the current fresh picks
    console.log('Using existing fresh picks');
    return await getFreshPicksByIds(config.currentGigs);
  } catch (error) {
    console.error('Error fetching fresh picks:', error);
    return [];
  }
};

/**
 * Get fresh picks by their IDs
 */
const getFreshPicksByIds = async (gigIds: string[]): Promise<Service[]> => {
  try {
    const freshPicks: Service[] = [];
    
    for (const gigId of gigIds) {
      const service = await getDocument<Service>(COLLECTIONS.SERVICES, gigId);
      if (service && service.isActive) {
        freshPicks.push(service);
      }
    }
    
    return freshPicks;
  } catch (error) {
    console.error('Error fetching fresh picks by IDs:', error);
    return [];
  }
};

/**
 * Get new fresh picks based on criteria:
 * - Editors who joined in the last 30 days OR
 * - Editors who have 0-5 completed orders
 */
const getNewFreshPicks = async (
  limit: number = 6,
  excludeGigIds: string[] = []
): Promise<Service[]> => {
  try {
    // Get all active services
    const allServices = await getDocuments<Service>(COLLECTIONS.SERVICES, {
      whereConditions: [
        ['isActive', '==', true]
      ]
    });
    
    // Filter out excluded gigs
    const availableServices = allServices.filter(
      service => !excludeGigIds.includes(service.id)
    );
    
    // Array to store eligible services
    const eligibleServices: Service[] = [];
    
    // Check each service for eligibility
    for (const service of availableServices) {
      // Get the seller info to check join date
      const seller = await getUserProfile(service.sellerId);
      
      if (!seller) continue;
      
      // Check if seller joined in the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const joinDate = seller.createdAt?.toDate ? seller.createdAt.toDate() : new Date(0);
      const isNewSeller = joinDate > thirtyDaysAgo;
      
      if (isNewSeller) {
        eligibleServices.push(service);
        continue;
      }
      
      // Check seller's completed orders count
      const sellerOrders = await getDocuments<Order>(COLLECTIONS.ORDERS, {
        whereConditions: [
          ['sellerId', '==', service.sellerId],
          ['status', '==', 'completed']
        ]
      });
      
      if (sellerOrders.length <= 5) {
        eligibleServices.push(service);
      }
    }
    
    // Shuffle the eligible services
    const shuffledServices = eligibleServices.sort(() => 0.5 - Math.random());
    
    // Take the required number of services
    const pickedServices = shuffledServices.slice(0, limit);
    
    // If we don't have enough services, reuse some from the excluded list
    if (pickedServices.length < limit && excludeGigIds.length > 0) {
      const missingCount = limit - pickedServices.length;
      
      // Get some services from the excluded list
      const excludedServices = await getFreshPicksByIds(excludeGigIds.slice(0, missingCount));
      pickedServices.push(...excludedServices);
    }
    
    // Try to update the fresh picks configuration, but don't let it block returning results
    try {
      await updateFreshPicksConfig(pickedServices, excludeGigIds);
    } catch (error) {
      console.error('Failed to update fresh picks config, but continuing with results:', error);
      // Don't rethrow - we still want to return the fresh picks even if the config update fails
    }
    
    return pickedServices;
  } catch (error) {
    console.error('Error getting new fresh picks:', error);
    return [];
  }
};

/**
 * Update the fresh picks configuration with new picks
 */
const updateFreshPicksConfig = async (
  freshPicks: Service[],
  previouslyShownGigs: string[]
): Promise<void> => {
  try {
    const currentGigIds = freshPicks.map(service => service.id);
    
    // Create new recentlyShownGigs list, adding current gigs and keeping the history
    // without duplicates
    const allShownGigs = [...currentGigIds, ...previouslyShownGigs];
    const recentlyShownGigs = Array.from(new Set(allShownGigs));
    
    const config: FreshPicksConfig = {
      currentGigs: currentGigIds,
      lastRotation: serverTimestamp(),
      recentlyShownGigs
    };
    
    try {
      // Try to update the configuration
      await updateDocument(FRESH_PICKS_COLLECTION, FRESH_PICKS_CONFIG_ID, config);
      console.log('Fresh picks config updated');
    } catch (permissionError) {
      // Handle Firestore permission errors specifically
      if (permissionError instanceof Error && 
          permissionError.message.includes('permission')) {
        console.warn('Fresh picks config could not be saved due to permission issues. ' + 
                     'To fix this, update your Firestore rules to allow write access to the freshPicks collection ' +
                     'or use local storage fallback.');
        
        // Use localStorage as a fallback to store the config temporarily
        try {
          localStorage.setItem('freshPicks', JSON.stringify({
            ...config,
            lastRotation: new Date().toISOString() // Convert timestamp to string for localStorage
          }));
          console.log('Fresh picks config saved to localStorage as fallback');
        } catch (storageError) {
          console.error('Could not save to localStorage:', storageError);
        }
      } else {
        // Rethrow if it's not a permission error
        throw permissionError;
      }
    }
  } catch (error) {
    console.error('Error updating fresh picks config:', error);
    // Continue execution, don't fail the app
  }
};

/**
 * Manual function to rotate fresh picks (for testing or admin panel)
 */
export const rotateFreshPicks = async (limit: number = 6): Promise<Service[]> => {
  try {
    const config = await getFreshPicksConfig();
    const excludeGigIds = config?.recentlyShownGigs || [];
    
    return await getNewFreshPicks(limit, excludeGigIds);
  } catch (error) {
    console.error('Error rotating fresh picks:', error);
    return [];
  }
}; 