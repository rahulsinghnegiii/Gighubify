import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/contexts/AuthContext';
import { addDocument, COLLECTIONS, serverTimestamp } from '@/lib/firebase/firestore';
import { OrderStatus } from '@/lib/models/order.model';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TestPayment = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTestOrder = async () => {
    if (!currentUser) {
      setError('You must be logged in to create a test order');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create a test service if one doesn't exist
      const testServiceId = 'test-service-123';
      const testSellerId = 'test-seller-456';

      // Create a test order
      const orderData = {
        serviceId: testServiceId,
        sellerId: testSellerId,
        buyerId: currentUser.uid,
        packageId: 'test-package-789',
        packageDetails: {
          name: 'Test Package',
          description: 'This is a test package for payment testing',
          deliveryTime: 3,
          revisions: 2,
          price: amount
        },
        requirements: 'This is a test order for payment testing',
        price: amount,
        totalAmount: amount,
        revisionCount: 0,
        status: OrderStatus.PENDING,
        isPaid: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Add the order to Firestore
      const orderId = await addDocument(COLLECTIONS.ORDERS, orderData);

      // Navigate to the checkout page
      navigate(`/checkout/${orderId}`);
    } catch (err: any) {
      console.error('Error creating test order:', err);
      setError(err.message || 'Failed to create test order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Test Payment System</CardTitle>
          <CardDescription>Create a test order to try out the payment flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Order Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              min={1}
              max={1000}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
              {error}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleCreateTestOrder}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating Test Order...' : 'Create Test Order & Checkout'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestPayment; 