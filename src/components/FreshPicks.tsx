import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { Service } from '@/lib/models/service.model';
import ServiceCard from '@/components/ServiceCard';
import CountdownTimer from '@/components/CountdownTimer';
import { getFreshPicks, getFreshPicksConfig } from '@/lib/services/freshPicks.service';
import { Link } from 'react-router-dom';

interface FreshPicksProps {
  limit?: number;
}

const FreshPicks: React.FC<FreshPicksProps> = ({ limit = 6 }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextRotation, setNextRotation] = useState<Date>(new Date(Date.now() + 3600000)); // Default to 1 hour from now
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const fetchFreshPicks = async () => {
      try {
        setLoading(true);
        
        // Get the fresh picks
        const freshPicksServices = await getFreshPicks(limit);
        setServices(freshPicksServices);
        
        // Get the configuration to determine next rotation
        const config = await getFreshPicksConfig();
        if (config && config.lastRotation) {
          const lastRotation = config.lastRotation.toDate ? config.lastRotation.toDate() : new Date(0);
          // Next rotation is 1 hour after the last rotation
          const nextRotationTime = new Date(lastRotation.getTime() + 3600000);
          setNextRotation(nextRotationTime);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching fresh picks:', err);
        setError('Failed to load fresh picks');
        setLoading(false);
      }
    };
    
    fetchFreshPicks();
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
  
  const handleRotationComplete = () => {
    // Refresh the fresh picks when the countdown completes
    window.location.reload();
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
    <div className="py-12 bg-gradient-to-r from-accent/30 to-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="bg-primary/10 p-2 rounded-full mr-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Fresh Picks</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Discover new and talented editors
              </p>
            </div>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0">
            <CountdownTimer 
              targetTime={nextRotation} 
              onComplete={handleRotationComplete}
              className="mr-6"
            />
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
            <p>No fresh picks available at the moment.</p>
          </div>
        )}
        
        <div className="text-center mt-6">
          <Link 
            to="/explore?filter=new" 
            className="text-primary hover:underline font-medium inline-flex items-center"
          >
            See all new editors
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FreshPicks; 