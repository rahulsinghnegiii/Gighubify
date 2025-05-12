import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getSellerOrders } from '@/lib/services/order.service';
import { Order, OrderStatus } from '@/lib/services/order.service';
import { getServicesBySeller } from '@/lib/services/service.service';
import { Service } from '@/lib/models/service.model';
import { User } from '@/lib/models/user.model';
import { getUserProfile, isUserSeller } from '@/lib/services/user.service';
import { 
  Clock, Package, User as UserIcon, Settings, 
  ShoppingBag, PlusCircle, DollarSign, BarChart3, 
  Calendar, Briefcase, MessageSquare
} from 'lucide-react';

const SellerDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<Service[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    completedOrders: 0,
    activeOrders: 0,
    cancelledOrders: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if user is not logged in or not a seller
  useEffect(() => {
    const checkSellerStatus = async () => {
      if (!currentUser) {
        navigate('/signin', { state: { from: { pathname: '/seller/dashboard' } } });
        return;
      }
      
      try {
        const isSeller = await isUserSeller(currentUser.uid);
        if (!isSeller) {
          navigate('/dashboard');
          alert('You do not have a seller account. Redirecting to buyer dashboard.');
          return;
        }
      } catch (err) {
        console.error('Error checking seller status:', err);
        navigate('/dashboard');
      }
    };
    
    checkSellerStatus();
  }, [currentUser, navigate]);
  
  // Fetch user profile, services and orders
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        const userProfile = await getUserProfile(currentUser.uid);
        setProfile(userProfile);
        
        // Fetch seller services
        const sellerServices = await getServicesBySeller(currentUser.uid);
        setServices(sellerServices);
        
        // Fetch orders
        const sellerOrders = await getSellerOrders(currentUser.uid);
        
        // Enhance orders with buyer information
        const enhancedOrders = await Promise.all(
          sellerOrders.map(async (order) => {
            try {
              if (order.buyerId) {
                console.log(`Fetching buyer profile for order ${order.id}, buyerId: ${order.buyerId}`);
                const buyerProfile = await getUserProfile(order.buyerId);
                
                if (!buyerProfile) {
                  console.warn(`Buyer profile not found for buyerId: ${order.buyerId}`);
                  return {
                    ...order,
                    buyerName: `User (${order.buyerId.substring(0, 6)}...)`,
                    buyerEmail: null
                  };
                }
                
                console.log(`Found buyer: ${buyerProfile.displayName || 'No name'} for order ${order.id}`);
                return {
                  ...order,
                  buyerName: buyerProfile.displayName || 'Anonymous User',
                  buyerEmail: buyerProfile.email
                };
              } else {
                console.warn(`Order ${order.id} has no buyerId`);
                return {
                  ...order,
                  buyerName: 'Unknown User',
                  buyerEmail: null
                };
              }
            } catch (err) {
              console.error(`Error fetching buyer info for order ${order.id}:`, err);
              return {
                ...order,
                buyerName: `Error: ${(err as Error).message?.substring(0, 20) || 'Unknown error'}`,
                buyerEmail: null
              };
            }
          })
        );
        
        setOrders(enhancedOrders);
        
        // Calculate stats
        let totalEarnings = 0;
        let completedOrders = 0;
        let activeOrders = 0;
        let cancelledOrders = 0;
        
        enhancedOrders.forEach(order => {
          if (order.status === OrderStatus.COMPLETED) {
            totalEarnings += order.price;
            completedOrders++;
          } else if (
            order.status === OrderStatus.PENDING || 
            order.status === OrderStatus.IN_PROGRESS || 
            order.status === OrderStatus.DELIVERED || 
            order.status === OrderStatus.REVISION_REQUESTED
          ) {
            activeOrders++;
          } else if (order.status === OrderStatus.CANCELLED) {
            cancelledOrders++;
          }
        });
        
        setStats({
          totalEarnings,
          completedOrders,
          activeOrders,
          cancelledOrders
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);
  
  // Function to format date from timestamp
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
  
  // Get status badge color based on order status
  const getStatusBadgeColor = (status: OrderStatus): string => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.REVISION_REQUESTED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.COMPLETED:
        return 'bg-emerald-100 text-emerald-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen pt-28 pb-16 container mx-auto px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
              {/* User profile */}
              <div className="flex flex-col items-center mb-6">
                <div className="mb-4">
                  <div className="h-24 w-24 rounded-full bg-muted overflow-hidden">
                    {profile?.photoURL ? (
                      <img 
                        src={profile.photoURL} 
                        alt={profile?.displayName || 'User'} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-full w-full p-6 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{profile?.displayName || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email || ''}</p>
              </div>
              
              {/* Navigation */}
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${activeTab === 'dashboard' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
                >
                  <BarChart3 className="h-4 w-4 mr-3" />
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('services')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${activeTab === 'services' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
                >
                  <Briefcase className="h-4 w-4 mr-3" />
                  My Services
                </button>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${activeTab === 'orders' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
                >
                  <Package className="h-4 w-4 mr-3" />
                  Orders
                </button>
                <button 
                  onClick={() => setActiveTab('earnings')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${activeTab === 'earnings' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
                >
                  <DollarSign className="h-4 w-4 mr-3" />
                  Earnings
                </button>
                <button 
                  onClick={() => setActiveTab('messages')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${activeTab === 'messages' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
                >
                  <MessageSquare className="h-4 w-4 mr-3" />
                  Messages
                </button>
                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${activeTab === 'settings' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </button>
              </nav>
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-grow">
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Seller Dashboard</h2>
                
                {/* Stats cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <div className="bg-card p-4 rounded-xl border border-border/50 shadow-subtle">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center mr-3">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Earnings</p>
                        <h3 className="font-bold text-xl">${stats.totalEarnings.toFixed(2)}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-card p-4 rounded-xl border border-border/50 shadow-subtle">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md bg-green-50 flex items-center justify-center mr-3">
                        <Package className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Completed Orders</p>
                        <h3 className="font-bold text-xl">{stats.completedOrders}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-card p-4 rounded-xl border border-border/50 shadow-subtle">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center mr-3">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Active Orders</p>
                        <h3 className="font-bold text-xl">{stats.activeOrders}</h3>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-card p-4 rounded-xl border border-border/50 shadow-subtle">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-md bg-red-50 flex items-center justify-center mr-3">
                        <ShoppingBag className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cancelled Orders</p>
                        <h3 className="font-bold text-xl">{stats.cancelledOrders}</h3>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Recent orders */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Recent Orders</h3>
                    <button 
                      onClick={() => setActiveTab('orders')}
                      className="text-sm text-primary hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  
                  {orders.length === 0 ? (
                    <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle text-center">
                      <p className="text-muted-foreground">No orders yet</p>
                    </div>
                  ) : (
                    <div className="bg-card rounded-xl border border-border/50 shadow-subtle overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">ORDER ID</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">SERVICE</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">DATE</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">PRICE</th>
                            <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {orders.slice(0, 5).map((order) => (
                            <tr key={order.id} className="hover:bg-muted/30">
                              <td className="py-3 px-4 text-sm">{order.id.substring(0, 8)}</td>
                              <td className="py-3 px-4 text-sm">{order.serviceTitle || 'Service'}</td>
                              <td className="py-3 px-4 text-sm">{formatDate(order.createdAt)}</td>
                              <td className="py-3 px-4 text-sm">${order.price}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                  {order.status.replace(/_/g, ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                
                {/* Services overview */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Your Services</h3>
                    <button 
                      onClick={() => setActiveTab('services')}
                      className="text-sm text-primary hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  
                  {services.length === 0 ? (
                    <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle text-center">
                      <p className="text-muted-foreground mb-4">You haven't created any services yet</p>
                      <button 
                        onClick={() => navigate('/seller/create-service')}
                        className="btn-primary"
                      >
                        Create Your First Service
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {services.slice(0, 3).map((service) => (
                        <div key={service.id} className="bg-card rounded-xl border border-border/50 shadow-subtle overflow-hidden">
                          <div className="h-32 bg-muted relative">
                            {service.images[0] ? (
                              <img 
                                src={service.images[0]} 
                                alt={service.title} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-accent/30 flex items-center justify-center">
                                <Briefcase className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium bg-white/90">
                              ${service.price}
                            </div>
                          </div>
                          <div className="p-4">
                            <h4 className="font-medium text-sm mb-1 line-clamp-1">{service.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                              {service.description}
                            </p>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center text-amber-500 text-xs">
                                {Array(5).fill(0).map((_, i) => (
                                  <span key={i}>★</span>
                                )).slice(0, Math.floor(service.averageRating || 0))}
                                {service.averageRating ? ` ${service.averageRating.toFixed(1)}` : 'No ratings'}
                              </div>
                              <Link 
                                to={`/seller/edit-service/${service.id}`}
                                className="text-xs text-primary hover:underline"
                              >
                                Edit
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'services' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">My Services</h2>
                  <button 
                    onClick={() => navigate('/seller/create-service')}
                    className="btn-primary flex items-center"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create New Service
                  </button>
                </div>
                
                {services.length === 0 ? (
                  <div className="bg-card p-8 rounded-xl border border-border/50 shadow-subtle text-center">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Services Yet</h3>
                    <p className="text-muted-foreground mb-6">You haven't created any services yet. Create your first service to start selling.</p>
                    <button 
                      onClick={() => navigate('/seller/create-service')}
                      className="btn-primary"
                    >
                      Create Your First Service
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {services.map((service) => (
                      <div key={service.id} className="bg-card rounded-xl border border-border/50 shadow-subtle overflow-hidden flex flex-col h-full">
                        <div className="h-40 bg-muted relative">
                          {service.images[0] ? (
                            <img 
                              src={service.images[0]} 
                              alt={service.title} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-accent/30 flex items-center justify-center">
                              <Briefcase className="h-10 w-10 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium bg-white/90">
                            ${service.price}
                          </div>
                          {!service.isActive && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="px-3 py-1 bg-white/90 rounded-md text-xs font-medium">
                                Inactive
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-grow">
                          <h4 className="font-medium mb-2">{service.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                            {service.description}
                          </p>
                          <div className="flex items-center text-amber-500 text-sm mb-3">
                            {Array(5).fill(0).map((_, i) => (
                              <span key={i}>★</span>
                            )).slice(0, Math.floor(service.averageRating || 0))}
                            <span className="text-muted-foreground ml-1 text-xs">
                              ({service.totalReviews || 0} reviews)
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {service.tags && service.tags.map((tag, index) => (
                              <span 
                                key={index} 
                                className="px-2 py-1 bg-accent/50 rounded-md text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="p-4 pt-0 flex gap-2 mt-auto">
                          <Link 
                            to={`/service/${service.id}`}
                            className="flex-1 py-2 text-center text-sm rounded-md bg-muted hover:bg-accent transition-colors"
                          >
                            View
                          </Link>
                          <Link 
                            to={`/seller/edit-service/${service.id}`}
                            className="flex-1 py-2 text-center text-sm rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Orders</h2>
                
                {orders.length === 0 ? (
                  <div className="bg-card p-8 rounded-xl border border-border/50 shadow-subtle text-center">
                    <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                    <p className="text-muted-foreground mb-6">You haven't received any orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">
                              {order.serviceTitle || 'Service'}
                            </h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <span className="mr-3">Order ID: {order.id.substring(0, 8)}</span>
                              <span>Buyer: {order.buyerName || (order.buyerId ? `ID: ${order.buyerId.substring(0, 8)}...` : 'Unknown')}</span>
                            </div>
                          </div>
                          <div className="mt-2 md:mt-0">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                              {order.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Order Date</p>
                            <p className="font-medium">{formatDate(order.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Delivery Due</p>
                            <p className="font-medium">{formatDate(order.dueDate)}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-medium">${order.price}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Delivery Time</p>
                            <p className="font-medium">{order.deliveryTime} days</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => navigate(`/order/${order.id}`)}
                            className="py-2 px-4 text-sm rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          >
                            View Details
                          </button>
                          
                          {order.status === OrderStatus.PENDING && (
                            <button className="py-2 px-4 text-sm rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors">
                              Start Order
                            </button>
                          )}
                          
                          {order.status === OrderStatus.IN_PROGRESS && (
                            <button className="py-2 px-4 text-sm rounded-md bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                              Deliver Order
                            </button>
                          )}
                          
                          {order.status === OrderStatus.REVISION_REQUESTED && (
                            <button className="py-2 px-4 text-sm rounded-md bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors">
                              Submit Revision
                            </button>
                          )}
                          
                          <button 
                            onClick={async () => {
                              try {
                                if (!order.buyerId) {
                                console.error("Cannot message buyer: Missing buyer ID");
                                alert("Cannot message buyer: Contact information unavailable");
                                  return;
                                }
                                
                                console.log(`Attempting to navigate to messages with buyer: ${order.buyerId}`);
                                
                                // Try to get the buyer profile to validate the ID before navigating
                                const buyerExists = await getUserProfile(order.buyerId);
                                if (!buyerExists) {
                                  console.error(`Buyer with ID ${order.buyerId} not found in database`);
                                  alert("Cannot message buyer: User not found in our system");
                                  return;
                                }
                                
                                navigate(`/messages/${order.buyerId}`);
                              } catch (err) {
                                console.error("Error navigating to messages:", err);
                                alert("Cannot access messaging at this time. Please try again later.");
                              }
                            }}
                            className="py-2 px-4 text-sm rounded-md bg-muted hover:bg-accent transition-colors"
                          >
                            Message Buyer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'earnings' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Earnings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
                    <h3 className="text-muted-foreground text-sm mb-2">Total Earnings</h3>
                    <p className="text-3xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
                    <h3 className="text-muted-foreground text-sm mb-2">Available for Withdrawal</h3>
                    <p className="text-3xl font-bold">${stats.totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
                    <h3 className="text-muted-foreground text-sm mb-2">Pending Clearance</h3>
                    <p className="text-3xl font-bold">$0.00</p>
                  </div>
                </div>
                
                <div className="bg-card rounded-xl border border-border/50 shadow-subtle">
                  <div className="p-6 border-b border-border/50">
                    <h3 className="font-semibold">Earnings History</h3>
                  </div>
                  
                  {orders.filter(order => order.status === OrderStatus.COMPLETED).length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No earnings history yet</p>
                    </div>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">DATE</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">ORDER</th>
                          <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">BUYER</th>
                          <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground">AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {orders
                          .filter(order => order.status === OrderStatus.COMPLETED)
                          .map((order) => (
                            <tr key={order.id} className="hover:bg-muted/30">
                              <td className="py-3 px-4 text-sm">{formatDate(order.completedAt || order.createdAt)}</td>
                              <td className="py-3 px-4 text-sm">
                                {order.serviceTitle || 'Service'} 
                                <span className="text-xs text-muted-foreground ml-1">
                                  (Order #{order.id.substring(0, 8)})
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm">{order.buyerName || (order.buyerId ? `ID: ${order.buyerId.substring(0, 8)}...` : 'Unknown')}</td>
                              <td className="py-3 px-4 text-sm text-right font-medium">${order.price}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'messages' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Messages</h2>
                <div className="bg-card p-8 rounded-xl border border-border/50 shadow-subtle text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                  <p className="text-muted-foreground mb-6">The messaging interface will be available soon.</p>
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Settings</h2>
                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle mb-6">
                  <h3 className="text-lg font-semibold mb-4">Seller Profile</h3>
                  <form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Professional Title
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Professional Graphic Designer"
                        className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea 
                        placeholder="Tell buyers about yourself and your services..."
                        className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-32"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Skills
                      </label>
                      <input 
                        type="text" 
                        placeholder="e.g. Graphic Design, Logo Design, Illustration"
                        className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    
                    <div className="pt-2">
                      <button 
                        type="button"
                        className="btn-primary"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
                
                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
                  <h3 className="text-lg font-semibold mb-4">Payment Settings</h3>
                  <p className="text-muted-foreground mb-4">Set up your payment method to receive earnings from your services.</p>
                  <button className="btn-primary">
                    Add Payment Method
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard; 