import {
  addDocument,
  getDocument,
  getDocuments,
  updateDocument,
  COLLECTIONS
} from '../firebase/firestore';
import { getService, updateService } from './service.service';

// Review interface
export interface Review {
  id: string;
  serviceId: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  rating: number; // 1-5 stars
  comment: string;
  response?: string; // seller's response to the review
  isPublic: boolean;
  createdAt: any;
  updatedAt: any;
}

/**
 * Create a new review
 */
export const createReview = async (
  reviewData: Omit<Review, 'id' | 'isPublic' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  // Add the review
  const reviewId = await addDocument<Omit<Review, 'id'>>(COLLECTIONS.REVIEWS, {
    ...reviewData,
    isPublic: true
  });

  // Update the service's average rating
  const service = await getService(reviewData.serviceId);
  if (service) {
    const totalRating = (service.averageRating || 0) * (service.totalReviews || 0);
    const newTotalReviews = (service.totalReviews || 0) + 1;
    const newAverageRating = (totalRating + reviewData.rating) / newTotalReviews;

    await updateService(reviewData.serviceId, {
      averageRating: newAverageRating,
      totalReviews: newTotalReviews
    });
  }

  return reviewId;
};

/**
 * Get a review by ID
 */
export const getReview = async (reviewId: string): Promise<Review | null> => {
  return await getDocument<Review>(COLLECTIONS.REVIEWS, reviewId);
};

/**
 * Get reviews for a service
 */
export const getServiceReviews = async (
  serviceId: string,
  options?: {
    limitCount?: number;
    minRating?: number;
    maxRating?: number;
  }
): Promise<Review[]> => {
  const whereConditions: [string, any, any][] = [
    ['serviceId', '==', serviceId],
    ['isPublic', '==', true]
  ];

  if (options?.minRating) {
    whereConditions.push(['rating', '>=', options.minRating]);
  }

  if (options?.maxRating) {
    whereConditions.push(['rating', '<=', options.maxRating]);
  }

  return await getDocuments<Review>(COLLECTIONS.REVIEWS, {
    whereConditions,
    orderByField: 'createdAt',
    orderDirection: 'desc',
    limitCount: options?.limitCount
  });
};

/**
 * Get reviews for a seller
 */
export const getSellerReviews = async (
  sellerId: string,
  options?: {
    limitCount?: number;
    minRating?: number;
    maxRating?: number;
  }
): Promise<Review[]> => {
  const whereConditions: [string, any, any][] = [
    ['sellerId', '==', sellerId],
    ['isPublic', '==', true]
  ];

  if (options?.minRating) {
    whereConditions.push(['rating', '>=', options.minRating]);
  }

  if (options?.maxRating) {
    whereConditions.push(['rating', '<=', options.maxRating]);
  }

  return await getDocuments<Review>(COLLECTIONS.REVIEWS, {
    whereConditions,
    orderByField: 'createdAt',
    orderDirection: 'desc',
    limitCount: options?.limitCount
  });
};

/**
 * Check if a buyer has already reviewed an order
 */
export const hasOrderBeenReviewed = async (
  orderId: string,
  buyerId: string
): Promise<boolean> => {
  const reviews = await getDocuments<Review>(COLLECTIONS.REVIEWS, {
    whereConditions: [
      ['orderId', '==', orderId],
      ['buyerId', '==', buyerId]
    ]
  });

  return reviews.length > 0;
};

/**
 * Add seller response to a review
 */
export const addResponseToReview = async (
  reviewId: string,
  sellerId: string,
  response: string
): Promise<void> => {
  const review = await getReview(reviewId);

  if (!review) {
    throw new Error('Review not found');
  }

  if (review.sellerId !== sellerId) {
    throw new Error('Only the seller can respond to this review');
  }

  await updateDocument<Review>(COLLECTIONS.REVIEWS, reviewId, { response });
};

/**
 * Calculate average rating for a seller
 */
export const calculateSellerAverageRating = async (sellerId: string): Promise<number> => {
  const reviews = await getDocuments<Review>(COLLECTIONS.REVIEWS, {
    whereConditions: [
      ['sellerId', '==', sellerId],
      ['isPublic', '==', true]
    ]
  });

  if (reviews.length === 0) {
    return 0;
  }

  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return totalRating / reviews.length;
};

/**
 * Get buyer's reviews
 */
export const getBuyerReviews = async (buyerId: string): Promise<Review[]> => {
  return await getDocuments<Review>(COLLECTIONS.REVIEWS, {
    whereConditions: [
      ['buyerId', '==', buyerId]
    ],
    orderByField: 'createdAt',
    orderDirection: 'desc'
  });
}; 