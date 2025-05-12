import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getPaymentsByField, PaymentStatus, PaymentGateway } from '@/lib/services/payment.service';
import { getOrder } from '@/lib/services/order.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowDown, ArrowUp, CheckCircle, Clock, XCircle } from 'lucide-react';

const PaymentDashboard = () => {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [gatewayFilter, setGatewayFilter] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc'
  });

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        // Get all payments for the current user
        const userPayments = await getPaymentsByField('buyerId', currentUser.uid);

        // Get order details for each payment
        const paymentsWithOrders = await Promise.all(
          userPayments.map(async (payment) => {
            try {
              const order = await getOrder(payment.orderId);
              return {
                ...payment,
                order
              };
            } catch (err) {
              console.error(`Error fetching order ${payment.orderId}:`, err);
              return {
                ...payment,
                order: null
              };
            }
          })
        );

        setPayments(paymentsWithOrders);
        setLoading(false);
      } catch (err: any) {
        console.error('Error fetching payments:', err);
        setError(err.message || 'Failed to load payments');
        setLoading(false);
      }
    };

    fetchPayments();
  }, [currentUser]);

  // Get status badge color
  const getStatusBadgeVariant = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return 'success';
      case PaymentStatus.PENDING:
        return 'warning';
      case PaymentStatus.PROCESSING:
        return 'secondary';
      case PaymentStatus.FAILED:
        return 'destructive';
      case PaymentStatus.REFUNDED:
        return 'outline';
      default:
        return 'default';
    }
  };

  // Format date
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  // Sort payments
  const sortedPayments = [...payments].sort((a, b) => {
    if (sortConfig.key === 'createdAt') {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
    }
    
    if (sortConfig.key === 'amount') {
      return sortConfig.direction === 'asc' ? a.amount - b.amount : b.amount - a.amount;
    }
    
    // Default to string comparison for other fields
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    return sortConfig.direction === 'asc' 
      ? aValue.localeCompare(bValue)
      : bValue.localeCompare(aValue);
  });

  // Filter payments
  const filteredPayments = sortedPayments.filter(payment => {
    // Apply status filter
    if (statusFilter && payment.status !== statusFilter) {
      return false;
    }
    
    // Apply gateway filter
    if (gatewayFilter && payment.gateway !== gatewayFilter) {
      return false;
    }
    
    return true;
  });

  // Handle sort click
  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Get sort icon
  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) {
      return null;
    }
    
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  // Get status icon
  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case PaymentStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case PaymentStatus.PROCESSING:
        return <Clock className="h-4 w-4 text-blue-500" />;
      case PaymentStatus.FAILED:
        return <XCircle className="h-4 w-4 text-red-500" />;
      case PaymentStatus.REFUNDED:
        return <ArrowDown className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Payment Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {payments.filter(p => p.status === PaymentStatus.COMPLETED).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {payments.filter(p => p.status === PaymentStatus.PENDING).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {payments.filter(p => p.status === PaymentStatus.FAILED).length}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Manage and track all your payments</CardDescription>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Select value={statusFilter || 'all'} onValueChange={val => setStatusFilter(val === 'all' ? null : val)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={PaymentStatus.PROCESSING}>Processing</SelectItem>
                <SelectItem value={PaymentStatus.COMPLETED}>Completed</SelectItem>
                <SelectItem value={PaymentStatus.FAILED}>Failed</SelectItem>
                <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={gatewayFilter || 'all'} onValueChange={val => setGatewayFilter(val === 'all' ? null : val)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by Gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Gateways</SelectItem>
                <SelectItem value={PaymentGateway.STRIPE}>Stripe</SelectItem>
                <SelectItem value={PaymentGateway.RAZORPAY}>Razorpay</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payments found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleSort('createdAt')} className="cursor-pointer">
                      <div className="flex items-center">
                        Date {getSortIcon('createdAt')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('gateway')} className="cursor-pointer">
                      <div className="flex items-center">
                        Gateway {getSortIcon('gateway')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('status')} className="cursor-pointer">
                      <div className="flex items-center">
                        Status {getSortIcon('status')}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort('amount')} className="cursor-pointer">
                      <div className="flex items-center">
                        Amount {getSortIcon('amount')}
                      </div>
                    </TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell>
                        {payment.gateway === PaymentGateway.STRIPE ? 'Stripe' : 'Razorpay'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(payment.status)}
                          <Badge variant={getStatusBadgeVariant(payment.status)}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {payment.currency} {payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {payment.order?.packageDetails?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentDashboard; 