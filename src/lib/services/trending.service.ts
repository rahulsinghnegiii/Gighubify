import {
  COLLECTIONS,
  addDocument,
  getDocument,
  getDocuments,
  updateDocument,
  subscribeToCollection
} from '../firebase/firestore';
import { Service } from '../models/service.model';

// Define the GigMetrics interface as specified in the development plan
export interface GigMetrics {
  gigId: string;
  clicks: number;
  clicksLast24h: number;
  saves: number;
  savesLast24h: number;
  ordersLast24h: number;
  reviewsCount: number;
  refundsCount: number;
  trendingScore: number;
  lastCalculated: any; // Timestamp
}

// Create a new GigMetrics collection name
const METRICS_COLLECTION = 'gigMetrics';
const TRENDING_COLLECTION = 'trendingGigs';

/**
 * Track a click/view on a gig
 */
export const trackGigClick = async (gigId: string): Promise<void> => {
  try {
    // Get the current metrics for this gig
    const metrics = await getDocument<GigMetrics>(METRICS_COLLECTION, gigId);
    
    if (metrics) {
      // Update the existing metrics
      await updateDocument<GigMetrics>(METRICS_COLLECTION, gigId, {
        clicks: metrics.clicks + 1,
        clicksLast24h: metrics.clicksLast24h + 1,
      });
    } else {
      // Create new metrics document for this gig
      await addDocument<GigMetrics>(METRICS_COLLECTION, {
        gigId,
        clicks: 1,
        clicksLast24h: 1,
        saves: 0,
        savesLast24h: 0,
        ordersLast24h: 0,
        reviewsCount: 0,
        refundsCount: 0,
        trendingScore: 0,
        lastCalculated: new Date()
      });
    }
  } catch (error) {
    console.error('Error tracking gig click:', error);
  }
};

/**
 * Track when a user saves/bookmarks a gig
 */
export const trackGigSave = async (gigId: string): Promise<void> => {
  try {
    // Get the current metrics for this gig
    const metrics = await getDocument<GigMetrics>(METRICS_COLLECTION, gigId);
    
    if (metrics) {
      // Update the existing metrics
      await updateDocument<GigMetrics>(METRICS_COLLECTION, gigId, {
        saves: metrics.saves + 1,
        savesLast24h: metrics.savesLast24h + 1,
      });
    } else {
      // Create new metrics document for this gig
      await addDocument<GigMetrics>(METRICS_COLLECTION, {
        gigId,
        clicks: 0,
        clicksLast24h: 0,
        saves: 1,
        savesLast24h: 1,
        ordersLast24h: 0,
        reviewsCount: 0,
        refundsCount: 0,
        trendingScore: 0,
        lastCalculated: new Date()
      });
    }
  } catch (error) {
    console.error('Error tracking gig save:', error);
  }
};

/**
 * Track when a gig receives an order
 */
export const trackGigOrder = async (gigId: string): Promise<void> => {
  try {
    // Get the current metrics for this gig
    const metrics = await getDocument<GigMetrics>(METRICS_COLLECTION, gigId);
    
    if (metrics) {
      // Update the existing metrics
      await updateDocument<GigMetrics>(METRICS_COLLECTION, gigId, {
        ordersLast24h: metrics.ordersLast24h + 1,
      });
    } else {
      // Create new metrics document for this gig
      await addDocument<GigMetrics>(METRICS_COLLECTION, {
        gigId,
        clicks: 0,
        clicksLast24h: 0,
        saves: 0,
        savesLast24h: 0,
        ordersLast24h: 1,
        reviewsCount: 0,
        refundsCount: 0,
        trendingScore: 0,
        lastCalculated: new Date()
      });
    }
  } catch (error) {
    console.error('Error tracking gig order:', error);
  }
};

/**
 * Track when a gig receives a review
 */
export const trackGigReview = async (gigId: string): Promise<void> => {
  try {
    // Get the current metrics for this gig
    const metrics = await getDocument<GigMetrics>(METRICS_COLLECTION, gigId);
    
    if (metrics) {
      // Update the existing metrics
      await updateDocument<GigMetrics>(METRICS_COLLECTION, gigId, {
        reviewsCount: metrics.reviewsCount + 1,
      });
    } else {
      // Create new metrics document for this gig
      await addDocument<GigMetrics>(METRICS_COLLECTION, {
        gigId,
        clicks: 0,
        clicksLast24h: 0,
        saves: 0,
        savesLast24h: 0,
        ordersLast24h: 0,
        reviewsCount: 1,
        refundsCount: 0,
        trendingScore: 0,
        lastCalculated: new Date()
      });
    }
  } catch (error) {
    console.error('Error tracking gig review:', error);
  }
};

/**
 * Track when a gig receives a refund
 */
