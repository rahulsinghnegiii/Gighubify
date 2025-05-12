import { 
  addDocument, 
  getDocument, 
  updateDocument, 
  COLLECTIONS,
  getDocuments
} from '../firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Order, OrderStatus } from '../models/order.model';
import { getIPAddress, isIndianIP } from '../utils/geo.util';
import { getAuth } from 'firebase/auth';

// Flag to determine if we're in development mode
const DEV_MODE = true; // Toggle this to switch between local server and production

// Base URLs for the API endpoints
const BASE_URL = DEV_MODE 
  ? 'http://localhost:3001' 
  : 'https://us-central1-gighubify.cloudfunctions.net';

// Store mock payment data for development
const mockPayments = new Map();

// Payment gateway options
export enum PaymentGateway {
  RAZORPAY = 'razorpay',
  STRIPE = 'stripe'
}

// Payment status enum
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Payment model
export interface Payment {
  id: string;
  orderId: string;
  gatewayId: string;  // ID from the payment gateway
  gateway: PaymentGateway;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  paymentDetails?: any;
  createdAt: any;
  updatedAt: any;
  completedAt?: any;
}

// Get the appropriate payment gateway based on user's location
// Always returns Stripe as Razorpay is disabled
export const getAppropriateGateway = async (): Promise<PaymentGateway> => {
  // Always use Stripe regardless of location
  console.log("Using Stripe for all payments (Razorpay disabled)");
  return PaymentGateway.STRIPE;
  
  // Original code - commented out:
  /*
  try {
    const ipAddress = await getIPAddress();
    const isIndian = await isIndianIP(ipAddress);
    
    return isIndian ? PaymentGateway.RAZORPAY : PaymentGateway.STRIPE;
  } catch (error) {
    console.error("Error determining appropriate gateway:", error);
    // Default to Stripe for international users if there's an error
    return PaymentGateway.STRIPE;
  }
  */
};

