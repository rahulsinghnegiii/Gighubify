import {
  addDocument,
  getDocument,
  getDocuments,
  updateDocument,
  subscribeToDocument,
  subscribeToCollection,
  COLLECTIONS
} from '../firebase/firestore';

// Order status enum
export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  DELIVERED = 'delivered',
  REVISION_REQUESTED = 'revision_requested',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Order interface
export interface Order {
  id: string;
  serviceId: string;
  sellerId: string;
  buyerId: string;
  packageType?: 'basic' | 'standard' | 'premium'; // Made optional for backward compatibility
  packageId?: string; // Added for new order structure
  packageDetails?: { // Added for new order structure
    name: string;
    description?: string;
    deliveryTime: number;
    revisions: number;
    price: number;
  };
  requirements: string;
  attachments?: string[];
  price: number;
  totalAmount?: number; // Adding totalAmount field as optional for backward compatibility
  deliveryTime?: number; // Made optional since it may be inside packageDetails
  status: OrderStatus;
  isPaid: boolean;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
  revisionCount?: number; // Added for new order structure
}

/**
 * Create a new order
 */
export const createOrder = async (
  orderData: Omit<Order, 'id' | 'status' | 'isPaid' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  return await addDocument<Omit<Order, 'id'>>(COLLECTIONS.ORDERS, {
    ...orderData,
    status: OrderStatus.PENDING,
    isPaid: false
  });
};

/**
 * Get an order by ID
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
  return await getDocument<Order>(COLLECTIONS.ORDERS, orderId);
};

/**
 * Update an order's status
 */
export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
): Promise<void> => {
  await updateDocument<Order>(COLLECTIONS.ORDERS, orderId, { status });
};

/**
 * Mark an order as paid
 */
export const markOrderAsPaid = async (orderId: string): Promise<void> => {
  await updateDocument<Order>(COLLECTIONS.ORDERS, orderId, { 
    isPaid: true,
    status: OrderStatus.IN_PROGRESS 
  });
};

/**
 * Mark an order as delivered
 */
export const markOrderAsDelivered = async (
  orderId: string,
  deliverableFiles: string[]
): Promise<void> => {
  await updateDocument<Order>(COLLECTIONS.ORDERS, orderId, {
    status: OrderStatus.DELIVERED,
    attachments: deliverableFiles
  });
};

/**
 * Complete an order
 */
export const completeOrder = async (orderId: string): Promise<void> => {
  await updateDocument<Order>(COLLECTIONS.ORDERS, orderId, {
    status: OrderStatus.COMPLETED,
    completedAt: new Date()
  });
};

/**
 * Cancel an order
 */
export const cancelOrder = async (
  orderId: string,
  cancellationReason: string
): Promise<void> => {
  await updateDocument<Order>(COLLECTIONS.ORDERS, orderId, {
    status: OrderStatus.CANCELLED,
    cancellationReason
  });
};

/**
 * Request a revision for an order
 */
export const requestRevision = async (
  orderId: string,
  revisionInstructions: string
): Promise<void> => {
  await updateDocument<Order>(COLLECTIONS.ORDERS, orderId, {
    status: OrderStatus.REVISION_REQUESTED,
    revisionInstructions
  });
};

/**
 * Get orders for a buyer
 */
export const getBuyerOrders = async (buyerId: string): Promise<Order[]> => {
  return await getDocuments<Order>(COLLECTIONS.ORDERS, {
    whereConditions: [['buyerId', '==', buyerId]],
    orderByField: 'createdAt',
    orderDirection: 'desc'
  });
};

/**
 * Get orders for a seller
 */
export const getSellerOrders = async (sellerId: string): Promise<Order[]> => {
  return await getDocuments<Order>(COLLECTIONS.ORDERS, {
    whereConditions: [['sellerId', '==', sellerId]],
    orderByField: 'createdAt',
    orderDirection: 'desc'
  });
};

/**
 * Get active orders for a seller (in progress or revision requested)
 */
export const getActiveSellerOrders = async (sellerId: string): Promise<Order[]> => {
  return await getDocuments<Order>(COLLECTIONS.ORDERS, {
    whereConditions: [
      ['sellerId', '==', sellerId],
      ['status', 'in', [OrderStatus.IN_PROGRESS, OrderStatus.REVISION_REQUESTED]]
    ],
    orderByField: 'createdAt',
    orderDirection: 'desc'
  });
};

/**
 * Subscribe to a specific order
 */
export const subscribeToOrder = (
  orderId: string,
  callback: (order: Order | null) => void
): () => void => {
  return subscribeToDocument<Order>(COLLECTIONS.ORDERS, orderId, callback);
};

/**
 * Subscribe to buyer orders
 */
export const subscribeToBuyerOrders = (
  buyerId: string,
  callback: (orders: Order[]) => void
): () => void => {
  return subscribeToCollection<Order>(COLLECTIONS.ORDERS, callback, {
    whereConditions: [['buyerId', '==', buyerId]],
    orderByField: 'createdAt',
    orderDirection: 'desc'
  });
};

/**
 * Subscribe to seller orders
 */
export const subscribeToSellerOrders = (
  sellerId: string,
  callback: (orders: Order[]) => void
): () => void => {
  return subscribeToCollection<Order>(COLLECTIONS.ORDERS, callback, {
    whereConditions: [['sellerId', '==', sellerId]],
    orderByField: 'createdAt',
    orderDirection: 'desc'
  });
}; 