export const trackGigRefund = async (gigId: string): Promise<void> => {
  try {
    // Get the current metrics for this gig
    const metrics = await getDocument<GigMetrics>(METRICS_COLLECTION, gigId);
    
    if (metrics) {
      // Update the existing metrics
      await updateDocument<GigMetrics>(METRICS_COLLECTION, gigId, {
        refundsCount: metrics.refundsCount + 1,
      });
    } else {
      // Create new metrics document for this gig
      await addDocument<GigMetrics>(METRICS_COLLECTION, {
        gigId,
        clicks: 0,
        clicksLast24h: 0,
        saves: 0,
        savesLast24h: 0,
        ordersLast24h: 0,
        reviewsCount: 0,
        refundsCount: 1,
        trendingScore: 0,
        lastCalculated: new Date()
      });
    }
  } catch (error) {
    console.error('Error tracking gig refund:', error);
  }
};

/**
 * Calculate the trending score for a gig
 * Using the formula: (Clicks + Saves + Orders in Last 24h) * 1.5 + (Reviews * 3) - (Refunds * 2)
 */
export const calculateTrendingScore = (metrics: GigMetrics): number => {
  const activityScore = (metrics.clicksLast24h + metrics.savesLast24h + metrics.ordersLast24h) * 1.5;
  const reviewScore = metrics.reviewsCount * 3;
  const refundPenalty = metrics.refundsCount * 2;
  
  return activityScore + reviewScore - refundPenalty;
};

/**
 * Get the top trending gigs
 */
export const getTrendingGigs = async (limit: number = 10): Promise<Service[]> => {
  try {
    // Get trending gig IDs from the trending collection
    const trendingData = await getDocuments<{gigId: string, score: number}>(TRENDING_COLLECTION, {
      orderByField: 'score',
      orderDirection: 'desc',
      limitCount: limit
    });
    
    // Get the full service details for each trending gig
    const trendingGigIds = trendingData.map(item => item.gigId);
    
    if (trendingGigIds.length === 0) {
      // If no trending gigs are defined yet, return top rated services
      return await getDocuments<Service>(COLLECTIONS.SERVICES, {
        orderByField: 'averageRating',
        orderDirection: 'desc',
        limitCount: limit,
        whereConditions: [
          ['isActive', '==', true]
        ]
      });
    }
    
    // Fetch each service by ID
    const trendingServices: Service[] = [];
    
    for (const gigId of trendingGigIds) {
      const service = await getDocument<Service>(COLLECTIONS.SERVICES, gigId);
      if (service && service.isActive) {
        trendingServices.push(service);
      }
    }
    
    return trendingServices;
  } catch (error) {
    console.error('Error fetching trending gigs:', error);
    return [];
  }
};

/**
 * Subscribe to trending gigs (for real-time updates)
 */
export const subscribeToTrendingGigs = (
  callback: (services: Service[]) => void,
  limit: number = 10
): () => void => {
  // First, subscribe to the trending collection
  return subscribeToCollection<{gigId: string, score: number}>(
    TRENDING_COLLECTION,
    async (trendingData) => {
      // When trending data updates, fetch the full services
      const trendingGigIds = trendingData
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.gigId);
      
      if (trendingGigIds.length === 0) {
        // Fallback to top rated services
        const topServices = await getDocuments<Service>(COLLECTIONS.SERVICES, {
          orderByField: 'averageRating',
          orderDirection: 'desc',
          limitCount: limit,
          whereConditions: [
            ['isActive', '==', true]
          ]
        });
        
        callback(topServices);
        return;
      }
      
      // Fetch each service by ID
      const trendingServices: Service[] = [];
      
      for (const gigId of trendingGigIds) {
        const service = await getDocument<Service>(COLLECTIONS.SERVICES, gigId);
        if (service && service.isActive) {
          trendingServices.push(service);
        }
      }
      
      callback(trendingServices);
    },
    {
      orderByField: 'score',
      orderDirection: 'desc',
      limitCount: limit
    }
  );
};

// This function would normally be called by a Cloud Function
// For development purposes, we can call it manually or create a background task
export const updateTrendingGigs = async (): Promise<void> => {
  try {
    // Get all gig metrics
    const allMetrics = await getDocuments<GigMetrics>(METRICS_COLLECTION);
    
    // Calculate trending score for each gig
    const scoredGigs = allMetrics.map(metrics => {
      const score = calculateTrendingScore(metrics);
      return {
        gigId: metrics.gigId,
        score
      };
    });
    
    // Sort by score
    scoredGigs.sort((a, b) => b.score - a.score);
    
    // Take top 20 trending gigs
    const topTrending = scoredGigs.slice(0, 20);
    
    // Update or create records in the trending collection
    for (const trending of topTrending) {
      await updateDocument(TRENDING_COLLECTION, trending.gigId, trending);
    }
    
    console.log('Updated trending gigs successfully');
  } catch (error) {
    console.error('Error updating trending gigs:', error);
  }
}; 