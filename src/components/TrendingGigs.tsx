import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, TrendingUp } from 'lucide-react';
import { Service } from '@/lib/models/service.model';
import ServiceCard from '@/components/ServiceCard';
import { getTrendingGigs } from '@/lib/services/trending.service';
import { Link } from 'react-router-dom';

interface TrendingGigsProps {
  limit?: number;
  showFilter?: boolean;
}

type TimeFilter = 'today' | 'week';

const TrendingGigs: React.FC<TrendingGigsProps> = ({ 
  limit = 10,
  showFilter = true
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchTrendingGigs = async () => {
      try {
        setLoading(true);
        // In a real implementation, we might pass the timeFilter to get different trending periods
        const trendingServices = await getTrendingGigs(limit);
        setServices(trendingServices);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching trending gigs:', err);
        setError('Failed to load trending gigs');
        setLoading(false);
      }
    };
    
    fetchTrendingGigs();
  }, [limit, timeFilter]);
  
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
      isTrending: true,
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
  
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="bg-primary/10 p-2 rounded-full mr-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">Hot Right Now</h2>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0">
            {showFilter && (
              <div className="mr-6 border border-border rounded-lg overflow-hidden bg-background">
                <button
                  className={`px-4 py-2 text-sm ${timeFilter === 'today' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  onClick={() => setTimeFilter('today')}
                >
                  Today
                </button>
                <button
                  className={`px-4 py-2 text-sm ${timeFilter === 'week' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
                  onClick={() => setTimeFilter('week')}
                >
                  This Week
                </button>
              </div>
            )}
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
            className="flex space-x-6 overflow-x-auto pb-6 scrollbar-hide snap-x"
          >
            {services.map((service) => (
              <div key={service.id} className="flex-shrink-0 w-72 snap-start">
                <ServiceCard {...formatServiceForCard(service)} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No trending services available at the moment.</p>
          </div>
        )}
        
        <div className="text-center mt-6">
          <Link 
            to="/explore" 
            className="text-primary hover:underline font-medium inline-flex items-center"
          >
            View all services
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TrendingGigs; 