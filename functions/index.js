const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors')({ origin: true });

// Get environment variables
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || functions.config().stripe?.secret;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || functions.config().stripe?.webhook_secret;
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || functions.config().razorpay?.id;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay?.secret;

const stripe = require('stripe')(STRIPE_SECRET_KEY);

admin.initializeApp();
const db = admin.firestore();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET
});

// Add Express for easier CORS handling
const express = require('express');
const app = express();

// Use CORS middleware
app.use(cors);
app.use(express.json());

/**
 * Initialize a payment based on the gateway
 */
exports.initializePayment = functions.https.onCall(async (data, context) => {
  try {
    // Add CORS headers to the response
    functions.logger.info('Initializing payment', { data, uid: context.auth?.uid });
    
    // Ensure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const { orderId, amount, currency, gateway, buyerId, sellerId, serviceId } = data;

    // Validate the data
    if (!orderId || !amount || !currency || !gateway || !buyerId || !sellerId || !serviceId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    // Generate a unique payment ID
    const paymentId = db.collection('payments').doc().id;

    let gatewayData;

    // Initialize payment with the appropriate gateway
    if (gateway === 'razorpay') {
      // Create a Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, // Razorpay uses lowest denomination (paise for INR)
        currency: currency,
        receipt: `rcpt_${orderId}`,
        notes: {
          orderId: orderId,
          buyerId: buyerId,
          sellerId: sellerId,
          serviceId: serviceId,
          paymentId: paymentId
        }
      });

      gatewayData = razorpayOrder;
    } else if (gateway === 'stripe') {
      // Create a Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Stripe uses lowest denomination (cents for USD)
        currency: currency.toLowerCase(),
        metadata: {
          orderId: orderId,
          buyerId: buyerId,
          sellerId: sellerId,
          serviceId: serviceId,
          paymentId: paymentId
        }
      });

      gatewayData = {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret
      };
    } else {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid payment gateway'
      );
    }

    return { paymentId, gatewayData };
  } catch (error) {
    console.error('Error initializing payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Verify a Razorpay payment
 */
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  try {
    // Ensure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const { paymentId, orderId, razorpayPaymentId, razorpaySignature } = data;

    // Validate the data
    if (!paymentId || !orderId || !razorpayPaymentId || !razorpaySignature) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    // Get the order document to find the Razorpay order ID
    const orderRef = db.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();
    
    if (!orderDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Order not found'
      );
    }
    
    const orderData = orderDoc.data();
    
    // Get the payment document to find details
    const paymentRef = db.collection('payments').doc(paymentId);
    const paymentDoc = await paymentRef.get();
    
    if (!paymentDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Payment not found'
      );
    }
    
    const paymentData = paymentDoc.data();
    const razorpayOrderId = paymentData.gatewayId;

    // Verify the signature
    const generatedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const isSignatureValid = generatedSignature === razorpaySignature;

    if (!isSignatureValid) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid signature'
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Complete a Stripe payment
 */
exports.completeStripePayment = functions.https.onCall(async (data, context) => {
  try {
    // Ensure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'The function must be called while authenticated.'
      );
    }

    const { paymentId, orderId, stripePaymentIntentId } = data;

    // Validate the data
    if (!paymentId || !orderId || !stripePaymentIntentId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Missing required fields'
      );
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(stripePaymentIntentId);

    // Verify that the payment is successful
    if (paymentIntent.status !== 'succeeded') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Payment not successful'
      );
    }

    // Verify the metadata matches our records
    if (
      paymentIntent.metadata.orderId !== orderId ||
      paymentIntent.metadata.paymentId !== paymentId
    ) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Payment metadata mismatch'
      );
    }

    return { success: true };
  } catch (error) {
    console.error('Error completing Stripe payment:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Handle Stripe webhook events
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    const signature = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        STRIPE_WEBHOOK_SECRET
      );

      // Handle the event based on its type
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handleSuccessfulPayment(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await handleFailedPayment(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.status(200).send({ received: true });
    } catch (error) {
      console.error('Error handling Stripe webhook:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });
});

/**
 * Handle successful Stripe payments
 */
async function handleSuccessfulPayment(paymentIntent) {
  const { orderId, paymentId } = paymentIntent.metadata;

  // Update the payment status in Firestore
  const paymentRef = db.collection('payments').doc(paymentId);
  await paymentRef.update({
    status: 'completed',
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    paymentDetails: {
      stripePaymentIntentId: paymentIntent.id
    }
  });

  // Update the order status in Firestore
  const orderRef = db.collection('orders').doc(orderId);
  await orderRef.update({
    isPaid: true,
    status: 'active',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Handle failed Stripe payments
 */
async function handleFailedPayment(paymentIntent) {
  const { orderId, paymentId } = paymentIntent.metadata;

  // Update the payment status in Firestore
  const paymentRef = db.collection('payments').doc(paymentId);
  await paymentRef.update({
    status: 'failed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    error: paymentIntent.last_payment_error?.message || 'Payment failed'
  });

  // Update the order in Firestore
  const orderRef = db.collection('orders').doc(orderId);
  await orderRef.update({
    isPaid: false,
    paymentError: paymentIntent.last_payment_error?.message || 'Payment failed',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
}

/**
 * Handle Razorpay webhook events
 */
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Verify the webhook signature
      const signature = req.headers['x-razorpay-signature'];
      const isSignatureValid = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(req.rawBody)
        .digest('hex') === signature;

      if (!isSignatureValid) {
        return res.status(400).send('Invalid signature');
      }

      const event = req.body;
      const eventType = event.event;

      // Handle the event based on its type
      switch (eventType) {
        case 'payment.authorized':
          await handleRazorpayAuthorized(event.payload.payment.entity);
          break;
        case 'payment.failed':
          await handleRazorpayFailed(event.payload.payment.entity);
          break;
        default:
          console.log(`Unhandled event type: ${eventType}`);
      }

      res.status(200).send({ received: true });
    } catch (error) {
      console.error('Error handling Razorpay webhook:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });
});

/**
 * Handle successful Razorpay payments
 */
async function handleRazorpayAuthorized(payment) {
  // Get the notes from the original order
  const razorpayOrderId = payment.order_id;
  
  try {
    // Get the order from Razorpay to get the notes
    const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
    const { orderId, paymentId } = razorpayOrder.notes;
    
    // Update the payment status in Firestore
    const paymentRef = db.collection('payments').doc(paymentId);
    await paymentRef.update({
      status: 'completed',
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentDetails: {
        razorpayPaymentId: payment.id
      }
    });

    // Update the order status in Firestore
    const orderRef = db.collection('orders').doc(orderId);
    await orderRef.update({
      isPaid: true,
      status: 'active',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error handling Razorpay authorized payment:', error);
  }
}

/**
 * Handle failed Razorpay payments
 */
async function handleRazorpayFailed(payment) {
  // Get the notes from the original order
  const razorpayOrderId = payment.order_id;
  
  try {
    // Get the order from Razorpay to get the notes
    const razorpayOrder = await razorpay.orders.fetch(razorpayOrderId);
    const { orderId, paymentId } = razorpayOrder.notes;
    
    // Update the payment status in Firestore
    const paymentRef = db.collection('payments').doc(paymentId);
    await paymentRef.update({
      status: 'failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      error: payment.error_description || 'Payment failed'
    });

    // Update the order in Firestore
    const orderRef = db.collection('orders').doc(orderId);
    await orderRef.update({
      isPaid: false,
      paymentError: payment.error_description || 'Payment failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error handling Razorpay failed payment:', error);
  }
} 

// Create an Express-based Cloud Function for payment initialization
app.post('/initializePaymentExpress', async (req, res) => {
  try {
    // Check authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const { orderId, amount, currency, gateway, buyerId, sellerId, serviceId } = req.body;
    
    // Validate the data
    if (!orderId || !amount || !currency || !gateway || !buyerId || !sellerId || !serviceId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Generate a unique payment ID
    const paymentId = db.collection('payments').doc().id;
    
    let gatewayData;
    
    // Initialize payment with the appropriate gateway
    if (gateway === 'razorpay') {
      // Create a Razorpay order
      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, // Razorpay uses lowest denomination (paise for INR)
        currency: currency,
        receipt: `rcpt_${orderId}`,
        notes: {
          orderId: orderId,
          buyerId: buyerId,
          sellerId: sellerId,
          serviceId: serviceId,
          paymentId: paymentId
        }
      });
      
      gatewayData = razorpayOrder;
    } else if (gateway === 'stripe') {
      // Create a Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Stripe uses lowest denomination (cents for USD)
        currency: currency.toLowerCase(),
        metadata: {
          orderId: orderId,
          buyerId: buyerId,
          sellerId: sellerId,
          serviceId: serviceId,
          paymentId: paymentId
        }
      });
      
      gatewayData = {
        id: paymentIntent.id,
        client_secret: paymentIntent.client_secret
      };
    } else {
      return res.status(400).json({ error: 'Invalid payment gateway' });
    }
    
    res.status(200).json({ paymentId, gatewayData });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export the Express API as a Cloud Function
exports.api = functions.https.onRequest(app); 