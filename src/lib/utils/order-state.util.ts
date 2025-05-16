/**
 * Order state transition utility
 * 
 * This file contains utility functions and constants for managing order states,
 * including valid state transitions and permissions for different actor types.
 */

// Order status enum
export enum OrderStatus {
  PENDING = 'pending',           // Initial state, order created but not paid
  IN_PROGRESS = 'in_progress',   // Order paid, seller is working
  DELIVERED = 'delivered',       // Seller has submitted work
  REVISION_REQUESTED = 'revision_requested', // Buyer requested changes
  ACCEPTED = 'accepted',         // Buyer accepted the delivery
  COMPLETED = 'completed',       // Payment released to seller
  CANCELLED = 'cancelled',       // Order terminated
  DISPUTED = 'disputed'          // Dispute opened
}

// Actor types
export enum Actor {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
  SYSTEM = 'system'
}

// Define valid transitions for each actor type
interface StateTransitionRules {
  [fromState: string]: {
    [toState: string]: Actor[];
  }
}

/**
 * State transition rules
 * 
 * This defines which actor types can perform which state transitions.
 * Format: { fromState: { toState: [allowed actors] } }
 */
const STATE_TRANSITION_RULES: StateTransitionRules = {
  [OrderStatus.PENDING]: {
    [OrderStatus.IN_PROGRESS]: [Actor.SYSTEM],
    [OrderStatus.CANCELLED]: [Actor.BUYER, Actor.SELLER, Actor.ADMIN]
  },
  
  [OrderStatus.IN_PROGRESS]: {
    [OrderStatus.DELIVERED]: [Actor.SELLER],
    [OrderStatus.CANCELLED]: [Actor.BUYER, Actor.SELLER, Actor.ADMIN],
    [OrderStatus.DISPUTED]: [Actor.BUYER, Actor.SELLER]
  },
  
  [OrderStatus.DELIVERED]: {
    [OrderStatus.REVISION_REQUESTED]: [Actor.BUYER],
    [OrderStatus.ACCEPTED]: [Actor.BUYER],
    [OrderStatus.CANCELLED]: [Actor.ADMIN],
    [OrderStatus.DISPUTED]: [Actor.BUYER, Actor.SELLER]
  },
  
  [OrderStatus.REVISION_REQUESTED]: {
    [OrderStatus.DELIVERED]: [Actor.SELLER],
    [OrderStatus.CANCELLED]: [Actor.ADMIN],
    [OrderStatus.DISPUTED]: [Actor.BUYER, Actor.SELLER]
  },
  
  [OrderStatus.ACCEPTED]: {
    [OrderStatus.COMPLETED]: [Actor.SYSTEM, Actor.ADMIN],
    [OrderStatus.DISPUTED]: [Actor.BUYER, Actor.SELLER]
  },
  
  [OrderStatus.COMPLETED]: {
    [OrderStatus.DISPUTED]: [Actor.BUYER, Actor.SELLER, Actor.ADMIN]
  },
  
  [OrderStatus.CANCELLED]: {
    // Final state, no transitions allowed
  },
  
  [OrderStatus.DISPUTED]: {
    [OrderStatus.COMPLETED]: [Actor.ADMIN],
    [OrderStatus.CANCELLED]: [Actor.ADMIN]
  }
};

/**
 * Get a list of valid next states for a given current state and actor type
 * 
 * @param currentState The current state of the order
 * @param actorType The type of actor attempting the transition
 * @returns Array of valid next states
 */
export const getValidNextStates = (
  currentState: OrderStatus,
  actorType: Actor
): OrderStatus[] => {
  const transitions = STATE_TRANSITION_RULES[currentState] || {};
  
  return Object.entries(transitions)
    .filter(([_, allowedActors]) => allowedActors.includes(actorType))
    .map(([nextState]) => nextState as OrderStatus);
};

/**
 * Check if a state transition is valid
 * 
 * @param fromState Current state
 * @param toState Target state
 * @param actorType Actor attempting the transition
 * @returns boolean indicating if transition is allowed
 */
