import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getOrder } from '@/lib/services/order.service';
import { 
  createPayment, 
  PaymentGateway,
  completeStripePayment 
} from '@/lib/services/payment.service';
import { getUserLocationInfo } from '@/lib/utils/geo.util';
import { getOrderAmountBreakdown, PLATFORM_FEE_PERCENTAGE } from '@/lib/utils/fee.util';
import { CreditCard, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Only declare Stripe in the global window interface
declare global {
  interface Window {
    Stripe: any;
  }
}

// Flag to determine if we're in development mode - should match payment.service.ts
const DEV_MODE = true;

type PaymentMethod = {
  id: string;
  name: string;
  gateway: PaymentGateway;
  description: string;
  icon: React.ReactNode;
};

const Checkout = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [locationInfo, setLocationInfo] = useState<{
    countryCode: string;
    currency: string;
    isIndian: boolean;
  } | null>(null);
  
  // Get order details
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID is missing');
        setLoading(false);
        return;
      }
      
      try {
        const orderData = await getOrder(orderId);
        if (!orderData) {
          setError('Order not found');
          setLoading(false);
          return;
        }
        
        // Make sure the current user is the buyer
        if (orderData.buyerId !== currentUser?.uid) {
          setError('You are not authorized to access this order');
          setLoading(false);
          return;
        }
        
        // If order is already paid, redirect to order details
        if (orderData.isPaid) {
          navigate(`/dashboard`);
          return;
        }
        
        setOrder(orderData);
        
        // Get location info to determine currency
        const locationData = await getUserLocationInfo();
        setLocationInfo(locationData);
        
        // Only set up Stripe payment methods
        const methods: PaymentMethod[] = [
          {
            id: 'stripe_card',
            name: 'Credit/Debit Card',
            gateway: PaymentGateway.STRIPE,
            description: 'Pay using Visa, Mastercard, or American Express',
            icon: <CreditCard className="h-5 w-5" />
          }
        ];
        
        setPaymentMethods(methods);
        setSelectedPaymentMethod(methods[0].id);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load order details');
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId, currentUser, navigate]);
  
  // Load Stripe SDK script
  useEffect(() => {
    if (!locationInfo) return;
    
    // In development mode, we don't actually need to load the real Stripe SDK
    // but we'll load it anyway for consistency
    try {
      // Remove any existing script elements
      const existingScripts = document.querySelectorAll('script[src*="stripe"]');
      existingScripts.forEach(script => script.remove());
      
      // Load Stripe SDK
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.async = true;
      document.body.appendChild(script);
      
      console.log('DEV MODE:', DEV_MODE ? 'Using mock Stripe API' : 'Using real Stripe API');
      
      // Clean up when component unmounts
      return () => {
        try {
          if (script && script.parentNode) {
            script.parentNode.removeChild(script);
          }
        } catch (err) {
          console.error('Error removing Stripe script:', err);
        }
      };
    } catch (err) {
      console.error('Error loading Stripe script:', err);
      setError('Failed to load payment processor. Please try again.');
    }
  }, [locationInfo]);
  
  const handlePaymentMethodChange = (value: string) => {
    setSelectedPaymentMethod(value);
  };
  
  // Function to get the total amount regardless of property name used
  const getOrderAmount = (order) => {
    // Check if totalAmount exists, otherwise use price
    return order.totalAmount !== undefined ? order.totalAmount : order.price;
  };
  
  // Function to get the base amount of the order
  const getBaseAmount = (order) => {
    return order.baseAmount !== undefined ? order.baseAmount : getOrderAmount(order);
  };
  
  // Calculate fee breakdown information
  const getFeeBreakdown = (order) => {
    if (!order) return null;
    
    const baseAmount = getBaseAmount(order);
    return getOrderAmountBreakdown(baseAmount);
  };
  
  // Add a helper function to safely get package details
  const getPackageDetails = (order) => {
    return order.packageDetails || {
      name: 'Service Package',
      deliveryTime: order.deliveryTime || 3,
      revisions: 1
    };
  };
  
  const initializePayment = async () => {
    if (!order || !selectedPaymentMethod || !locationInfo) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      const selectedMethod = paymentMethods.find(method => method.id === selectedPaymentMethod);
      if (!selectedMethod) {
        throw new Error('Selected payment method not found');
      }
      
      // Get the base amount using the helper function
      const baseAmount = getBaseAmount(order);
      
      // Create payment record using Stripe
      const result = await createPayment(
        order.id,
        baseAmount,
        locationInfo.currency,
        selectedMethod.gateway
      );
      
      if (selectedMethod.gateway === PaymentGateway.STRIPE) {
        await handleStripeCheckout(result.paymentId, result.gatewayData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process payment');
      setProcessing(false);
    }
  };
  
  const handleStripeCheckout = async (paymentId: string, gatewayData: any) => {
    try {
      // In development mode, we'll simulate a successful payment without calling the Stripe API
      if (DEV_MODE) {
        console.log('DEV MODE: Simulating successful Stripe payment');
        console.log('Payment ID:', paymentId);
        console.log('Gateway Data:', gatewayData);
        
        // Add a small delay to simulate processing
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          // Complete the payment using our mock system
          const success = await completeStripePayment(
            paymentId,
            order.id,
            gatewayData.id // Use the mock payment intent ID
          );
          
          if (success) {
            console.log('DEV MODE: Payment completed successfully');
            setSuccess(true);
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            console.error('DEV MODE: Payment completion failed');
            setError('Payment completion failed');
          }
        } catch (error) {
          console.error('DEV MODE: Error completing payment:', error);
          setError('Payment processing failed. Please try again.');
        }
        return;
      }
      
      // Production mode - use real Stripe API
      if (!window.Stripe) {
        throw new Error('Stripe SDK not loaded. Please refresh the page and try again.');
      }
      
      // Initialize Stripe
      const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(gatewayData.client_secret, {
        payment_method: {
          card: {
            // In a real implementation, we'd use Stripe Elements here
            // For this example, we're using a test token
            token: 'tok_visa', // Test token
          },
          billing_details: {
            name: userProfile?.displayName || '',
            email: userProfile?.email || '',
          },
        },
      });
      
      if (error) {
        throw new Error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Complete the payment
        const success = await completeStripePayment(
          paymentId,
          order.id,
          paymentIntent.id
        );
        
        if (success) {
          setSuccess(true);
          setTimeout(() => {
            navigate('/dashboard');
          }, 2000);
        } else {
          setError('Payment completion failed');
        }
      }
    } catch (err: any) {
      console.error('Stripe checkout error:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Alert className="mb-6 bg-green-50 border-green-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertTitle>Payment Successful</AlertTitle>
          <AlertDescription>Your payment has been processed successfully. Redirecting to your dashboard...</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Order not found</AlertDescription>
        </Alert>
        <div className="flex justify-center mt-6">
          <Button onClick={() => navigate('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12 px-4 pt-24 pb-16">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Payment Successful!</AlertTitle>
            <AlertDescription className="text-green-600">
              Your payment was processed successfully. You will be redirected to your dashboard.
            </AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="bg-card p-8 rounded-lg border border-border/50 shadow-subtle">
            <div className="flex items-center justify-center h-40">
              <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
            </div>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                  <CardDescription>
                    Review your order details before payment
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {order && (
                    <>
                      <div>
                        <h3 className="font-medium mb-1">Service</h3>
                        <p>{order.serviceName || 'Custom Service'}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-1">Package</h3>
                        <p>{getPackageDetails(order).name}</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-1">Delivery Time</h3>
                        <p>{getPackageDetails(order).deliveryTime} days</p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-1">Revisions</h3>
                        <p>{getPackageDetails(order).revisions}</p>
                      </div>
                      
                      {order.requirements && (
                        <div>
                          <h3 className="font-medium mb-1">Requirements</h3>
                          <p className="text-sm text-muted-foreground">{order.requirements}</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
                
                <CardHeader className="border-t border-border pt-6 pb-0">
                  <CardTitle>Select Payment Method</CardTitle>
                </CardHeader>
                
                <CardContent className="pt-4">
                  {paymentMethods.length > 0 ? (
                    <Select 
                      value={selectedPaymentMethod || undefined}
                      onValueChange={handlePaymentMethodChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      
                      <SelectContent>
                        {paymentMethods.map(method => (
                          <SelectItem key={method.id} value={method.id}>
                            <div className="flex items-center">
                              {method.icon}
                              <span className="ml-2">{method.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-muted-foreground">No payment methods available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {order && (
                    <>
                      {/* Fee breakdown */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Base Amount</span>
                          <span>${getBaseAmount(order).toFixed(2)}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm text-primary">
                          <span>Platform Fee ({PLATFORM_FEE_PERCENTAGE}%)</span>
                          <span>${getFeeBreakdown(order)?.platformFee.toFixed(2)}</span>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between font-medium">
                          <span>Total</span>
                          <span>${getFeeBreakdown(order)?.totalWithFee.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs text-muted-foreground">
                        <p>
                          By proceeding with the payment, you agree to our Terms of Service and Privacy Policy.
                        </p>
                        <p>
                          Payment will be securely processed and held in escrow until the service is completed.
                        </p>
                      </div>
                      
                      <Button 
                        className="w-full"
                        onClick={initializePayment}
                        disabled={processing || !selectedPaymentMethod}
                      >
                        {processing ? (
                          <>
                            <div className="h-4 w-4 rounded-full border-2 border-primary/30 border-t-primary animate-spin mr-2"></div>
                            Processing...
                          </>
                        ) : (
                          `Pay $${getFeeBreakdown(order)?.totalWithFee.toFixed(2)}`
                        )}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout; 