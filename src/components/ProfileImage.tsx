import React, { useState } from 'react';
import { UserIcon } from 'lucide-react';
import { isValidImage } from '../lib/utils/imageUtils';

interface ProfileImageProps {
  photoURL?: string | null;
  displayName?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ 
  photoURL, 
  displayName, 
  size = 'md',
  className = ''
}) => {
  const [hasError, setHasError] = useState(false);
  
  // Size classes
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };
  
  // Icon size
  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };
  
  // Handle image error
  const handleImageError = () => {
    console.error('Error loading profile image');
    setHasError(true);
  };
  
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ${className}`}>
      {isValidImage(photoURL) && !hasError ? (
        <img 
          src={photoURL || ''} 
          alt={displayName || 'User'} 
          className="h-full w-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <UserIcon className={`${iconSizes[size]} text-primary`} />
      )}
    </div>
  );
};

export default ProfileImage; 