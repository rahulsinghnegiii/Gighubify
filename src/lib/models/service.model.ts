import { FirestoreTimestamp } from "../firebase/firestore";
import { MediaItem } from "../services/media.service";

export interface Service {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  /**
   * Array of base64 encoded image strings (Legacy support)
   * Format: ['data:image/jpeg;base64,...', 'data:image/webp;base64,...']
   * @deprecated Use media field instead
   */
  images: string[];
  /**
   * Base64 encoded thumbnail image (Legacy support)
   * Format: 'data:image/webp;base64,...'
   * @deprecated Use media field instead, and look for isThumbnail: true
   */
  thumbnail?: string;
  /**
   * Array of media items (images, videos, audio)
   * This is the preferred way to store media
   */
  media?: MediaItem[];
  packages: ServicePackage[];
  faqs?: FAQ[];
  requirements?: string;
  averageRating?: number;
  totalReviews?: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  isActive: boolean;
}

export interface ServicePackage {
  id: string;
  name: string; // Basic, Standard, Premium
  description: string;
  deliveryTime: number; // in days
  revisions: number;
  features: string[];
  price: number;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ServiceFilter {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  deliveryTime?: number;
  minRating?: number;
  tags?: string[];
  searchTerm?: string;
}

export const ServiceCategories = [
  {
    id: 'youtube',
    title: 'YouTube Videos',
    icon: '🎬',
    subcategories: [
      'Gaming',
      'Vlogs',
      'Music',
      'Educational',
      'Tutorial',
      'Review'
    ]
  },
  {
    id: 'social',
    title: 'Social Media',
    icon: '📱',
    subcategories: [
      'Instagram',
      'TikTok',
      'Facebook',
      'Twitter',
      'LinkedIn',
      'Snapchat'
    ]
  },
  {
    id: 'wedding',
    title: 'Wedding Films',
    icon: '💍',
    subcategories: [
      'Highlight Reel',
      'Full Ceremony',
      'Save the Date',
      'Engagement'
    ]
  },
  {
    id: 'corporate',
    title: 'Corporate Videos',
    icon: '🏢',
    subcategories: [
      'Explainer',
      'Training',
      'Promotional',
      'Event',
      'Testimonial'
    ]
  },
  {
    id: 'color',
    title: 'Color Grading',
    icon: '🎨',
    subcategories: [
      'Cinematic',
      'Commercial',
      'Music Video',
      'Film Emulation'
    ]
  },
  {
    id: 'animation',
    title: 'Animation',
    icon: '✨',
    subcategories: [
      '2D Animation',
      '3D Animation',
      'Motion Graphics',
      'Logo Animation',
      'Whiteboard'
    ]
  }
]; 