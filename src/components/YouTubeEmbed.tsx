import React from 'react';

interface YouTubeEmbedProps {
  videoId: string;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ videoId }) => {
  // Ensure the origin parameter exactly matches window.location.origin
  const origin = encodeURIComponent(window.location.origin);
  
  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${origin}`}
      frameBorder="0"
      allowFullScreen
      title="YouTube video player"
      width="100%"
      height="100%"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    ></iframe>
  );
};

export default YouTubeEmbed; 