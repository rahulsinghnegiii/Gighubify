import {
  addDocument,
  getDocument,
  getDocuments,
  updateDocument,
  subscribeToDocument,
  subscribeToCollection,
  COLLECTIONS,
  serverTimestamp
} from '../firebase/firestore';
import { 
  OrderStatus, 
  Actor, 
  isValidTransition, 
  getValidNextStates 
} from '../utils/order-state.util';
import { Order } from '../models/order.model';

// Order state transition error
export class OrderStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrderStateTransitionError';
  }
}

/**
 * Create a new order
 */
export const createOrder = async (
  orderData: Omit<Order, 'id' | 'status' | 'isPaid' | 'createdAt' | 'updatedAt' | 'statusHistory'>
): Promise<string> => {
  const timestamp = serverTimestamp();
  
  const initialStatus = OrderStatus.PENDING;
  
  // Create status history entry
  const statusHistory = [{
    status: initialStatus,
    timestamp,
    actorId: orderData.buyerId,
    note: 'Order created'
  }];
  
  return await addDocument<Omit<Order, 'id'>>(COLLECTIONS.ORDERS, {
    ...orderData,
    status: initialStatus,
    isPaid: false,
    statusHistory,
    revisionCount: 0
  });
};

/**
 * Get an order by ID
 */
export const getOrder = async (orderId: string): Promise<Order | null> => {
  return await getDocument<Order>(COLLECTIONS.ORDERS, orderId);
};

/**
 * Update an order's status with validation
 */
export const updateOrderStatus = async (
  orderId: string,
  newStatus: OrderStatus,
  actorId: string,
  actorType: Actor,
  note?: string
): Promise<void> => {
  // Get the current order
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  const currentStatus = order.status;
  
  // Validate the state transition
  if (!isValidTransition(currentStatus, newStatus, actorType)) {
    throw new OrderStateTransitionError(
      `Invalid transition from ${currentStatus} to ${newStatus} by ${actorType}`
    );
  }
  
  // Create timestamp for this status change
  const timestamp = serverTimestamp();
  
  // Create status history entry
  const statusHistoryEntry = {
    status: newStatus,
    timestamp,
    actorId,
    note: note || `Status changed from ${currentStatus} to ${newStatus}`
  };
  
  // Update order with new status and append to status history
  const updateData: Partial<Order> = {
    status: newStatus,
    updatedAt: timestamp,
    statusHistory: [...(order.statusHistory || []), statusHistoryEntry]
  };
  
  // Add specific timestamp based on the new status
  switch (newStatus) {
    case OrderStatus.IN_PROGRESS:
      updateData.paidAt = timestamp;
      break;
    case OrderStatus.DELIVERED:
      updateData.deliveredAt = timestamp;
      break;
    case OrderStatus.REVISION_REQUESTED:
      updateData.revisionRequestedAt = timestamp;
      updateData.revisionCount = (order.revisionCount || 0) + 1;
      updateData.currentRevisionRequest = {
        message: note || 'Revision requested',
        requestedAt: timestamp
      };
      break;
    case OrderStatus.ACCEPTED:
      updateData.acceptedAt = timestamp;
      break;
    case OrderStatus.COMPLETED:
      updateData.completedAt = timestamp;
      break;
    case OrderStatus.CANCELLED:
      updateData.cancelledAt = timestamp;
      if (note) {
        updateData.cancellationReason = note;
      }
      break;
    case OrderStatus.DISPUTED:
      updateData.disputedAt = timestamp;
      if (note) {
        updateData.disputeReason = note;
      }
      break;
  }
  
  await updateDocument(COLLECTIONS.ORDERS, orderId, updateData);
};

/**
 * Mark an order as paid and change status to IN_PROGRESS
 */
export const markOrderAsPaid = async (orderId: string): Promise<void> => {
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  if (order.isPaid) {
    console.log(`Order ${orderId} is already marked as paid`);
    return;
  }
  
  // Update payment status
  const updateData: Partial<Order> = {
    isPaid: true,
    updatedAt: serverTimestamp()
  };
  
  await updateDocument(COLLECTIONS.ORDERS, orderId, updateData);
  
  // Update order status to IN_PROGRESS
  await updateOrderStatus(
    orderId,
    OrderStatus.IN_PROGRESS,
    'system', // System is marking the order as paid
    Actor.SYSTEM,
    'Payment received, order in progress'
  );
};

/**
 * Submit delivery for an order
 */
