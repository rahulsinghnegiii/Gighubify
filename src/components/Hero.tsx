
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (heroRef.current) {
      observer.observe(heroRef.current);
    }
    
    const textElements = textRef.current?.children;
    if (textElements) {
      Array.from(textElements).forEach((element, index) => {
        element.classList.add('opacity-0');
        setTimeout(() => {
          element.classList.remove('opacity-0');
          element.classList.add('animate-fade-in-up');
        }, index * 200);
      });
    }
    
    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);
  
  return (
    <div className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden" ref={heroRef}>
      {/* Gradient circles */}
      <div className="absolute top-20 left-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 animate-pulse-subtle"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-accent/30 rounded-full blur-3xl animate-pulse-subtle"></div>
      <div className="absolute top-40 right-10 w-24 h-24 bg-primary/5 rounded-full blur-xl animate-float"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center" ref={textRef}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Find the Perfect Video Editor for Your Project
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Connect with professional video editors. Get high-quality edits, fast turnaround, and competitive prices.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/explore" className="btn-primary group">
              Find an Editor
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/become-seller" className="btn-secondary">
              Become an Editor
            </Link>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce opacity-70">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </div>
  );
};

export default Hero;
