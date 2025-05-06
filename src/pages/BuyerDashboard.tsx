import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getBuyerOrders } from '@/lib/services/order.service';
import { Order, OrderStatus } from '@/lib/services/order.service';
import { getService } from '@/lib/services/service.service';
import { Service } from '@/lib/models/service.model';
import { User, UserRole } from '@/lib/models/user.model';
import { getUserProfile, updateUserProfile, updateProfileImage } from '@/lib/services/user.service';
import { Clock, Package, User as UserIcon, Settings, ShoppingBag, Star, Calendar, Edit, Image as ImageIcon, Video, Music, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { COLLECTIONS, setDocument, serverTimestamp } from '@/lib/firebase/firestore';
import { MediaItem } from '@/lib/services/media.service';
import { MediaType } from '@/lib/utils/cloudinaryUtils';

// Add a new component for media gallery
const MediaGallery = ({ media }: { media?: MediaItem[] }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!media || media.length === 0) {
    return null;
  }
  
  // Get thumbnail or first media item
  const thumbnailItem = media.find(item => item.isThumbnail) || media[0];
  // Get up to 3 additional media items when expanded
  const additionalMedia = expanded 
    ? media.filter(item => item.id !== thumbnailItem.id).slice(0, 6) 
    : [];
  
  // Get icon based on media type
  const getMediaTypeIcon = (type: MediaType) => {
    switch (type) {
      case MediaType.VIDEO:
        return <Video className="h-4 w-4" />;
      case MediaType.AUDIO:
        return <Music className="h-4 w-4" />;
      case MediaType.DOCUMENT:
        return <FileText className="h-4 w-4" />;
      case MediaType.IMAGE:
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="mt-4">
      <div className="border-t border-border/50 pt-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium">Service Media</h4>
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex items-center text-xs text-primary"
          >
            {expanded ? (
              <>Hide <ChevronUp className="h-3 w-3 ml-1" /></>
            ) : (
              <>View All <ChevronDown className="h-3 w-3 ml-1" /></>
            )}
          </button>
        </div>
        
        {/* Main thumbnail display */}
        <div className="relative rounded-md overflow-hidden bg-muted mb-2">
          {thumbnailItem.type === MediaType.VIDEO ? (
            <video 
              src={thumbnailItem.url} 
              className="w-full h-48 object-cover" 
              controls
            />
          ) : thumbnailItem.type === MediaType.AUDIO ? (
            <div className="w-full h-24 flex items-center justify-center bg-accent/20 p-4">
              <Music className="h-8 w-8 text-muted-foreground mr-2" />
              <audio src={thumbnailItem.url} controls className="w-full" />
            </div>
          ) : (
            <img 
              src={thumbnailItem.url} 
              alt="Service media" 
              className="w-full h-48 object-cover" 
            />
          )}
          <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1">
            {getMediaTypeIcon(thumbnailItem.type)}
          </div>
        </div>
        
        {/* Additional media items */}
        {expanded && additionalMedia.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-2">
            {additionalMedia.map(item => (
              <div key={item.id} className="relative rounded-md overflow-hidden bg-muted">
                {item.type === MediaType.VIDEO ? (
                  <video 
                    src={item.url} 
                    className="w-full h-24 object-cover" 
                    onClick={() => window.open(item.url, '_blank')}
                    style={{ cursor: 'pointer' }}
                  />
                ) : item.type === MediaType.AUDIO ? (
                  <div 
                    className="w-full h-24 flex items-center justify-center bg-accent/20"
                    onClick={() => window.open(item.url, '_blank')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Music className="h-6 w-6 text-muted-foreground" />
                  </div>
                ) : (
                  <img 
                    src={item.url} 
                    alt="Service media" 
                    className="w-full h-24 object-cover" 
                    onClick={() => window.open(item.url, '_blank')}
                    style={{ cursor: 'pointer' }}
                  />
                )}
                <div className="absolute top-1 right-1 bg-background/80 rounded-full p-1">
                  {getMediaTypeIcon(item.type)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const BuyerDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderServices, setOrderServices] = useState<{ [key: string]: Service | null }>({});
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if user is not logged in or is a seller
  useEffect(() => {
    if (!currentUser) {
      navigate('/signin', { state: { from: { pathname: '/dashboard' } } });
    }
  }, [currentUser, navigate]);
  
  // Fetch user profile and orders
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch user profile
        let userProfile = await getUserProfile(currentUser.uid);
        
        // Create profile if it doesn't exist
        if (!userProfile && currentUser) {
          // Create a basic user profile from Auth data
          await setDocument(COLLECTIONS.USERS, currentUser.uid, {
            id: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'User',
            photoURL: currentUser.photoURL || null,
            role: UserRole.USER,
            isSeller: false,
            isVerified: currentUser.emailVerified,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          
          // Fetch the newly created profile
          userProfile = await getUserProfile(currentUser.uid);
        }
        
        setProfile(userProfile);
        
        // If user is a seller, redirect to seller dashboard
        if (userProfile?.isSeller) {
          navigate('/seller/dashboard');
          return;
        }
        
        // Fetch orders
        const userOrders = await getBuyerOrders(currentUser.uid);
        setOrders(userOrders);
        
        // Fetch services for each order
        const servicesMap: { [key: string]: Service | null } = {};
        await Promise.all(
          userOrders.map(async (order) => {
            try {
              const service = await getService(order.serviceId);
              servicesMap[order.serviceId] = service;
            } catch (err) {
              console.error('Error fetching service:', err);
              servicesMap[order.serviceId] = null;
            }
          })
        );
        setOrderServices(servicesMap);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser, navigate]);
  
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
  
  // Handle file upload for profile picture
  const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    
    try {
      await updateProfileImage(currentUser.uid, file);
      // Refresh user profile
      const updatedProfile = await getUserProfile(currentUser.uid);
      setProfile(updatedProfile);
    } catch (err) {
      console.error('Error uploading profile image:', err);
      setError('Failed to upload profile image. Please try again.');
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
                <div className="relative mb-4">
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
                  <label htmlFor="profile-image-upload" className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer">
                    <Edit className="h-4 w-4" />
                    <input 
                      id="profile-image-upload" 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleProfileImageUpload}
                    />
                  </label>
                </div>
                <h3 className="font-semibold text-lg">{profile?.displayName || 'User'}</h3>
                <p className="text-sm text-muted-foreground">{profile?.email || ''}</p>
              </div>
              
              {/* Navigation */}
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${activeTab === 'orders' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
                >
                  <Package className="h-4 w-4 mr-3" />
                  Orders
                </button>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center px-3 py-2 rounded-md text-sm ${activeTab === 'profile' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'}`}
                >
                  <UserIcon className="h-4 w-4 mr-3" />
                  Profile
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
            {activeTab === 'orders' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Orders</h2>
                
                {orders.length === 0 ? (
                  <div className="bg-card p-8 rounded-xl border border-border/50 shadow-subtle text-center">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
                    <p className="text-muted-foreground mb-6">You haven't placed any orders yet. Browse services to get started.</p>
                    <button 
                      onClick={() => navigate('/explore')}
                      className="btn-primary"
                    >
                      Explore Services
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {orders.map((order) => {
                      const service = orderServices[order.serviceId];
                      return (
                        <div key={order.id} className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
                          <div className="flex flex-col md:flex-row items-start gap-4">
                            {/* Service image - use thumbnail or first image if available */}
                            <div className="w-full md:w-24 h-24 rounded-md overflow-hidden bg-muted flex-shrink-0">
                              {service?.media && service.media.length > 0 ? (
                                <>
                                  {service.media.find(item => item.isThumbnail)?.type === MediaType.VIDEO ? (
                                    <video
                                      src={service.media.find(item => item.isThumbnail)?.url || service.media[0].url}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <img 
                                      src={service.media.find(item => item.isThumbnail)?.url || service.media[0].url} 
                                      alt={service.title} 
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </>
                              ) : service?.images[0] ? (
                                <img 
                                  src={service.images[0]} 
                                  alt={service.title} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-accent/30 flex items-center justify-center">
                                  <Package className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            {/* Order details */}
                            <div className="flex-grow">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                <h3 className="font-semibold text-lg">
                                  {service?.title || 'Service Unavailable'}
                                </h3>
                                <div className="flex items-center">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                                    {order.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center text-muted-foreground">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  Ordered: {formatDate(order.createdAt)}
                                </div>
                                <div className="flex items-center text-muted-foreground">
                                  <Clock className="h-4 w-4 mr-2" />
                                  Delivery: {order.deliveryTime} days
                                </div>
                                <div className="font-medium">
                                  ${order.price}
                                </div>
                              </div>
                              
                              {/* Add Media Gallery Component */}
                              {service?.media && service.media.length > 0 && (
                                <MediaGallery media={service.media} />
                              )}
                              
                              <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-2">
                                <button 
                                  onClick={() => navigate(`/order/${order.id}`)}
                                  className="py-1 px-3 text-xs rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                >
                                  View Details
                                </button>
                                
                                {order.status === OrderStatus.DELIVERED && (
                                  <button className="py-1 px-3 text-xs rounded-md bg-green-100 text-green-800 hover:bg-green-200 transition-colors">
                                    Accept Delivery
                                  </button>
                                )}
                                
                                {order.status === OrderStatus.DELIVERED && (
                                  <button className="py-1 px-3 text-xs rounded-md bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors">
                                    Request Revision
                                  </button>
                                )}
                                
                                {(order.status === OrderStatus.PENDING || order.status === OrderStatus.IN_PROGRESS) && (
                                  <button className="py-1 px-3 text-xs rounded-md bg-red-100 text-red-800 hover:bg-red-200 transition-colors">
                                    Cancel Order
                                  </button>
                                )}
                                
                                {order.status === OrderStatus.COMPLETED && (
                                  <button className="py-1 px-3 text-xs rounded-md bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors">
                                    Leave Review
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">My Profile</h2>
                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
                  <form className="space-y-4">
                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                        Display Name
                      </label>
                      <input 
                        id="displayName" 
                        type="text" 
                        value={profile?.displayName || ''} 
                        onChange={(e) => setProfile(prev => prev ? {...prev, displayName: e.target.value} : null)}
                        className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input 
                        id="email" 
                        type="email" 
                        value={profile?.email || ''} 
                        disabled
                        className="w-full py-2 px-3 rounded-md border border-border bg-muted cursor-not-allowed"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                    
                    <div>
                      <label htmlFor="bio" className="block text-sm font-medium mb-1">
                        Bio
                      </label>
                      <textarea 
                        id="bio" 
                        value={profile?.bio || ''} 
                        onChange={(e) => setProfile(prev => prev ? {...prev, bio: e.target.value} : null)}
                        className="w-full py-2 px-3 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-24"
                        placeholder="Tell us a bit about yourself..."
                      />
                    </div>
                    
                    <div className="pt-4">
                      <button 
                        type="button"
                        onClick={async () => {
                          if (!currentUser || !profile) return;
                          
                          try {
                            await updateUserProfile(currentUser.uid, {
                              displayName: profile.displayName,
                              bio: profile.bio
                            });
                            alert('Profile updated successfully');
                          } catch (err) {
                            console.error('Error updating profile:', err);
                            setError('Failed to update profile. Please try again.');
                          }
                        }}
                        className="btn-primary"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div>
                <h2 className="text-2xl font-bold mb-6">Settings</h2>
                <div className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Notifications</h4>
                            <p className="text-sm text-muted-foreground">Receive email notifications</p>
                          </div>
                          <div className="h-6 w-11 rounded-full bg-primary relative">
                            <div className="h-5 w-5 rounded-full bg-white absolute right-0.5 top-0.5"></div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Marketing Emails</h4>
                            <p className="text-sm text-muted-foreground">Receive marketing emails</p>
                          </div>
                          <div className="h-6 w-11 rounded-full bg-muted relative">
                            <div className="h-5 w-5 rounded-full bg-white absolute left-0.5 top-0.5"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-border/50">
                      <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
                      <div className="space-y-4">
                        <button className="text-primary hover:underline text-sm">
                          Change Password
                        </button>
                        <button className="text-destructive hover:underline text-sm">
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard; 