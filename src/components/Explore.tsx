import React, { useState } from 'react';
import { Service } from '../types/Service';
import { ServiceFilter } from '../types/ServiceFilter';
import { PriceRangeSlider } from './PriceRangeSlider';

// Service filter state
const [filter, setFilter] = useState<ServiceFilter>({
  minPrice: 0,
  maxPrice: 5000,
  categories: [], 
  searchQuery: '',
  tags: [],
  isStarterGig: false,
  vibes: []
});

// Format service data for ServiceCard component
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
    isStarterGig: service.isStarterGig || false,
    isExpressDelivery,
    vibes: service.vibes || []
  };
};

<div className="p-4 bg-white rounded-lg shadow-sm">
  <h3 className="text-lg font-medium text-gray-900 mb-3">Pricing</h3>
  <div className="space-y-3">
    {/* Price Range Slider */}
    <div>
      <span className="text-sm font-medium text-gray-700">Price Range: ${filter.minPrice} - ${filter.maxPrice}</span>
      <div className="mt-1">
        <PriceRangeSlider 
          min={0} 
          max={5000}
          value={[filter.minPrice, filter.maxPrice]}
          onValueChange={(value) => {
            setFilter({
              ...filter,
              minPrice: value[0],
              maxPrice: value[1]
            });
          }}
        />
      </div>
    </div>
    
    {/* $5 Starter Gigs Checkbox */}
    <div className="flex items-center">
      <input
        id="starter-gig"
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        checked={filter.isStarterGig}
        onChange={(e) => {
          setFilter({
            ...filter,
            isStarterGig: e.target.checked
          });
        }}
      />
      <label htmlFor="starter-gig" className="ml-2 text-sm text-gray-700">
        $5 Starter Gigs
      </label>
    </div>

    {/* Express Delivery Checkbox */}
    <div className="flex items-center">
      <input
        id="express-delivery"
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
        checked={filter.expressDelivery}
        onChange={(e) => {
          setFilter({
            ...filter,
            expressDelivery: e.target.checked
          });
        }}
      />
      <label htmlFor="express-delivery" className="ml-2 text-sm text-gray-700">
        Express Delivery (24h or less)
      </label>
    </div>
  </div>
</div> 