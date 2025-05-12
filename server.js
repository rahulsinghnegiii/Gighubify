import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

const app = express();
const PORT = 3001;

// Configure CORS to allow requests from all origins during development
app.use(cors({ origin: true }));

// Parse JSON requests
app.use(express.json());

// Always return the same test payment intent ID to avoid confusion
const TEST_PAYMENT_ID = 'test_payment_123456789';
const TEST_PAYMENT_INTENT_ID = 'pi_test_1234567890';
const TEST_CLIENT_SECRET = 'pi_test_1234567890_secret_test';

// Mock function to simulate the Firebase initializePayment callable function
app.post('/initializePayment', (req, res) => {
  console.log('initializePayment called with data:', req.body);
  
  const { orderId, amount, currency, buyerId, sellerId, serviceId } = req.body.data;
  
  // Validate the data
  if (!orderId || !amount || !currency || !buyerId || !sellerId || !serviceId) {
    return res.status(400).json({ 
      error: { 
        message: 'Missing required fields',
        status: 'INVALID_ARGUMENT'
      }
    });
  }
  
  // Use consistent payment IDs for testing
  const paymentId = TEST_PAYMENT_ID;
  
  // Always use Stripe gateway regardless of what was passed
  console.log('Using Stripe for payment (Razorpay disabled)');
  
  // Create Stripe payment intent data with consistent IDs
  const gatewayData = {
    id: TEST_PAYMENT_INTENT_ID,
    client_secret: TEST_CLIENT_SECRET
  };
  
  // Return the response in the format expected by Firebase callable functions
  res.json({
    result: { paymentId, gatewayData }
  });
});

// Express API endpoint for payment initialization
app.post('/api/initializePaymentExpress', (req, res) => {
  console.log('initializePaymentExpress called with data:', req.body);
  
  const { orderId, amount, currency, buyerId, sellerId, serviceId } = req.body;
  
  // Validate the data
  if (!orderId || !amount || !currency || !buyerId || !sellerId || !serviceId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // Use consistent payment IDs for testing
  const paymentId = TEST_PAYMENT_ID;
  
  // Always use Stripe gateway regardless of what was passed
  console.log('Using Stripe for payment (Razorpay disabled)');
  
  // Create Stripe payment intent data with consistent IDs
  const gatewayData = {
    id: TEST_PAYMENT_INTENT_ID,
    client_secret: TEST_CLIENT_SECRET
  };
  
  res.status(200).json({ paymentId, gatewayData });
});

// Start the server
const server = createServer(app);
server.listen(PORT, () => {
  console.log(`Local development server running at http://localhost:${PORT}`);
  console.log(`- Callable function endpoint: http://localhost:${PORT}/initializePayment`);
  console.log(`- Express API endpoint: http://localhost:${PORT}/api/initializePaymentExpress`);
  console.log(`- NOTE: All payments are using Stripe (Razorpay is disabled)`);
  console.log(`- Using test payment ID: ${TEST_PAYMENT_ID}`);
  console.log(`- Using test payment intent ID: ${TEST_PAYMENT_INTENT_ID}`);
}); 