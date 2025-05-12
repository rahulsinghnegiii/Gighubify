import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getOrder, Order, OrderStatus } from '@/lib/services/order.service';
import { getService } from '@/lib/services/service.service';
import { getUserProfile } from '@/lib/services/user.service';
import { getPaymentByOrderId } from '@/lib/services/payment.service';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  Check, 
  Package, 
  CreditCard, 
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [service, setService] = useState<any | null>(null);
  const [seller, setSeller] = useState<any | null>(null);
  const [buyer, setBuyer] = useState<any | null>(null);
  const [payment, setPayment] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId || !currentUser) {
        setError('Invalid order ID or not authenticated');
        setLoading(false);
        return;
      }
      
      try {
        // Get order details
        const orderData = await getOrder(orderId);
        if (!orderData) {
          setError('Order not found');
          setLoading(false);
          return;
        }
        
        // Check if user is authorized to view this order
        if (orderData.buyerId !== currentUser.uid && orderData.sellerId !== currentUser.uid) {
          setError('You are not authorized to view this order');
          setLoading(false);
          return;
        }
        
        setOrder(orderData);
        
        // Get service details
        const serviceData = await getService(orderData.serviceId);
        setService(serviceData);
        
        // Get seller and buyer profiles
        const sellerData = await getUserProfile(orderData.sellerId);
        setSeller(sellerData);
        
        const buyerData = await getUserProfile(orderData.buyerId);
        setBuyer(buyerData);
        
        // Get payment details if order is paid
        if (orderData.isPaid) {
          const paymentData = await getPaymentByOrderId(orderId);
          setPayment(paymentData);
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching order details:', err);
        setError(err.message || 'Failed to load order details');
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [orderId, currentUser]);
  
  // Format date
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };
  
  // Get status badge variant
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Badge variant="warning">Pending</Badge>;
      case OrderStatus.IN_PROGRESS:
        return <Badge variant="secondary">In Progress</Badge>;
      case OrderStatus.DELIVERED:
        return <Badge variant="success">Delivered</Badge>;
      case OrderStatus.REVISION_REQUESTED:
        return <Badge variant="secondary">Revision Requested</Badge>;
      case OrderStatus.COMPLETED:
        return <Badge variant="success">Completed</Badge>;
      case OrderStatus.CANCELLED:
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
  
  // Check if user is buyer or seller
  const isBuyer = currentUser?.uid === order.buyerId;
  const isSeller = currentUser?.uid === order.sellerId;
  
  return (
    <div className="container max-w-4xl mx-auto pt-28 pb-16 px-4">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate(isBuyer ? '/dashboard' : '/seller/dashboard')}
          className="flex items-center text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
      
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Order #{orderId.substring(0, 8)}</h1>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Ordered on {formatDate(order.createdAt)}</span>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            {getStatusBadge(order.status)}
            
            {!order.isPaid && order.status === OrderStatus.PENDING && isBuyer && (
              <Button 
                variant="default" 
                size="sm"
                className="ml-2"
                onClick={() => navigate(`/checkout/${orderId}`)}
              >
                Pay Now
              </Button>
            )}
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{service?.title || 'Service'}</h3>
                <p className="text-muted-foreground">{service?.description || 'No description available'}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Package</h4>
                  <p>{order.packageDetails?.name || 'Standard Package'}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Price</h4>
                  <p>${order.price.toFixed(2)}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Delivery Time</h4>
                  <p>{order.packageDetails?.deliveryTime || order.deliveryTime || 3} days</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Revisions</h4>
                  <p>{order.packageDetails?.revisions || 1}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent>
              {order.isPaid ? (
                <div className="space-y-4">
                  <div className="flex items-center text-green-600">
                    <Check className="h-5 w-5 mr-2" />
                    <span className="font-medium">Paid</span>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Payment Method</h4>
                    <p className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      {payment?.gateway === 'stripe' ? 'Stripe' : payment?.gateway === 'razorpay' ? 'Razorpay' : order.paymentMethod || 'Credit Card'}
                    </p>
                  </div>
                  
                  {payment && (
                    <>
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Payment Date</h4>
                        <p>{formatDate(payment.completedAt || payment.createdAt)}</p>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">Payment ID</h4>
                        <p className="text-sm font-mono">{payment.id}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center text-yellow-600">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">Payment Pending</span>
                  </div>
                  
                  {isBuyer && (
                    <Button 
                      onClick={() => navigate(`/checkout/${orderId}`)}
                      className="w-full"
                    >
                      Pay Now
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>{isBuyer ? 'Seller' : 'Buyer'} Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-full bg-muted overflow-hidden mr-4">
                    {isBuyer ? (
                      <img 
                        src={seller?.photoURL || ''} 
                        alt={seller?.displayName || 'Seller'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <img 
                        src={buyer?.photoURL || ''} 
                        alt={buyer?.displayName || 'Buyer'} 
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium">
                      {isBuyer ? seller?.displayName || 'Seller' : buyer?.displayName || 'Buyer'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isBuyer ? seller?.email : buyer?.email}
                    </p>
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full flex items-center justify-center"
                  onClick={() => {
                    const otherUserId = isBuyer ? order.sellerId : order.buyerId;
                    if (otherUserId) {
                      console.log(`Navigating to messages with user: ${otherUserId}`);
                      navigate(`/messages/${otherUserId}`);
                    } else {
                      console.error('Cannot find user ID to message');
                      alert('Cannot send message: User information is not available');
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {isBuyer ? 'Message Seller' : 'Message Buyer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Requirements & Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{order.requirements || 'No specific requirements provided.'}</p>
          </CardContent>
          {isBuyer && order.status === OrderStatus.DELIVERED && (
            <CardFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Button variant="outline" className="flex-1">Request Revision</Button>
              <Button className="flex-1">Accept Delivery</Button>
            </CardFooter>
          )}
          {isSeller && order.isPaid && order.status === OrderStatus.IN_PROGRESS && (
            <CardFooter>
              <Button className="w-full">Mark as Delivered</Button>
            </CardFooter>
          )}
        </Card>
        
        {/* Deliverables section would go here if needed */}
      </div>
    </div>
  );
};

export default OrderDetail; 