import React, { useState, useEffect } from 'react';
import { Star, Clock, ExternalLink, ImageOff } from 'lucide-react';
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
}

const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  title,
  price,
  description,
  rating,
  deliveryTime,
  image,
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  // Reset error state if image URL changes
  useEffect(() => {
    if (image) {
      setImageError(false);
      setImageLoaded(false);
    }
  }, [image]);
  
  const handleImageError = () => {
    console.error(`Image failed to load for service ${id}: ${image}`);
    // Log more details about the image URL
    if (image) {
      console.log(`Image URL details for ${id}:`, {
        urlLength: image.length,
        startsWithHttp: image.startsWith('http'),
        startsWithHttps: image.startsWith('https'),
        startsWithData: image.startsWith('data:'),
        includesCloudinary: image.includes('cloudinary'),
        firstChars: image.substring(0, Math.min(50, image.length)) + '...'
      });
    }
    setImageError(true);
  };
  
  const handleImageLoad = () => {
    setImageLoaded(true);
    console.log(`Image successfully loaded for service ${id}`);
  };
  
  // Log images that aren't valid at render time
  if (image && !isValidImage(image)) {
    console.warn(`Invalid image format for service ${id}: ${image}`);
  }
  
  return (
    <div className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-subtle card-hover">
      {image && !imageError ? (
        <div className="relative h-48 overflow-hidden">
          <div className="absolute inset-0 bg-black/20 z-10"></div>
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
              <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin"></div>
            </div>
          )}
          <img 
            src={image} 
            alt={title} 
            className={`w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onError={handleImageError}
            onLoad={handleImageLoad}
          />
        </div>
      ) : (
        <div className="relative h-48 bg-muted/30 flex items-center justify-center">
          <ImageOff className="h-12 w-12 text-muted-foreground/50" />
        </div>
      )}
      
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold leading-tight">{title}</h3>
          <div className="text-lg font-bold">
            ${price}
          </div>
        </div>
        
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{description}</p>
        
        <div className="flex justify-between items-center text-sm mb-4">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
            <span>{rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>{deliveryTime}</span>
          </div>
        </div>
        
        <Link 
          to={`/service/${id}`}
          className="flex items-center justify-center w-full py-2 px-4 rounded-md border border-border/80 text-sm font-medium transition-colors hover:bg-accent"
        >
          View Details
          <ExternalLink className="ml-1 h-3 w-3" />
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;
