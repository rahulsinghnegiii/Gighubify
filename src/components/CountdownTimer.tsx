import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  targetTime: Date;
  onComplete?: () => void;
  className?: string;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetTime,
  onComplete,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    // Reset completion status when targetTime changes
    setIsComplete(false);
    
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = targetTime.getTime() - now.getTime();
      
      if (difference <= 0) {
        setIsComplete(true);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        onComplete?.();
        return;
      }
      
      // Calculate hours, minutes, seconds
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft({ hours, minutes, seconds });
    };
    
    // Initial calculation
    calculateTimeLeft();
    
    // Set up interval to update the countdown
    const timer = setInterval(calculateTimeLeft, 1000);
    
    // Clean up interval on unmount
    return () => clearInterval(timer);
  }, [targetTime, onComplete]);
  
  // Format the time values to always have two digits
  const formatTimeValue = (value: number): string => {
    return value.toString().padStart(2, '0');
  };
  
  return (
    <div className={`flex items-center ${className}`}>
      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
      {isComplete ? (
        <span className="text-sm font-medium">Refreshing soon...</span>
      ) : (
        <span className="text-sm font-medium">
          Next Fresh Picks in {formatTimeValue(timeLeft.hours)}:{formatTimeValue(timeLeft.minutes)}:{formatTimeValue(timeLeft.seconds)}
        </span>
      )}
    </div>
  );
};

export default CountdownTimer; 