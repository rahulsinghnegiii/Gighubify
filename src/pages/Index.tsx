import React, { useEffect, useState } from 'react';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import TrendingGigs from '@/components/TrendingGigs';
import FreshPicks from '@/components/FreshPicks';
import StarterGigs from '@/components/StarterGigs';
import ExpressDelivery from '@/components/ExpressDelivery';
import BestVideoEdits from '@/components/BestVideoEdits';
import { ArrowRight, Star, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ServiceCard from '@/components/ServiceCard';
import { getServices } from '@/lib/services/service.service';
import { Service } from '@/lib/models/service.model';

// Mock data for testimonials
const testimonials = [
  {
    id: '1',
    name: 'Sarah Johnson',
    role: 'YouTube Creator',
    content: 'GigHubify has completely transformed my content creation process. I found an amazing editor who understands my style perfectly.',
    avatar: 'https://randomuser.me/api/portraits/women/11.jpg'
  },
  {
    id: '2',
    name: 'Michael Chen',
    role: 'Marketing Director',
    content: 'The quality of editors on this platform is outstanding. Quick turnaround times and professional results every time.',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '3',
    name: 'Alex Rivera',
    role: 'Independent Filmmaker',
    content: 'As a filmmaker with tight deadlines, finding reliable editors is crucial. GigHubify has been a game-changer for my projects.',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg'
  }
];

// Service categories
const categories = [
  {
    id: 'youtube',
    title: 'YouTube Videos',
    icon: '🎬',
    count: 245
  },
  {
    id: 'social',
    title: 'Social Media',
    icon: '📱',
    count: 187
  },
  {
    id: 'wedding',
    title: 'Wedding Films',
    icon: '💍',
    count: 96
  },
  {
    id: 'corporate',
    title: 'Corporate Videos',
    icon: '🏢',
    count: 152
  },
  {
    id: 'color',
    title: 'Color Grading',
    icon: '🎨',
    count: 120
  },
  {
    id: 'animation',
    title: 'Animation',
    icon: '✨',
    count: 83
  }
];

// How it works steps
const howItWorks = [
  {
    id: '1',
    title: 'Find the Perfect Editor',
    description: 'Browse editor profiles and reviews to find the right match for your project.',
    icon: '🔍'
  },
  {
    id: '2',
    title: 'Communicate Your Needs',
    description: 'Discuss project details, requirements, and expectations directly with the editor.',
    icon: '💬'
  },
  {
    id: '3',
    title: 'Receive Quality Edits',
    description: 'Get your professionally edited videos delivered within the specified timeframe.',
    icon: '📽️'
  },
  {
    id: '4',
    title: 'Request Revisions If Needed',
    description: "Work with your editor on adjustments until you're completely satisfied.",
    icon: '✏️'
  }
];

const Index = () => {
  const [featuredServices, setFeaturedServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured services from Firebase
  useEffect(() => {
    const fetchFeaturedServices = async () => {
      try {
        setIsLoading(true);
        // Get top-rated services limited to 3
        const services = await getServices({ minRating: 4 });
        // Take only first 3 services
        setFeaturedServices(services.slice(0, 3));
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching featured services:', err);
        setError('Failed to load featured services. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchFeaturedServices();
  }, []);

  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
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
    
    // Check if this is an express delivery service (≤ 24 hours)
    const deliveryTimeInHours = (service.packages[0]?.deliveryTime || 1) * 24; // Convert days to hours
    const isExpressDelivery = deliveryTimeInHours <= 24;
    
    const result = {
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
    
    console.log(`Final image URL for ${service.id}: ${result.image.substring(0, 50)}...`);
    return result;
  };
  
  return (
    <main>
      <Hero />
      <Features />
      
      {/* Trending Gigs Section */}
      <TrendingGigs limit={8} showFilter={true} />
      
      {/* Fresh Picks Section */}
      <FreshPicks limit={6} />
      
      {/* $5 Starter Gigs Section */}
      <StarterGigs limit={6} />
      
      {/* Express Delivery Section */}
      <ExpressDelivery limit={6} />
      
      {/* Popular Categories */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Popular Categories</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find video editing services across various categories
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category) => (
              <Link 
                key={category.id} 
                to={`/explore?category=${category.id}`}
                className="bg-card hover:bg-accent/30 transition-colors border border-border/50 rounded-xl p-4 text-center card-hover"
              >
                <div className="text-4xl mb-2">{category.icon}</div>
                <h3 className="font-medium mb-1">{category.title}</h3>
                <p className="text-sm text-muted-foreground">{category.count} services</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Services */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">Featured Services</h2>
              <p className="mt-2 text-muted-foreground">Discover our top-rated video editing services</p>
            </div>
            <Link 
              to="/explore" 
              className="mt-4 md:mt-0 group flex items-center text-primary font-medium"
            >
              View all services
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          {error && (
            <div className="text-center py-8 text-destructive">
              <p>{error}</p>
            </div>
          )}
          
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
            </div>
          ) : featuredServices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredServices.map((service) => (
                <ServiceCard key={service.id} {...formatServiceForCard(service)} />
              ))}
            </div>
          ) : !error ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No featured services available at the moment.</p>
            </div>
          ) : null}
        </div>
      </section>
      
      {/* Best Video Edits Showcase */}
      <BestVideoEdits limit={6} />
      
      {/* How It Works */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How GigHubify Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A simple process to connect with video editors and get your project done
            </p>
          </div>
          
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-border/50 -translate-y-1/2 z-0"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {howItWorks.map((step, index) => (
                <div key={step.id} className="relative z-10">
                  <div className="bg-card border border-border/50 rounded-xl p-6 text-center h-full flex flex-col items-center shadow-subtle">
                    <div className="relative">
                      <div className="h-16 w-16 rounded-full bg-accent flex items-center justify-center text-3xl mb-4">
                        {step.icon}
                      </div>
                      <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link to="/explore" className="btn-primary">
              Find an Editor Now
            </Link>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">What Our Clients Say</h2>
            <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
              Hear from creators and businesses who've found the perfect video editors
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-card p-6 rounded-xl border border-border/50 shadow-subtle">
                <div className="flex items-center mb-4">
                  <img 
                    src={testimonial.avatar} 
                    alt={testimonial.name} 
                    className="h-12 w-12 rounded-full object-cover mr-4"
                  />
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-muted-foreground italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <p>Professional Editors</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15,000+</div>
              <p>Completed Projects</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <p>Client Satisfaction</p>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <p>Customer Support</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* From the Blog */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold">From Our Blog</h2>
              <p className="mt-2 text-muted-foreground">Latest articles and resources</p>
            </div>
            <Link 
              to="/blog" 
              className="mt-4 md:mt-0 group flex items-center text-primary font-medium"
            >
              View all posts
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-subtle card-hover">
              <div className="h-48 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1574717024453-354056aafa98?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2700&q=80" 
                  alt="Blog Post" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-3">
                  Editing Tips
                </span>
                <h3 className="text-xl font-bold mb-3">Top 10 Tips for Effective Video Editing</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  Learn the essential tips and tricks that professional video editors use to create stunning videos.
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-muted-foreground">June 10, 2023</span>
                  <Link 
                    to="/blog/1" 
                    className="text-sm text-primary hover:underline"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-subtle card-hover">
              <div className="h-48 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1536240478700-b869070f9279?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2700&q=80" 
                  alt="Blog Post" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-3">
                  Techniques
                </span>
                <h3 className="text-xl font-bold mb-3">Creating Cinematic Transitions for Your Videos</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  Discover how to add cinematic transitions to take your videos to the next level.
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-muted-foreground">May 22, 2023</span>
                  <Link 
                    to="/blog/2" 
                    className="text-sm text-primary hover:underline"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            </div>
            
            <div className="bg-card rounded-xl overflow-hidden border border-border/50 shadow-subtle card-hover">
              <div className="h-48 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1593508512255-86ab42a8e620?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2700&q=80" 
                  alt="Blog Post" 
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="p-6">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-3">
                  Industry Trends
                </span>
                <h3 className="text-xl font-bold mb-3">The Future of Video Editing: AI and Automation</h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  Exploring how artificial intelligence is changing the landscape of video editing.
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm text-muted-foreground">April 15, 2023</span>
                  <Link 
                    to="/blog/3" 
                    className="text-sm text-primary hover:underline"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of creators and businesses who trust GigHubify for their video editing needs.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/explore" className="btn-primary">
                Find an Editor
              </Link>
              <Link to="/become-seller" className="btn-secondary">
                Become an Editor
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
