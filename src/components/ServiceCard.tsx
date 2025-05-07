import React, { useState, useEffect } from 'react';
import { Star, Clock, ExternalLink, ImageOff, TrendingUp, Tag, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isValidImage } from '../lib/utils/imageUtils';

interface ServiceCardProps {
  id: string;
  title: string;
  price: number;
  description: string;
  rating: number;
  deliveryTime: string;
  image?: string;
  isTrending?: boolean;
  isStarterGig?: boolean;
  isExpressDelivery?: boolean;
  vibes?: string[];
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  title,
  price,
  description,
  rating,
  deliveryTime,
  image,
  isTrending = false,
  isStarterGig = false,
  isExpressDelivery = false,
  vibes = [],
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset error state when image URL changes
  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [image]);
  
  // Handle image loading error
  const handleImageError = () => {
    console.error(`Error loading image for service: ${id}`, {
      imageUrl: image,
      urlLength: image?.length,
      urlStart: image?.substring(0, 30),
      urlEnd: image?.substring(image.length - 30),
      isBase64: image?.startsWith('data:'),
      isHttp: image?.startsWith('http'),
    });
    setImageError(true);
    setImageLoaded(true);
  };
  
  // Handle image successful load
  const handleImageLoad = () => {
    console.log(`Image loaded successfully for service: ${id}`);
    setImageLoaded(true);
  };
  
  // Warn if image URL isn't valid at render time
  if (image && !isValidImage(image)) {
    console.warn(`Invalid image format for service: ${id}`, { image });
  }

  // Show max 3 vibes, indicate additional with +X
  const visibleVibes = vibes.slice(0, 3);
  const hasMoreVibes = vibes.length > 3;

  return (
    <Link
      to={`/service/${id}`}
      className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-subtle transition-all duration-300 hover:shadow-md hover:border-border/80 flex flex-col h-full relative"
    >
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        {isTrending && (
          <div className="bg-primary/90 text-primary-foreground text-xs font-medium px-2 py-1 rounded-full flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />
            Trending
          </div>
        )}
        
        {isExpressDelivery && (
          <div className="bg-amber-500/90 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center">
            <Zap className="h-3 w-3 mr-1" />
            Express 
          </div>
        )}
      </div>
      
      {isStarterGig && (
        <div className="absolute top-2 right-2 z-10 bg-green-500/90 text-white text-xs font-medium px-2 py-1 rounded-full">
          $5 Starter
        </div>
      )}
      
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
            <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
          </div>
        )}
        
        {!imageError ? (
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <ImageOff className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>
      
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="font-semibold text-base mb-1 line-clamp-1">{title}</h3>
        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{description}</p>
        
        {/* Vibe tags */}
        {vibes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {visibleVibes.map((vibe) => (
              <span 
                key={vibe} 
                className="text-xs px-2 py-0.5 bg-accent/50 rounded-full flex items-center"
              >
                <Tag className="h-2.5 w-2.5 mr-1" />
                {vibe}
              </span>
            ))}
            {hasMoreVibes && (
              <span className="text-xs px-2 py-0.5 bg-accent/50 rounded-full text-muted-foreground">
                +{vibes.length - 3}
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center mt-auto">
          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
          <span className="text-sm font-medium">{rating.toFixed(1)}</span>
          <span className="mx-2 text-muted-foreground">•</span>
          <Clock className="h-4 w-4 text-muted-foreground mr-1" />
          <span className="text-sm text-muted-foreground">{deliveryTime}</span>
        </div>
        
        <div className="border-t border-border mt-3 pt-3 flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Starting at</span>
          <span className="font-bold text-primary">${price}</span>
        </div>
      </div>
    </Link>
  );
};

export default ServiceCard;