export const isValidTransition = (
  fromState: OrderStatus,
  toState: OrderStatus,
  actorType: Actor
): boolean => {
  // If trying to transition to the same state, allow it
  if (fromState === toState) {
    return true;
  }
  
  // Get the allowed actors for this transition
  const transitionRules = STATE_TRANSITION_RULES[fromState] || {};
  const allowedActors = transitionRules[toState] || [];
  
  // Admin can do anything if the transition exists in the rules
  if (actorType === Actor.ADMIN && toState in transitionRules) {
    return true;
  }
  
  return allowedActors.includes(actorType);
};

/**
 * Get a human-readable description of an order status
 * 
 * @param status The order status
 * @returns Human-readable description
 */
export const getOrderStatusDescription = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'Order created, waiting for payment';
    case OrderStatus.IN_PROGRESS:
      return 'Order is in progress, seller is working';
    case OrderStatus.DELIVERED:
      return 'Work has been delivered, waiting for buyer review';
    case OrderStatus.REVISION_REQUESTED:
      return 'Buyer has requested revisions';
    case OrderStatus.ACCEPTED:
      return 'Delivery has been accepted, finalizing order';
    case OrderStatus.COMPLETED:
      return 'Order completed, payment released to seller';
    case OrderStatus.CANCELLED:
      return 'Order has been cancelled';
    case OrderStatus.DISPUTED:
      return 'Order is in dispute resolution';
    default:
      return 'Unknown status';
  }
};

/**
 * Get a color for the order status (for UI display)
 * 
 * @param status The order status
 * @returns Tailwind CSS color class
 */
export const getOrderStatusColor = (status: OrderStatus): string => {
  switch (status) {
    case OrderStatus.PENDING:
      return 'text-yellow-500';
    case OrderStatus.IN_PROGRESS:
      return 'text-blue-500';
    case OrderStatus.DELIVERED:
      return 'text-purple-500';
    case OrderStatus.REVISION_REQUESTED:
      return 'text-orange-500';
    case OrderStatus.ACCEPTED:
      return 'text-green-400';
    case OrderStatus.COMPLETED:
      return 'text-green-600';
    case OrderStatus.CANCELLED:
      return 'text-red-500';
    case OrderStatus.DISPUTED:
      return 'text-red-600';
    default:
      return 'text-gray-500';
  }
};

/**
 * Get the appropriate action button text based on next status
 * 
 * @param nextStatus The next status
 * @returns Button text
 */
export const getActionButtonText = (nextStatus: OrderStatus): string => {
  switch (nextStatus) {
    case OrderStatus.DELIVERED:
      return 'Deliver Work';
    case OrderStatus.REVISION_REQUESTED:
      return 'Request Revision';
    case OrderStatus.ACCEPTED:
      return 'Accept Delivery';
    case OrderStatus.CANCELLED:
      return 'Cancel Order';
    case OrderStatus.DISPUTED:
      return 'Open Dispute';
    default:
      return 'Update Status';
  }
};

/**
 * Get a list of order statuses that are considered "active" for a seller
 * 
 * @returns Array of active order statuses
 */
export const getActiveSellerStatuses = (): OrderStatus[] => {
  return [
    OrderStatus.IN_PROGRESS,
    OrderStatus.DELIVERED,
    OrderStatus.REVISION_REQUESTED
  ];
};

/**
 * Get a list of order statuses that are considered "active" for a buyer
 * 
 * @returns Array of active order statuses
 */
export const getActiveBuyerStatuses = (): OrderStatus[] => {
  return [
    OrderStatus.IN_PROGRESS,
    OrderStatus.DELIVERED,
    OrderStatus.REVISION_REQUESTED
  ];
};

/**
 * Check if the order is in a final state (completed, cancelled, etc.)
 * 
 * @param status The order status to check
 * @returns boolean indicating if the order is in a final state
 */
export const isOrderInFinalState = (status: OrderStatus): boolean => {
  return [
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED
  ].includes(status);
};

/**
 * Check if the order is in an active state (still in progress or requiring attention)
 * 
 * @param status The order status to check
 * @returns boolean indicating if the order is active
 */
export const isOrderActive = (status: OrderStatus): boolean => {
  return [
    OrderStatus.IN_PROGRESS,
    OrderStatus.DELIVERED,
    OrderStatus.REVISION_REQUESTED,
    OrderStatus.DISPUTED
  ].includes(status);
}; 