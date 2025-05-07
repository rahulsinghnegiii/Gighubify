import React, { useState, useEffect } from 'react';
import { Search, Sliders, X, Tag } from 'lucide-react';
import ServiceCard from '@/components/ServiceCard';
import { getServices } from '@/lib/services/service.service';
import { Service, ServiceFilter, ServiceCategories, EditorVibes } from '@/lib/models/service.model';
import { useLocation, useNavigate } from 'react-router-dom';

// Categories for filtering - using categories from the service model
const categories = ServiceCategories.map(category => ({
  id: category.id,
  label: category.title
}));

const Explore = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState(queryParams.get('searchTerm') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    queryParams.get('category') ? [queryParams.get('category') as string] : []
  );
  const [selectedVibes, setSelectedVibes] = useState<string[]>(
    queryParams.get('vibes') ? queryParams.get('vibes').split(',') : []
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 300]);
  const [showStarterGigs, setShowStarterGigs] = useState(queryParams.get('starter') === 'true');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch services when search params change
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Build filter based on search params
        const filter: ServiceFilter = {};
        
        if (selectedCategories.length > 0) {
          filter.category = selectedCategories[0];
        }
        
        if (searchTerm) {
          filter.searchTerm = searchTerm;
        }
        
        if (priceRange[0] > 0 || priceRange[1] < 300) {
          filter.minPrice = priceRange[0];
          filter.maxPrice = priceRange[1];
        }
        
        if (showStarterGigs) {
          filter.isStarterGig = true;
        }
        
        if (selectedVibes.length > 0) {
          filter.vibes = selectedVibes;
        }
        
        const fetchedServices = await getServices(filter);
        
        // Debug logging to diagnose thumbnail issues
        console.log('First 3 services:', fetchedServices.slice(0, 3).map(service => ({
          id: service.id,
          title: service.title,
          thumbnail: service.thumbnail,
          hasMedia: !!service.media?.length,
          mediaCount: service.media?.length || 0,
          thumbnailItem: service.media?.find(item => item.isThumbnail),
          firstMediaUrl: service.media?.[0]?.url,
          hasImages: !!service.images?.length,
          imagesCount: service.images?.length || 0,
          firstImageUrl: service.images?.[0]
        })));
        
        setServices(fetchedServices);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Failed to load services');
        setIsLoading(false);
      }
    };
    
    fetchServices();
  }, [searchTerm, selectedCategories, priceRange, showStarterGigs, selectedVibes]);

  // Update URL search params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) {
      params.set('searchTerm', searchTerm);
    }
    
    if (selectedCategories.length > 0) {
      params.set('category', selectedCategories[0]);
    }
    
    if (showStarterGigs) {
      params.set('starter', 'true');
    }
    
    if (selectedVibes.length > 0) {
      params.set('vibes', selectedVibes.join(','));
    }
    
    const newUrl = 
      `${location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    
    navigate(newUrl, { replace: true });
  }, [searchTerm, selectedCategories, showStarterGigs, selectedVibes, navigate, location.pathname]);

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        // Currently only supporting one category at a time
        return [categoryId];
      }
    });
  };
  
  const handleVibeChange = (vibe: string) => {
    setSelectedVibes(prev => {
      if (prev.includes(vibe)) {
        return prev.filter(v => v !== vibe);
      } else {
        return [...prev, vibe];
      }
    });
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setPriceRange([0, 300]);
    setShowStarterGigs(false);
    setSelectedVibes([]);
    navigate(location.pathname, { replace: true });
  };

  // Map service data to format expected by ServiceCard
  const formatServiceForCard = (service: Service) => {
    // Get thumbnail from the service
    let thumbnailUrl = '';
    
    console.log(`Formatting service: ${service.id} - ${service.title}`);
    
    // Debug whole service object (except large media data)
    const debugService = {...service};
    if (debugService.media) {
      debugService.media = debugService.media.map(m => ({
        id: m.id,
        type: m.type,
        isThumbnail: m.isThumbnail,
        format: m.format,
        urlStart: m.url?.substring(0, 50) + '...'
      }));
    }
    console.log('Service data:', debugService);
    
    // Try to get from media array first
    if (service.media && service.media.length > 0) {
      console.log(`Service ${service.id} has ${service.media.length} media items`);
      
      // Look for the item marked as thumbnail
      const thumbnailItem = service.media.find(item => item.isThumbnail);
      
      if (thumbnailItem) {
        console.log(`Found thumbnail item: ${thumbnailItem.id} - Type: ${thumbnailItem.type}`);
        // For troubleshooting, check the URL structure
        const urlPreview = thumbnailItem.url?.substring(0, 50) + '...';
        console.log(`Thumbnail URL preview: ${urlPreview}`);
        thumbnailUrl = thumbnailItem.url;
      } else {
        console.log(`No thumbnail item found, using first media item`);
        // For troubleshooting, check the URL structure
        const urlPreview = service.media[0].url?.substring(0, 50) + '...';
        console.log(`First media URL preview: ${urlPreview}`);
        thumbnailUrl = service.media[0].url;
      }
    } 
    // Fallback to thumbnail field
    else if (service.thumbnail) {
      console.log(`Using service.thumbnail for ${service.id}`);
      // For troubleshooting, check the URL structure
      const urlPreview = service.thumbnail?.substring(0, 50) + '...';
      console.log(`Thumbnail field URL preview: ${urlPreview}`);
      thumbnailUrl = service.thumbnail;
    }
    // Fallback to legacy images array
    else if (service.images && service.images.length > 0) {
      console.log(`Using first item from legacy images array for ${service.id}`);
      // For troubleshooting, check the URL structure
      const urlPreview = service.images[0]?.substring(0, 50) + '...';
      console.log(`Legacy image URL preview: ${urlPreview}`);
      thumbnailUrl = service.images[0];
    } else {
      console.log(`No thumbnail found for service: ${service.id}`);
    }
    
    // Make sure thumbnailUrl is a string and not undefined or null
    if (!thumbnailUrl) {
      console.log(`Using fallback image for ${service.id}`);
      thumbnailUrl = 'https://images.unsplash.com/photo-1574717024453-354056aafa98?ixlib=rb-4.0.3&auto=format&fit=crop&w=2700&q=80';
    }
    
    const result = {
      id: service.id,
      title: service.title,
      price: service.packages[0]?.price || 0, // Use the price of the first package
      description: service.description,
      rating: service.averageRating || 5.0,
      deliveryTime: `${service.packages[0]?.deliveryTime || 1} days`,
      image: thumbnailUrl,
      isStarterGig: service.isStarterGig || false,
      vibes: service.vibes || []
    };
    
    console.log(`Final image URL for ${service.id}: ${result.image.substring(0, 50)}...`);
    return result;
  };
  
  return (
    <div className="min-h-screen pt-28 pb-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Video Editing Services</h1>
          <p className="text-muted-foreground max-w-3xl">
            Browse our selection of professional video editors and services. Use the filters to narrow down your search.
          </p>
        </div>
        
        {/* Search and filter controls */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search for services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-3 flex items-center"
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="md:hidden flex items-center justify-center py-2 px-4 rounded-lg border border-border bg-background"
          >
            <Sliders className="h-5 w-5 mr-2" />
            Filters
          </button>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={handleClearFilters}
              className="py-2 px-4 text-sm border border-border rounded-lg hover:bg-accent/30 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filter sidebar - desktop */}
          <div className="hidden md:block">
            <div className="bg-card p-6 border border-border/50 rounded-lg shadow-subtle">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>
              
              <div className="mb-6">
                <h3 className="font-medium mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`cat-${category.id}`}
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryChange(category.id)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <label htmlFor={`cat-${category.id}`} className="ml-2 text-sm">
                        {category.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-3">Price Range</h3>
                <div className="px-2">
                <input
                  type="range"
                  min="0"
                  max="300"
                  step="10"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full"
                />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-3">Editor Vibes</h3>
                <div className="flex flex-wrap gap-2">
                  {EditorVibes.map((vibe) => (
                    <button
                      key={vibe}
                      onClick={() => handleVibeChange(vibe)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors flex items-center ${
                        selectedVibes.includes(vibe)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-accent/30'
                      }`}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {vibe}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-medium mb-3">Special Offers</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="starter-gigs"
                      checked={showStarterGigs}
                      onChange={(e) => setShowStarterGigs(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                    />
                    <label htmlFor="starter-gigs" className="ml-2 text-sm flex items-center">
                      $5 Starter Gigs
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-600 rounded">New</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Filter sidebar - mobile */}
          {isFilterOpen && (
            <div className="md:hidden fixed inset-0 bg-background/90 z-50 p-4">
              <div className="bg-card p-6 border border-border/50 rounded-lg shadow-subtle max-w-md mx-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <button onClick={() => setIsFilterOpen(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`mobile-cat-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryChange(category.id)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                        />
                        <label htmlFor={`mobile-cat-${category.id}`} className="ml-2 text-sm">
                          {category.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Price Range</h3>
                  <div className="px-2">
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="10"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Editor Vibes</h3>
                  <div className="flex flex-wrap gap-2">
                    {EditorVibes.map((vibe) => (
                      <button
                        key={vibe}
                        onClick={() => handleVibeChange(vibe)}
                        className={`px-2 py-1 text-xs rounded-full border transition-colors flex items-center ${
                          selectedVibes.includes(vibe)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border hover:bg-accent/30'
                        }`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {vibe}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Special Offers</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="mobile-starter-gigs"
                        checked={showStarterGigs}
                        onChange={(e) => setShowStarterGigs(e.target.checked)}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
                      />
                      <label htmlFor="mobile-starter-gigs" className="ml-2 text-sm flex items-center">
                        $5 Starter Gigs
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-green-500/20 text-green-600 rounded">New</span>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      handleClearFilters();
                      setIsFilterOpen(false);
                    }}
                    className="flex-1 py-2 border border-border rounded-lg"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Services grid */}
          <div className="md:col-span-3">
            {error && (
              <div className="text-center py-8 text-destructive">
                <p>{error}</p>
              </div>
            )}
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
              </div>
            ) : services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <ServiceCard key={service.id} {...formatServiceForCard(service)} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card border border-border/50 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">No services found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search filters or check back later for new services.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="py-2 px-4 bg-primary text-primary-foreground rounded-lg"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Explore;
