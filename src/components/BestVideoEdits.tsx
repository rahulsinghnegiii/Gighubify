import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getServices } from '@/lib/services/service.service';
import { Service } from '@/lib/models/service.model';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, Pause, Youtube } from 'lucide-react';
import YouTubePlayer from './YouTubePlayer';

interface VideoEditDisplayProps {
  limit?: number;
}

// Sample data for YouTube videos
const sampleVideoEdits = [
  {
    id: '1',
    title: 'Cinematic Travel Montage',
    sellerId: 'user1',
    sellerName: 'VideoProEditor',
    description: 'Professional color grading and smooth transitions',
    rating: 4.9,
    videoId: '6kYRUsXtS4s',
    thumbnailUrl: 'https://img.youtube.com/vi/6kYRUsXtS4s/hqdefault.jpg',
    sellerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    id: '2',
    title: 'Corporate Presentation',
    sellerId: 'user2',
    sellerName: 'BusinessVisuals',
    description: 'Clean and professional corporate editing style',
    rating: 4.7,
    videoId: 'WUB2pSkwN2M',
    thumbnailUrl: 'https://img.youtube.com/vi/WUB2pSkwN2M/hqdefault.jpg',
    sellerAvatar: 'https://randomuser.me/api/portraits/women/44.jpg'
  },
  {
    id: '3',
    title: 'Wedding Highlights',
    sellerId: 'user3',
    sellerName: 'MomentCapture',
    description: 'Emotional storytelling with beautiful effects',
    rating: 5.0,
    videoId: 'g2isKlnolUA',
    thumbnailUrl: 'https://img.youtube.com/vi/g2isKlnolUA/hqdefault.jpg',
    sellerAvatar: 'https://randomuser.me/api/portraits/men/62.jpg'
  },
  {
    id: '4',
    title: 'Product Commercial',
    sellerId: 'user4',
    sellerName: 'AdMasters',
    description: 'Engaging product showcase with dynamic effects',
    rating: 4.8,
    videoId: 'uUdBBQAvYnU',
    thumbnailUrl: 'https://img.youtube.com/vi/uUdBBQAvYnU/hqdefault.jpg',
    sellerAvatar: 'https://randomuser.me/api/portraits/women/28.jpg'
  },
  {
    id: '5',
    title: 'Music Video Edit',
    sellerId: 'user5',
    sellerName: 'RhythmVisuals',
    description: 'Synchronization of visuals with the beat',
    rating: 4.9,
    videoId: 'N-rsrP3tQH0',
    thumbnailUrl: 'https://img.youtube.com/vi/N-rsrP3tQH0/hqdefault.jpg',
    sellerAvatar: 'https://randomuser.me/api/portraits/men/22.jpg'
  },
  {
    id: '6',
    title: 'Social Media Short',
    sellerId: 'user6',
    sellerName: 'ViralCutPro',
    description: 'Quick, attention-grabbing editing for social platforms',
    rating: 4.7,
    videoId: '3NWux1Ac9k4',
    thumbnailUrl: 'https://img.youtube.com/vi/3NWux1Ac9k4/hqdefault.jpg',
    sellerAvatar: 'https://randomuser.me/api/portraits/women/56.jpg'
  }
];

const BestVideoEdits: React.FC<VideoEditDisplayProps> = ({ limit = 4 }) => {
  const [videoEdits, setVideoEdits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Load video data
  useEffect(() => {
    const fetchBestVideoEdits = async () => {
      try {
        setIsLoading(true);
        // For this implementation, we'll use sample YouTube videos
        setVideoEdits(sampleVideoEdits.slice(0, limit));
        setIsLoading(false);
      } catch (err) {
        console.error('Error setting up video edits:', err);
        setVideoEdits(sampleVideoEdits.slice(0, limit));
        setIsLoading(false);
      }
    };

    fetchBestVideoEdits();
  }, [limit]);

  // Next & previous navigation
  const handlePrev = useCallback(() => {
    setActiveIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : videoEdits.length - 1));
    setIsPlaying(false);
  }, [videoEdits.length]);

  const handleNext = useCallback(() => {
    setActiveIndex((prevIndex) => (prevIndex < videoEdits.length - 1 ? prevIndex + 1 : 0));
    setIsPlaying(false);
  }, [videoEdits.length]);
  
  // Handle thumbnail click
  const handleThumbnailClick = useCallback((index: number) => {
    setActiveIndex(index);
    setIsPlaying(false);
  }, []);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events if this component is in the viewport
      const videoContainer = document.querySelector('.video-player-container');
      if (!videoContainer) return;
      
      const rect = videoContainer.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (!isInViewport) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          handlePrev();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePrev, handleNext]);

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-accent/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stunning Video Edits</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what our talented editors can create for your videos
          </p>
        </div>

        {error && (
          <div className="text-center py-8 text-destructive">
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
          </div>
        ) : videoEdits.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No video examples available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main video player */}
            <div className="lg:col-span-8 video-player-container relative rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300">
              {/* Direct iframe embed with full origin parameter */}
              <div className="youtube-player-wrapper">
                <YouTubePlayer videoId={videoEdits[activeIndex]?.videoId} autoplay={true} />
              </div>
              
              {/* Video info overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                <h3 className="font-bold text-lg">{videoEdits[activeIndex]?.title}</h3>
                <div className="flex items-center mt-1">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    <span>{videoEdits[activeIndex]?.rating.toFixed(1)}</span>
              </div>
                  <div className="flex items-center ml-4">
                  <img 
                    src={videoEdits[activeIndex]?.sellerAvatar} 
                    alt={videoEdits[activeIndex]?.sellerName} 
                      className="w-5 h-5 rounded-full mr-1" 
                    />
                    <span>{videoEdits[activeIndex]?.sellerName}</span>
                  </div>
                  </div>
                </div>
                
              {/* Navigation controls */}
                    <button
                      onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                      aria-label="Previous video"
                    >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                    </button>
              
                    <button
                      onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                      aria-label="Next video"
                    >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
                    </button>
                  </div>
                  
            {/* Thumbnails and info section */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 bg-card rounded-xl border border-border/50 shadow-subtle">
                <h3 className="font-semibold mb-4">Video Gallery</h3>
                <div className="grid grid-cols-2 gap-3">
                  {videoEdits.map((video, index) => (
                  <button
                      key={video.id}
                    onClick={() => handleThumbnailClick(index)}
                      className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                        index === activeIndex ? 'border-primary scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                  >
                    <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        {index === activeIndex && (
                          <div className="h-8 w-8 rounded-full bg-primary/80 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none">
                              <polygon points="5 3 19 12 5 21 5 3"></polygon>
                            </svg>
                          </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
              
              {/* Current video details */}
              <div className="p-6 bg-card rounded-xl border border-border/50 shadow-subtle">
                <div className="flex items-center mb-4">
                  <img 
                    src={videoEdits[activeIndex]?.sellerAvatar} 
                    alt={videoEdits[activeIndex]?.sellerName}
                    className="w-10 h-10 rounded-full mr-3" 
                  />
                  <div>
                    <h4 className="font-medium">{videoEdits[activeIndex]?.sellerName}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <svg className="w-3.5 h-3.5 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <span>{videoEdits[activeIndex]?.rating.toFixed(1)} Rating</span>
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{videoEdits[activeIndex]?.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {videoEdits[activeIndex]?.description}
                </p>
                <a 
                  href={`/service/${videoEdits[activeIndex]?.id}`}
                  className="w-full block text-center py-2 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                >
                  View Service
                </a>
          </div>
        </div>
      </div>
        )}
      </div>
    </section>
  );
};

export default BestVideoEdits; 