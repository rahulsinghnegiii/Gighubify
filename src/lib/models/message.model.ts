import { FirestoreTimestamp } from "../firebase/firestore";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments?: string[];
  readAt?: FirestoreTimestamp;
  createdAt: FirestoreTimestamp;
  isDeleted: boolean;
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: FirestoreTimestamp;
  };
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
  orderId?: string; // If conversation is related to an order
  serviceId?: string; // If conversation is related to a service
  unreadCount: {
    [userId: string]: number;
  };
} 