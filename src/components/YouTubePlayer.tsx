import React from 'react';

interface YouTubePlayerProps {
  videoId: string;
  className?: string;
}

/**
 * A simple YouTube player component that properly handles the origin parameter
 * to avoid cross-origin issues with postMessage.
 */
const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ 
  videoId, 
  className = '' 
}) => {
  // The key is to use window.location.origin as the exact origin parameter
  const origin = encodeURIComponent(window.location.origin);
  
  return (
    <div className={`youtube-player-wrapper ${className}`}>
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${origin}`}
        width="100%"
        height="100%"
        frameBorder="0"
        allowFullScreen
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      ></iframe>
    </div>
  );
};

export default YouTubePlayer; 