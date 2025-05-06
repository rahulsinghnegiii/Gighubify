import { FirestoreTimestamp } from "../firebase/firestore";

export interface Order {
  id: string;
  serviceId: string;
  sellerId: string;
  buyerId: string;
  packageId: string;
  packageDetails: {
    name: string;
    description: string;
    deliveryTime: number;
    revisions: number;
    price: number;
  };
  requirements: string;
  attachments?: string[];
  status: OrderStatus;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  acceptedAt?: FirestoreTimestamp;
  deliveredAt?: FirestoreTimestamp;
  completedAt?: FirestoreTimestamp;
  cancelledAt?: FirestoreTimestamp;
  revisionCount: number;
  totalAmount: number;
  isPaid: boolean;
  paymentId?: string;
  paymentMethod?: string;
}

export enum OrderStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REVISION = 'revision',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed'
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