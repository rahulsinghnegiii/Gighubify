
import React, { useEffect, useRef } from 'react';
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-card shadow-subtle rounded-xl p-8 card-hover border border-border/50">
      <div className="flex flex-col items-center text-center">
        <div className="h-14 w-14 flex items-center justify-center rounded-full bg-accent mb-6">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-4">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

const Features = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const features = featuresRef.current?.children;
          if (features) {
            Array.from(features).forEach((feature, index) => {
              setTimeout(() => {
                feature.classList.add('animate-fade-in-up');
              }, index * 150);
            });
          }
        }
      },
      { threshold: 0.1 }
    );
    
    if (featuresRef.current) {
      observer.observe(featuresRef.current);
    }
    
    return () => {
      if (featuresRef.current) {
        observer.unobserve(featuresRef.current);
      }
    };
  }, []);
  
  return (
    <div className="py-16 md:py-24 bg-accent/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="section-title">Why Choose GigHubify</h2>
          <p className="section-subtitle max-w-xl mx-auto">
            We connect you with the best video editors for your project needs
          </p>
        </div>
        
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10"
          ref={featuresRef}
        >
          <Feature 
            icon={<ShieldCheck className="h-8 w-8 text-primary" />}
            title="Vetted Professionals"
            description="Work with hand-picked video editors who deliver exceptional quality every time."
          />
          <Feature 
            icon={<Clock className="h-8 w-8 text-primary" />}
            title="Quick Delivery"
            description="Get your edited videos back in as little as 24 hours with our express service."
          />
          <Feature 
            icon={<CheckCircle2 className="h-8 w-8 text-primary" />}
            title="Satisfaction Guaranteed"
            description="Not happy with the results? Get unlimited revisions or your money back."
          />
        </div>
      </div>
    </div>
  );
};

export default Features;
