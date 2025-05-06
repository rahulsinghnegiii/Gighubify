
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqItemProps {
  question: string;
  answer: string;
}

const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div 
      className="border border-border/50 rounded-lg overflow-hidden transition-all mb-4 shadow-subtle hover:shadow-md" 
    >
      <button
        className="flex justify-between items-center w-full p-4 text-left font-medium focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <span className="ml-6 flex-shrink-0 text-muted-foreground">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </span>
      </button>
      
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="p-4 pt-0 text-muted-foreground">
          {answer}
        </div>
      </div>
    </div>
  );
};

export default FaqItem;
