import { FirestoreTimestamp } from "../firebase/firestore";

export interface Review {
  id: string;
  serviceId: string;
  sellerId: string;
  buyerId: string;
  orderId: string;
  rating: number;
  content: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  isPublic: boolean;
  buyerName: string;
  buyerImage?: string;
}

export interface ReviewSummary {
  totalCount: number;
  averageRating: number;
  ratingBreakdown: {
    1: number; // Count of 1-star reviews
    2: number; // Count of 2-star reviews
    3: number; // Count of 3-star reviews
    4: number; // Count of 4-star reviews
    5: number; // Count of 5-star reviews
  };
} 