import { FirestoreTimestamp } from "../firebase/firestore";
import { OrderStatus } from "../utils/order-state.util";

// Status history entry for tracking order state changes
export interface StatusHistoryEntry {
  status: OrderStatus;
  timestamp: any; // Firebase Timestamp
  actorId: string; // User ID who made the change
  note?: string; // Optional note about the status change
}

// Delivery information
export interface DeliveryInfo {
  message: string;
  files: string[];
  deliveredAt: any; // Firebase Timestamp
}

// Revision request information
export interface RevisionRequest {
  message: string;
  requestedAt: any; // Firebase Timestamp
}

// Order interface
export interface Order {
  id: string;
  serviceId: string;
  sellerId: string;
  buyerId: string;
  
  // Package information
  packageType?: 'basic' | 'standard' | 'premium';
  packageId?: string;
  packageDetails?: {
    name: string;
    description?: string;
    deliveryTime: number;
    revisions: number;
    price: number;
  };
  
  // Order details
  requirements: string;
  attachments?: string[];
  
  // Financial information
  price: number;
  baseAmount?: number; // Base price before fees
  platformFee?: number; // Platform fee amount
  sellerAmount?: number; // Amount seller receives after fees
  totalAmount?: number; // Total amount charged to buyer
  
  // Order status
  status: OrderStatus;
  isPaid: boolean;
  
  // Order metadata
  createdAt: any; // Firebase Timestamp
  updatedAt: any; // Firebase Timestamp
  
  // Status timestamps
  paidAt?: any; // When the order was paid
  deliveredAt?: any; // When the seller delivered the work
  acceptedAt?: any; // When the buyer accepted the delivery
  completedAt?: any; // When the order was completed and payment released
  cancelledAt?: any; // When the order was cancelled
  disputedAt?: any; // When a dispute was opened
  revisionRequestedAt?: any; // When a revision was requested
  
  // Status history for audit trail
  statusHistory?: StatusHistoryEntry[];
  
  // Delivery information
  currentDelivery?: DeliveryInfo;
  
  // Revision information
  revisionCount?: number;
  currentRevisionRequest?: RevisionRequest;
  
  // Cancellation and dispute information
  cancellationReason?: string;
  disputeReason?: string;
  
  // Additional fields for custom features
  deliveryTime?: number; // Delivery time in days (may be in packageDetails)
}

export interface OrderDelivery {
  orderId: string;
  message: string;
  attachments: string[];
  createdAt: FirestoreTimestamp;
}

export interface OrderRevision {
  orderId: string;
  message: string;
  createdAt: FirestoreTimestamp;
} 