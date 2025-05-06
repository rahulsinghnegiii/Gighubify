import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, DollarSign, Globe, Calendar, Shield, Users, BarChart } from 'lucide-react';
import FaqItem from '@/components/FaqItem';

// FAQ items
const faqItems = [
  {
    question: 'How much can I earn?',
    answer: 'Editors typically earn between $25-$150+ per hour depending on experience and project complexity. Many of our top sellers earn over $5,000 per month working with us.'
  },
  {
    question: 'How do I get paid?',
    answer: 'We offer secure payments through various methods including PayPal, bank transfers, and Escrow services. Payment is released after client approval with a standard 14-day clearing period.'
  },
  {
    question: 'What types of editing services can I offer?',
    answer: 'You can offer any video-related services including basic editing, motion graphics, color grading, visual effects, sound design, and more specialized services based on your skills.'
  },
  {
    question: 'How long does approval take?',
    answer: 'Approval typically takes 3-5 business days after submitting your application and portfolio. We carefully review each application to maintain our quality standards.'
  },
  {
    question: 'What are the fees?',
    answer: 'GigHubify charges a 20% commission on each completed project. This covers platform maintenance, marketing, client acquisition, and payment processing fees.'
  }
];

// Requirements list items
const requirementItems = [
  { icon: <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />, text: 'Professional video editing portfolio with at least 3 samples' },
  { icon: <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />, text: 'High-quality equipment and industry-standard software' },
  { icon: <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />, text: 'Strong communication skills and client management abilities' },
  { icon: <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />, text: 'Reliable internet connection for file uploads and downloads' },
  { icon: <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />, text: 'Commitment to deadlines and professional work ethic' },
  { icon: <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />, text: 'English proficiency for client communication' }
];

const BecomeSeller = () => {
  const benefitsRef = useRef<HTMLDivElement>(null);
  
  // Scroll to top when the component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const benefits = benefitsRef.current?.children;
          if (benefits) {
            Array.from(benefits).forEach((benefit, index) => {
              setTimeout(() => {
                benefit.classList.add('animate-fade-in-up');
              }, index * 150);
            });
          }
        }
      },
      { threshold: 0.1 }
    );
    
    if (benefitsRef.current) {
      observer.observe(benefitsRef.current);
    }
    
    return () => {
      if (benefitsRef.current) {
        observer.unobserve(benefitsRef.current);
      }
    };
  }, []);
  
  return (
    <div className="min-h-screen pt-28 pb-16">
      {/* Hero section */}
      <section className="relative">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Join Our Community of Professional Video Editors</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Turn your video editing skills into a thriving business with GigHubify. Access clients worldwide and grow your freelance career.
            </p>
            <Link to="/signup?role=seller" className="btn-primary">
              Apply to Become a Seller
            </Link>
          </div>
        </div>
      </section>
      
      {/* Benefits section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose GigHubify</h2>
          
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10"
            ref={benefitsRef}
          >
            <div className="bg-card rounded-xl p-8 shadow-subtle border border-border/50 opacity-0">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-accent mb-6">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Competitive Earnings</h3>
              <p className="text-muted-foreground">Set your own rates and keep up to 80% of each project. Many of our editors earn $2,000 - $10,000 monthly.</p>
            </div>
            
            <div className="bg-card rounded-xl p-8 shadow-subtle border border-border/50 opacity-0">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-accent mb-6">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Global Reach</h3>
              <p className="text-muted-foreground">Connect with clients from around the world. Expand your client base beyond your local market and grow your business.</p>
            </div>
            
            <div className="bg-card rounded-xl p-8 shadow-subtle border border-border/50 opacity-0">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-accent mb-6">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Flexible Schedule</h3>
              <p className="text-muted-foreground">Work when and where you want. Set your own hours and manage your workload according to your lifestyle.</p>
            </div>
            
            <div className="bg-card rounded-xl p-8 shadow-subtle border border-border/50 opacity-0">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-accent mb-6">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Secure Payments</h3>
              <p className="text-muted-foreground">Get paid safely and on time, every time. Our secure payment system protects both editors and clients.</p>
            </div>
            
            <div className="bg-card rounded-xl p-8 shadow-subtle border border-border/50 opacity-0">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-accent mb-6">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Supportive Community</h3>
              <p className="text-muted-foreground">Join a network of professional video editors. Share tips, get feedback, and collaborate on larger projects.</p>
            </div>
            
            <div className="bg-card rounded-xl p-8 shadow-subtle border border-border/50 opacity-0">
              <div className="h-12 w-12 flex items-center justify-center rounded-full bg-accent mb-6">
                <BarChart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Career Growth</h3>
              <p className="text-muted-foreground">Build a reputation, collect reviews, and advance your career. Many editors use GigHubify as a stepping stone to bigger opportunities.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How it works */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border"></div>
              
              {/* Timeline items */}
              <div className="space-y-12">
                <div className="relative pl-14">
                  <div className="absolute left-0 top-0 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">1</div>
                  <h3 className="text-xl font-semibold mb-2">Submit Your Application</h3>
                  <p className="text-muted-foreground">Create an account and submit your application with your portfolio. Our team will review your work and qualifications.</p>
                </div>
                
                <div className="relative pl-14">
                  <div className="absolute left-0 top-0 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">2</div>
                  <h3 className="text-xl font-semibold mb-2">Create Your Profile</h3>
                  <p className="text-muted-foreground">Once approved, set up your professional profile showcasing your skills, experience, portfolio, and services.</p>
                </div>
                
                <div className="relative pl-14">
                  <div className="absolute left-0 top-0 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">3</div>
                  <h3 className="text-xl font-semibold mb-2">Receive and Fulfill Orders</h3>
                  <p className="text-muted-foreground">Start receiving orders from clients. Deliver high-quality work on time and build your reputation through positive reviews.</p>
                </div>
                
                <div className="relative pl-14">
                  <div className="absolute left-0 top-0 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-bold">4</div>
                  <h3 className="text-xl font-semibold mb-2">Get Paid and Grow</h3>
                  <p className="text-muted-foreground">Receive secure payments for completed projects. As you gain more positive reviews, increase your rates and grow your business.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Requirements section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Requirements to Join</h2>
            
            <div className="bg-card rounded-xl p-8 md:p-10 shadow-subtle border border-border/50">
              <div className="space-y-6">
                {requirementItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    {item.icon}
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-10 pt-6 border-t border-border">
                <h4 className="font-semibold mb-4">Ready to join our community?</h4>
                <Link to="/signup?role=seller" className="btn-primary">
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ section */}
      <section className="py-16 md:py-24 bg-accent/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Frequently Asked Questions</h2>
          
          <div className="max-w-3xl mx-auto">
            <div className="space-y-4">
              {faqItems.map((item, index) => (
                <FaqItem key={index} question={item.question} answer={item.answer} />
              ))}
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Start Your Video Editing Career Today</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of video professionals already earning on GigHubify.
            </p>
            <Link to="/signup?role=seller" className="btn-primary">
              Apply to Become a Seller
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BecomeSeller;
