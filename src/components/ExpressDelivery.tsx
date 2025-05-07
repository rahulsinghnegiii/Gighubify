import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import ServiceCard from './ServiceCard';
import { Service } from '../lib/models/service.model';
import { getServices } from '../lib/services/service.service';
import { useToast } from './ui/use-toast';

interface ExpressDeliveryProps {
  limit?: number;
}

const ExpressDelivery: React.FC<ExpressDeliveryProps> = ({ limit = 6 }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchExpressDeliveryServices = async () => {
      try {
        setLoading(true);
        
        // Fetch services and filter for express delivery (delivery time ≤ 24 hours)
        const allServices = await getServices({}, 20);
        const expressDeliveryServices = allServices.filter(service => {
          const deliveryTimeInHours = (service.packages[0]?.deliveryTime || 1) * 24;
          return deliveryTimeInHours <= 24;
        }).slice(0, limit);
        
        setServices(expressDeliveryServices);
      } catch (err) {
        console.error('Error fetching express delivery services:', err);
        setError('Failed to load express delivery services');
        toast({
          title: "Error",
          description: "Failed to load express delivery services. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExpressDeliveryServices();
  }, [limit, toast]);

  // Map service data to format expected by ServiceCard
  const formatServiceForCard = (service: Service) => {
    // Get thumbnail from the service
    let thumbnailUrl = '';
    
    // Try to get from media array first
    if (service.media && service.media.length > 0) {
      const thumbnailItem = service.media.find(item => item.isThumbnail);
      thumbnailUrl = thumbnailItem ? thumbnailItem.url : service.media[0].url;
    } 
    // Fallback to thumbnail field
    else if (service.thumbnail) {
      thumbnailUrl = service.thumbnail;
    }
    // Fallback to legacy images array
    else if (service.images && service.images.length > 0) {
      thumbnailUrl = service.images[0];
    } else {
      thumbnailUrl = 'https://images.unsplash.com/photo-1574717024453-354056aafa98?ixlib=rb-4.0.3&auto=format&fit=crop&w=2700&q=80';
    }
    
    // Check if this is an express delivery service (≤ 24 hours)
    const deliveryTimeInHours = (service.packages[0]?.deliveryTime || 1) * 24; // Convert days to hours
    const isExpressDelivery = deliveryTimeInHours <= 24;
    
    return {
      id: service.id,
      title: service.title,
      price: service.packages[0]?.price || 0, // Use the price of the first package
      description: service.description,
      rating: service.averageRating || 5.0,
      deliveryTime: `${service.packages[0]?.deliveryTime || 1} days`,
      image: thumbnailUrl,
      isStarterGig: service.isStarterGig || false,
      isExpressDelivery,
      vibes: service.vibes || []
    };
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Zap className="w-6 h-6 text-amber-500 mr-2" />
            Express Delivery
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-subtle h-[400px]">
              <div className="aspect-video bg-muted"></div>
              <div className="p-4">
                <div className="h-6 bg-muted rounded mb-2"></div>
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-6 bg-muted rounded w-1/4 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return null; // Don't show section on error
  }

  if (services.length === 0) {
    return null; // Don't show section if no express delivery services
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <Zap className="w-6 h-6 text-amber-500 mr-2" />
          Express Delivery
          <span className="ml-2 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
            24h or less
          </span>
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={scrollLeft} 
            className="p-2 rounded-full bg-background border border-border hover:bg-accent/30 transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button 
            onClick={scrollRight} 
            className="p-2 rounded-full bg-background border border-border hover:bg-accent/30 transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <Link 
            to="/explore?expressDelivery=true" 
            className="flex items-center ml-2 text-sm text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex space-x-6 overflow-x-auto pb-4 snap-x scrollbar-hide -mx-4 px-4"
      >
        {services.map((service) => (
          <div key={service.id} className="w-[300px] flex-shrink-0 snap-start">
            <ServiceCard {...formatServiceForCard(service)} />
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center">
        <Link 
          to="/explore?expressDelivery=true" 
          className="text-sm text-primary hover:underline inline-flex items-center"
        >
          Browse all Express Delivery Gigs
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>
  );
};

export default ExpressDelivery; 