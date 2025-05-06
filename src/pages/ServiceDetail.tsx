import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Star, User as UserIcon, Calendar, CheckCircle, Image as ImageIcon, Video, Music, FileText, ChevronDown, ChevronUp, X } from 'lucide-react';
import { getService, subscribeToService } from '@/lib/services/service.service';
import { Service } from '@/lib/models/service.model';
import { getUserProfile } from '@/lib/services/user.service';
import { User } from '@/lib/models/user.model';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MediaItem } from '@/lib/services/media.service';
import { MediaType } from '@/lib/utils/cloudinaryUtils';

// MediaGallery component for displaying service media
const MediaGallery = ({ media }: { media?: MediaItem[] }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  if (!media || media.length === 0) {
    return null;
  }
  
  // Get icon based on media type
  const getMediaTypeIcon = (type: MediaType) => {
    switch (type) {
      case MediaType.VIDEO:
        return <Video className="h-5 w-5" />;
      case MediaType.AUDIO:
        return <Music className="h-5 w-5" />;
      case MediaType.DOCUMENT:
        return <FileText className="h-5 w-5" />;
      case MediaType.IMAGE:
      default:
        return <ImageIcon className="h-5 w-5" />;
    }
  };
  
  // Get label based on media type
  const getMediaTypeLabel = (type: MediaType): string => {
    switch (type) {
      case MediaType.VIDEO:
        return 'Video';
      case MediaType.AUDIO:
        return 'Audio';
      case MediaType.DOCUMENT:
        return 'Document';
      case MediaType.IMAGE:
      default:
        return 'Image';
    }
  };
  
  // Find the thumbnail or use the first media item
  const thumbnailItem = media.find(item => item.isThumbnail) || media[0];
  
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Media Gallery</h2>
      
      {/* Main media display */}
      <div className="mb-4">
        <div className="rounded-xl overflow-hidden border border-border/50 shadow-subtle">
          {thumbnailItem.type === MediaType.VIDEO ? (
            <div className="aspect-video">
              <video 
                src={thumbnailItem.url} 
                className="w-full h-full object-contain" 
                controls
                poster={thumbnailItem.url}
              />
            </div>
          ) : thumbnailItem.type === MediaType.AUDIO ? (
            <div className="bg-accent/30 p-8 flex flex-col items-center justify-center">
              <Music className="h-16 w-16 mb-4 text-primary/70" />
              <audio src={thumbnailItem.url} controls className="w-full max-w-md" />
            </div>
          ) : (
            <img 
              src={thumbnailItem.url} 
              alt="Service media" 
              className="w-full object-contain" 
            />
          )}
        </div>
      </div>
      
      {/* Thumbnails for all media items */}
      {media.length > 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {media.map((item, index) => (
            <div 
              key={item.id} 
              className={`relative rounded-lg overflow-hidden border-2 cursor-pointer 
                ${thumbnailItem.id === item.id ? 'border-primary' : 'border-border/50'}`}
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              {item.type === MediaType.VIDEO ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Video className="h-8 w-8 text-white" />
                  </div>
                  <img 
                    src={item.url} 
                    alt="Video thumbnail" 
                    className="w-full aspect-square object-cover"
                  />
                </>
              ) : item.type === MediaType.AUDIO ? (
                <div className="w-full aspect-square bg-accent/30 flex items-center justify-center">
                  <Music className="h-8 w-8 text-primary/70" />
                </div>
              ) : (
                <img 
                  src={item.url} 
                  alt="Media thumbnail" 
                  className="w-full aspect-square object-cover"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 py-1 px-2 text-xs flex items-center">
                {getMediaTypeIcon(item.type)}
                <span className="ml-1">{getMediaTypeLabel(item.type)}</span>
              </div>
              
              {/* Expanded media view */}
              {expandedIndex === index && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 p-4">
                  <div className="max-w-4xl w-full bg-card rounded-xl shadow-lg overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-border/50">
                      <h3 className="font-medium">{getMediaTypeLabel(item.type)}</h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedIndex(null);
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-4">
                      {item.type === MediaType.VIDEO ? (
                        <video 
                          src={item.url} 
                          className="w-full" 
                          controls 
                          autoPlay
                        />
                      ) : item.type === MediaType.AUDIO ? (
                        <div className="flex flex-col items-center py-8">
                          <Music className="h-16 w-16 mb-4 text-primary/70" />
                          <audio src={item.url} controls autoPlay className="w-full max-w-md" />
                        </div>
                      ) : (
                        <img 
                          src={item.url} 
                          alt="Media" 
                          className="w-full object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface ServiceSeller {
  name: string;
  avatar: string;
  memberSince: string;
  responseTime: string;
  completedProjects: number;
}

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<Service | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Convert Firestore timestamp to formatted date string
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'N/A';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  useEffect(() => {
    // Scroll to top when the component mounts
    window.scrollTo(0, 0);
    
    if (!id) {
      setError('Service ID is missing');
      setLoading(false);
      return;
    }

    // Setup real-time subscription to the service
    const unsubscribe = subscribeToService(id, async (serviceData) => {
      if (serviceData) {
        setService(serviceData);
        
        // Fetch seller information
        try {
          const sellerData = await getUserProfile(serviceData.sellerId);
          setSeller(sellerData);
        } catch (err) {
          console.error('Error fetching seller details:', err);
        }
      } else {
        setError('Service not found');
      }
      setLoading(false);
    });
    
    // Cleanup subscription on component unmount
    return () => {
      unsubscribe();
    };
  }, [id]);
  
  const handleOrderNow = () => {
    if (!currentUser) {
      // If user is not logged in, redirect to sign in
      navigate('/signin', { state: { from: { pathname: `/service/${id}` } } });
      return;
    }
    
    // TODO: Implement order creation logic
    console.log('Order now clicked for service:', id);
    // For now, just show an alert
    alert('Ordering functionality will be implemented in the future.');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen pt-28 pb-16 flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
      </div>
    );
  }
  
  if (error || !service) {
    return (
      <div className="min-h-screen pt-28 pb-16 container mx-auto px-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Service Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error || "The service you're looking for doesn't exist or has been removed."}
          </p>
          <Link to="/explore" className="btn-primary">Browse Services</Link>
        </div>
      </div>
    );
  }

  // Get the basic package (first package) details
  const basicPackage = service.packages[0] || {
    price: 0,
    deliveryTime: 1,
    revisions: 1,
    features: []
  };
  
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <Link 
          to="/explore" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to services
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Service primary image or media */}
            <div className="rounded-xl overflow-hidden mb-8 border border-border/50 shadow-subtle">
              {service.media && service.media.length > 0 ? (
                <>
                  {service.media.find(item => item.isThumbnail)?.type === MediaType.VIDEO ? (
                    <video
                      src={service.media.find(item => item.isThumbnail)?.url || service.media[0].url}
                      className="w-full h-auto aspect-video"
                      controls
                    />
                  ) : (
                    <img 
                      src={service.media.find(item => item.isThumbnail)?.url || service.media[0].url} 
                      alt={service.title} 
                      className="w-full h-auto object-cover aspect-video"
                    />
                  )}
                </>
              ) : (
                <img 
                  src={service.images[0] || "https://images.unsplash.com/photo-1574717024453-354056aafa98?ixlib=rb-4.0.3&auto=format&fit=crop&w=2700&q=80"} 
                  alt={service.title} 
                  className="w-full h-auto object-cover aspect-video"
                />
              )}
            </div>
            
            {/* Service title and ratings */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-4">{service.title}</h1>
              <div className="flex items-center text-sm mb-4">
                <div className="flex items-center mr-4">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
                  <span className="font-medium">{service.averageRating?.toFixed(1) || "New"}</span>
                  {service.totalReviews ? (
                    <span className="text-muted-foreground ml-1">({service.totalReviews})</span>
                  ) : null}
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Delivery: {basicPackage.deliveryTime} days</span>
                </div>
              </div>
            </div>
            
            {/* Media Gallery - show all service media */}
            {service.media && service.media.length > 0 && (
              <MediaGallery media={service.media} />
            )}
            
            {/* Service description */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">About This Service</h2>
              <div className="text-muted-foreground space-y-4">
                <p>{service.description}</p>
              </div>
            </div>
            
            {/* Service features */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">What's Included in Basic Package</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {basicPackage.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Service tags */}
            {service.tags && service.tags.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {service.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-accent/50 text-foreground text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* FAQs if available */}
            {service.faqs && service.faqs.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {service.faqs.map((faq, index) => (
                    <div key={index} className="bg-card border border-border/50 rounded-lg p-4">
                      <h3 className="font-medium mb-2">{faq.question}</h3>
                      <p className="text-muted-foreground text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div>
            {/* Service pricing card */}
            <div className="sticky top-28 bg-card rounded-xl border border-border/50 shadow-subtle overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">${basicPackage.price}</h3>
                  <div className="text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 inline mr-1" />
                    {basicPackage.deliveryTime} days
                  </div>
                </div>
                
                <button 
                  onClick={handleOrderNow}
                  className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors mb-4"
                >
                  Order Now
                </button>
                
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between py-2 border-b border-border/50">
                    <span>Revisions</span>
                    <span className="font-medium text-foreground">{basicPackage.revisions}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Seller information */}
            <div className="mt-6 bg-card rounded-xl border border-border/50 shadow-subtle overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">About the Seller</h3>
                {seller ? (
                  <>
                    <div className="flex items-center mb-4">
                      <div className="h-16 w-16 rounded-full bg-muted mr-4 overflow-hidden">
                        {seller.photoURL ? (
                          <img 
                            src={seller.photoURL} 
                            alt={seller.displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-full w-full p-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium">{seller.displayName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {seller.bio || "Professional Video Editor"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <div className="flex items-start py-2 border-b border-border/50">
                        <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                        <div>
                          <span className="text-muted-foreground">Member since</span>
                          <p className="font-medium">{formatDate(seller.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Seller information unavailable</p>
                  </div>
                )}
                
                <button className="w-full mt-4 py-2 px-4 border border-border rounded-md text-sm font-medium hover:bg-accent/30 transition-colors">
                  Contact Seller
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
