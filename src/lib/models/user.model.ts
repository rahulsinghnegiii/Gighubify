import { FirestoreTimestamp } from "../firebase/firestore";

export interface User {
  id: string;
  email: string;
  displayName: string;
  /**
   * Profile image URL or base64 encoded image string
   * Format: 'https://...' or 'data:image/...'
   */
  photoURL?: string;
  phoneNumber?: string;
  bio?: string;
  role: UserRole;
  isSeller: boolean;
  isVerified: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  lastLoginAt?: FirestoreTimestamp;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface SellerProfile {
  userId: string;
  title: string;
  description: string;
  skills: string[];
  experience: string;
  languages: { language: string, proficiency: string }[];
  education?: string;
  location?: string;
  hourlyRate?: number;
  availability?: string;
  portfolioLinks?: string[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
} 