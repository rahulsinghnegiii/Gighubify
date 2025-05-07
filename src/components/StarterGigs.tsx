import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import { Service } from '@/lib/models/service.model';
import ServiceCard from '@/components/ServiceCard';
import { getServices } from '@/lib/services/service.service';
import { Link } from 'react-router-dom';

interface StarterGigsProps {
  limit?: number;
}

const StarterGigs: React.FC<StarterGigsProps> = ({ limit = 6 }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchStarterGigs = async () => {
      try {
        setLoading(true);
        const starterGigs = await getServices({ isStarterGig: true });
        setServices(starterGigs.slice(0, limit));
        setLoading(false);
      } catch (err) {
        console.error('Error fetching starter gigs:', err);
        setError('Failed to load starter gigs');
        setLoading(false);
      }
    };
    
    fetchStarterGigs();
  }, [limit]);
  
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
      price: service.packages[0]?.price || 0,
      description: service.description,
      rating: service.averageRating || 5.0,
      deliveryTime: `${service.packages[0]?.deliveryTime || 1} days`,
      image: thumbnailUrl,
      isStarterGig: true,
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
  
  return (
    <div className="py-12 bg-gradient-to-r from-green-500/10 to-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="bg-green-500/10 p-2 rounded-full mr-3">
              <Tag className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">$5 Starter Gigs</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Affordable entry-level services for new buyers
              </p>
            </div>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0">
            <div className="flex space-x-2">
              <button
                onClick={scrollLeft}
                className="p-2 rounded-full border border-border hover:bg-accent/30 transition-colors"
                aria-label="Scroll left"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                onClick={scrollRight}
                className="p-2 rounded-full border border-border hover:bg-accent/30 transition-colors"
                aria-label="Scroll right"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          </div>
        ) : services.length > 0 ? (
          <div 
            ref={scrollContainerRef}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:flex md:space-x-6 md:overflow-x-auto md:pb-6 md:scrollbar-hide md:snap-x"
          >
            {services.map((service) => (
              <div key={service.id} className="md:flex-shrink-0 md:w-72 md:snap-start">
                <ServiceCard {...formatServiceForCard(service)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No starter gigs available at the moment.</p>
          </div>
        )}
        
        <div className="text-center mt-6">
          <Link 
            to="/explore?starter=true" 
            className="text-green-600 hover:underline font-medium inline-flex items-center"
          >
            See all $5 starter gigs
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StarterGigs; 