// Create a new payment record
export const createPayment = async (
  orderId: string, 
  amount: number, 
  currency: string = 'USD',
  gateway?: PaymentGateway // If not provided, will be determined automatically
): Promise<{ paymentId: string, gatewayData: any }> => {
  try {
    // Get the order
    const order = await getDocument<Order>(COLLECTIONS.ORDERS, orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    
    // Always use Stripe regardless of what was passed
    gateway = PaymentGateway.STRIPE;
    
    // Prepare payment data
    const paymentData = {
      orderId,
      amount,
      currency,
      gateway,
      buyerId: order.buyerId,
      sellerId: order.sellerId,
      serviceId: order.serviceId
    };
    
    let result;
    
    if (DEV_MODE) {
      // Use the local development server
      console.log('Using local development server for payment initialization');
      try {
        // Direct HTTP request to the local server for the callable function
        const response = await fetch(`${BASE_URL}/initializePayment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: paymentData })
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const data = await response.json();
        result = data.result;
      } catch (error) {
        console.log('Local callable function failed, trying Express API', error);
        
        // Try the Express API endpoint
        const response = await fetch(`${BASE_URL}/api/initializePaymentExpress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
          throw new Error(`Express API responded with status: ${response.status}`);
        }
        
        result = await response.json();
      }
      
      const { paymentId, gatewayData } = result;
      
      // In development mode, store mock payment data locally instead of using Firestore
      console.log('Creating mock payment record locally');
      
      const mockPayment = {
        id: paymentId,
        orderId,
        gatewayId: gatewayData.id,
        gateway,
        amount,
        currency,
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Store in our mock storage
      mockPayments.set(paymentId, mockPayment);
      
      // No need to update Firestore in dev mode - just log the action
      console.log(`Mock operation: Updated order ${orderId} with paymentId ${paymentId} and payment method ${gateway}`);
      
      console.log('Mock payment created:', mockPayment);
      
      return { paymentId, gatewayData };
    } else {
      // Production mode - Use Firebase Functions
      try {
        // Call the appropriate Firebase function to initialize payment
        const functions = getFunctions();
        const initializePayment = httpsCallable(functions, 'initializePayment');
        
        const callableResult = await initializePayment(paymentData);
        result = callableResult.data as any;
      } catch (error) {
        console.log('Callable function failed, trying Express API endpoint', error);
        
        // If the callable function fails, try the Express API endpoint
        // Get the current user's ID token
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          throw new Error('User not authenticated');
        }
        
        const idToken = await currentUser.getIdToken();
        
        // Call the Express API endpoint
        const response = await fetch(`${BASE_URL}/api/initializePaymentExpress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`
          },
          body: JSON.stringify(paymentData)
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initialize payment');
        }
        
        result = await response.json();
      }
      
      const { paymentId, gatewayData } = result;
      
      // Create the payment record in Firestore
      await addDocument<Omit<Payment, 'id'>>(COLLECTIONS.PAYMENTS, {
        orderId,
        gatewayId: gatewayData.id,
        gateway,
        amount,
        currency,
        status: PaymentStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update the order with the payment ID
      await updateDocument(COLLECTIONS.ORDERS, orderId, {
        paymentId,
        paymentMethod: gateway
      });
      
      return { paymentId, gatewayData };
    }
  } catch (error) {
    console.error("Error creating payment:", error);
    throw error;
  }
};

// Get a mock payment (for development mode)
const getMockPayment = (paymentId: string): Payment | null => {
  return mockPayments.get(paymentId) || null;
};

// Verify and complete a Razorpay payment
export const verifyRazorpayPayment = async (
  paymentId: string,
  orderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
): Promise<boolean> => {
  try {
    if (DEV_MODE) {
      // Mock payment verification in development mode
      console.log(`Mock Razorpay payment verification: ${paymentId}, ${orderId}, ${razorpayPaymentId}`);
      
      // Update the mock payment data
      const mockPayment = getMockPayment(paymentId);
      if (mockPayment) {
        mockPayment.status = PaymentStatus.COMPLETED;
        mockPayment.completedAt = new Date();
        mockPayment.updatedAt = new Date();
        mockPayment.paymentDetails = { razorpayPaymentId };
        mockPayments.set(paymentId, mockPayment);
      }
      
      console.log(`Mock operation: Updated order ${orderId} as paid and active`);
      
      return true;
    }
    
    const functions = getFunctions();
    const verifyPayment = httpsCallable(functions, 'verifyRazorpayPayment');
    
    const result = await verifyPayment({
      paymentId,
      orderId,
      razorpayPaymentId,
      razorpaySignature
    });
    
    const { success } = result.data as any;
    
    if (success) {
      // Update payment status
      await updateDocument(COLLECTIONS.PAYMENTS, paymentId, {
        status: PaymentStatus.COMPLETED,
        completedAt: new Date(),
        updatedAt: new Date(),
        paymentDetails: {
          razorpayPaymentId
        }
      });
      
      // Mark order as paid
      await updateDocument(COLLECTIONS.ORDERS, orderId, {
        isPaid: true,
        status: OrderStatus.ACTIVE
      });
    }
    
    return success;
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    throw error;
  }
};

// Complete a Stripe payment after successful client-side confirmation
export const completeStripePayment = async (
  paymentId: string,
  orderId: string,
  stripePaymentIntentId: string
): Promise<boolean> => {
  try {
    if (DEV_MODE) {
      // Mock payment completion in development mode
      console.log(`Mock Stripe payment completion: ${paymentId}, ${orderId}, ${stripePaymentIntentId}`);
      
      // Update the mock payment data
      const mockPayment = getMockPayment(paymentId);
      if (mockPayment) {
        mockPayment.status = PaymentStatus.COMPLETED;
        mockPayment.completedAt = new Date();
        mockPayment.updatedAt = new Date();
        mockPayment.paymentDetails = { stripePaymentIntentId };
        mockPayments.set(paymentId, mockPayment);
      }
      
      try {
        // In DEV_MODE, we still want to update the Firestore order document
        // so it's marked as paid (if we have permission)
        await updateDocument(COLLECTIONS.ORDERS, orderId, {
          isPaid: true,
          status: OrderStatus.ACTIVE,
          paymentId: paymentId,
          paymentMethod: PaymentGateway.STRIPE
        });
        console.log(`Updated order ${orderId} as paid and active in Firestore`);
      } catch (err) {
        // If we don't have Firestore permission, just log it and continue
        console.log(`Mock operation: Updated order ${orderId} as paid and active (Firestore update failed: ${err.message})`);
      }
      
      return true;
    }
    
    const functions = getFunctions();
    const completePayment = httpsCallable(functions, 'completeStripePayment');
    
    const result = await completePayment({
      paymentId,
      orderId,
      stripePaymentIntentId
    });
    
    const { success } = result.data as any;
    
    if (success) {
      // Update payment status
      await updateDocument(COLLECTIONS.PAYMENTS, paymentId, {
        status: PaymentStatus.COMPLETED,
        completedAt: new Date(),
        updatedAt: new Date(),
        paymentDetails: {
          stripePaymentIntentId
        }
      });
      
      // Mark order as paid
      await updateDocument(COLLECTIONS.ORDERS, orderId, {
        isPaid: true,
        status: OrderStatus.ACTIVE
      });
    }
    
    return success;
  } catch (error) {
    console.error("Error completing Stripe payment:", error);
    throw error;
  }
};

// Get payment by ID
export const getPayment = async (paymentId: string): Promise<Payment | null> => {
  // For development mode, check the mock storage first
  if (DEV_MODE) {
    const mockPayment = getMockPayment(paymentId);
    if (mockPayment) return mockPayment;
  }
  
  return await getDocument<Payment>(COLLECTIONS.PAYMENTS, paymentId);
};

// Get payment by order ID
export const getPaymentByOrderId = async (orderId: string): Promise<Payment | null> => {
  try {
    // For development mode, check the mock storage first
    if (DEV_MODE) {
      const mockPayment = Array.from(mockPayments.values()).find(p => p.orderId === orderId);
      if (mockPayment) return mockPayment;
    }
    
    const payments = await getPaymentsByField('orderId', orderId);
    return payments.length > 0 ? payments[0] : null;
  } catch (error) {
    console.error("Error getting payment by order ID:", error);
    throw error;
  }
};

// Get payments by a specific field
export const getPaymentsByField = async (
  field: string, 
  value: any
): Promise<Payment[]> => {
  // In development mode, filter mock payments
  if (DEV_MODE) {
    // Convert the map to an array and filter based on the field and value
    return Array.from(mockPayments.values()).filter(payment => {
      return payment[field] === value;
    });
  }
  
  // Otherwise query Firestore
  const payments = await getDocuments<Payment>(
    COLLECTIONS.PAYMENTS,
    [{ field, operator: '==', value }]
  );
  
  return payments;
};

// Update payment status
export const updatePaymentStatus = async (
  paymentId: string, 
  status: PaymentStatus,
  details?: any
): Promise<void> => {
  if (DEV_MODE) {
    // In development mode, update the mock payment
    const mockPayment = getMockPayment(paymentId);
    if (mockPayment) {
      mockPayment.status = status;
      mockPayment.updatedAt = new Date();
      
      if (status === PaymentStatus.COMPLETED) {
        mockPayment.completedAt = new Date();
      }
      
      if (details) {
        mockPayment.paymentDetails = details;
      }
      
      mockPayments.set(paymentId, mockPayment);
      console.log(`Mock payment ${paymentId} status updated to ${status}`);
      return;
    }
  }
  
  const updateData: any = {
    status,
    updatedAt: new Date()
  };
  
  if (status === PaymentStatus.COMPLETED) {
    updateData.completedAt = new Date();
  }
  
  if (details) {
    updateData.paymentDetails = details;
  }
  
  await updateDocument(COLLECTIONS.PAYMENTS, paymentId, updateData);
};

// Helper function to handle failed payments
export const handleFailedPayment = async (
  paymentId: string,
  orderId: string,
  error?: string
): Promise<void> => {
  try {
    if (DEV_MODE) {
      // In development mode, update the mock payment
      const mockPayment = getMockPayment(paymentId);
      if (mockPayment) {
        mockPayment.status = PaymentStatus.FAILED;
        mockPayment.updatedAt = new Date();
        mockPayment.error = error;
        mockPayments.set(paymentId, mockPayment);
      }
      
      console.log(`Mock operation: Updated order ${orderId} payment failure with error: ${error}`);
      return;
    }
    
    // Update payment status
    await updateDocument(COLLECTIONS.PAYMENTS, paymentId, {
      status: PaymentStatus.FAILED,
      updatedAt: new Date(),
      error
    });
    
    // Update order status
    await updateDocument(COLLECTIONS.ORDERS, orderId, {
      isPaid: false,
      paymentError: error
    });
  } catch (err) {
    console.error("Error handling failed payment:", err);
    throw err;
  }
}; 