export const deliverOrder = async (
  orderId: string,
  sellerId: string,
  message: string,
  deliverableFiles: string[]
): Promise<void> => {
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  // Verify the seller is authorized
  if (order.sellerId !== sellerId) {
    throw new Error('You are not authorized to deliver this order');
  }
  
  // Update order with delivery info
  const timestamp = serverTimestamp();
  const updateData: Partial<Order> = {
    currentDelivery: {
      message,
      files: deliverableFiles,
      deliveredAt: timestamp
    },
    updatedAt: timestamp
  };
  
  await updateDocument(COLLECTIONS.ORDERS, orderId, updateData);
  
  // Update order status to DELIVERED
  await updateOrderStatus(
    orderId,
    OrderStatus.DELIVERED,
    sellerId,
    Actor.SELLER,
    message
  );
};

/**
 * Buyer accepts delivery of an order
 */
export const acceptDelivery = async (
  orderId: string,
  buyerId: string,
  feedback?: string
): Promise<void> => {
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  // Verify the buyer is authorized
  if (order.buyerId !== buyerId) {
    throw new Error('You are not authorized to accept this delivery');
  }
  
  // Update order status to ACCEPTED
  await updateOrderStatus(
    orderId,
    OrderStatus.ACCEPTED,
    buyerId,
    Actor.BUYER,
    feedback || 'Delivery accepted'
  );
  
  // After acceptance, the system will automatically move to COMPLETED (in a real system, this would happen when escrow releases the funds)
  // This will be handled by the escrow service in future updates
  setTimeout(async () => {
    try {
      await updateOrderStatus(
        orderId,
        OrderStatus.COMPLETED,
        'system',
        Actor.SYSTEM,
        'Funds released to seller'
      );
    } catch (error) {
      console.error(`Error completing order ${orderId}:`, error);
    }
  }, 1000);
};

/**
 * Buyer requests a revision
 */
export const requestRevision = async (
  orderId: string,
  buyerId: string,
  revisionInstructions: string
): Promise<void> => {
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  // Verify the buyer is authorized
  if (order.buyerId !== buyerId) {
    throw new Error('You are not authorized to request a revision for this order');
  }
  
  // Update order status to REVISION_REQUESTED
  await updateOrderStatus(
    orderId,
    OrderStatus.REVISION_REQUESTED,
    buyerId,
    Actor.BUYER,
    revisionInstructions
  );
};

/**
 * Cancel an order
 */
export const cancelOrder = async (
  orderId: string,
  actorId: string,
  actorType: Actor,
  cancellationReason: string
): Promise<void> => {
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  // Verify authorization (depending on the actor type)
  if (actorType === Actor.BUYER && order.buyerId !== actorId) {
    throw new Error('You are not authorized to cancel this order');
  } else if (actorType === Actor.SELLER && order.sellerId !== actorId) {
    throw new Error('You are not authorized to cancel this order');
  }
  
  // Update order status to CANCELLED
  await updateOrderStatus(
    orderId,
    OrderStatus.CANCELLED,
    actorId,
    actorType,
    cancellationReason
  );
};

/**
 * Open a dispute for an order
 */
export const openDispute = async (
  orderId: string,
  actorId: string,
  actorType: Actor,
  disputeReason: string
): Promise<void> => {
  const order = await getOrder(orderId);
  if (!order) {
    throw new Error(`Order with ID ${orderId} not found`);
  }
  
  // Verify authorization (depending on the actor type)
  if (actorType === Actor.BUYER && order.buyerId !== actorId) {
    throw new Error('You are not authorized to open a dispute for this order');
  } else if (actorType === Actor.SELLER && order.sellerId !== actorId) {
    throw new Error('You are not authorized to open a dispute for this order');
  }
  
  // Update order status to DISPUTED
  await updateOrderStatus(
    orderId,
    OrderStatus.DISPUTED,
    actorId,
    actorType,
    disputeReason
  );
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
 * Get active orders for a seller (in progress, delivered, or revision requested)
 */
export const getActiveSellerOrders = async (sellerId: string): Promise<Order[]> => {
  return await getDocuments<Order>(COLLECTIONS.ORDERS, {
    whereConditions: [
      ['sellerId', '==', sellerId],
      ['status', 'in', [OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED, OrderStatus.REVISION_REQUESTED]]
    ],
    orderByField: 'createdAt',
    orderDirection: 'desc'
  });
};

/**
 * Get available actions for an order based on current status and actor
 */
export const getAvailableOrderActions = (order: Order, actorId: string): { 
  actorType: Actor,
  availableActions: OrderStatus[]
} => {
  let actorType: Actor;
  
  if (order.buyerId === actorId) {
    actorType = Actor.BUYER;
  } else if (order.sellerId === actorId) {
    actorType = Actor.SELLER;
  } else {
    // Assume it's an admin or system for now
    actorType = Actor.ADMIN;
  }
  
  const availableActions = getValidNextStates(order.status, actorType);
  
  return {
    actorType,
    availableActions
  };
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