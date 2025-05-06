import {
  addDocument,
  getDocument,
  getDocuments,
  subscribeToCollection,
  COLLECTIONS
} from '../firebase/firestore';
import { uploadFile } from '../firebase/storage';

// Message interface
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachments?: string[];
  read: boolean;
  createdAt: any;
  updatedAt: any;
}

// Conversation interface
export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: any;
  };
  createdAt: any;
  updatedAt: any;
}

/**
 * Get or create a conversation between two users
 */
export const getOrCreateConversation = async (
  userId1: string,
  userId2: string
): Promise<string> => {
  // Sort user IDs to ensure consistent conversation ID creation
  const participants = [userId1, userId2].sort();
  
  // Check if a conversation already exists
  const conversations = await getDocuments<Conversation>(COLLECTIONS.MESSAGES, {
    whereConditions: [
      ['participants', 'array-contains', participants[0]],
    ]
  });

  const existingConversation = conversations.find(
    convo => convo.participants.includes(participants[1])
  );

  if (existingConversation) {
    return existingConversation.id;
  }

  // Create new conversation
  return await addDocument<Omit<Conversation, 'id'>>(
    COLLECTIONS.MESSAGES,
    {
      participants,
      lastMessage: undefined,
    }
  );
};

/**
 * Get a conversation by ID
 */
export const getConversation = async (
  conversationId: string
): Promise<Conversation | null> => {
  return await getDocument<Conversation>(COLLECTIONS.MESSAGES, conversationId);
};

/**
 * Get all conversations for a user
 */
export const getUserConversations = async (
  userId: string
): Promise<Conversation[]> => {
  return await getDocuments<Conversation>(COLLECTIONS.MESSAGES, {
    whereConditions: [
      ['participants', 'array-contains', userId]
    ],
    orderByField: 'updatedAt',
    orderDirection: 'desc'
  });
};

/**
 * Subscribe to a user's conversations
 */
export const subscribeToUserConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void => {
  return subscribeToCollection<Conversation>(
    COLLECTIONS.MESSAGES,
    callback,
    {
      whereConditions: [
        ['participants', 'array-contains', userId]
      ],
      orderByField: 'updatedAt',
      orderDirection: 'desc'
    }
  );
};

/**
 * Get messages for a conversation
 */
export const getConversationMessages = async (
  conversationId: string
): Promise<Message[]> => {
  return await getDocuments<Message>(
    `${COLLECTIONS.MESSAGES}/${conversationId}/messages`,
    {
      orderByField: 'createdAt',
      orderDirection: 'asc'
    }
  );
};

/**
 * Subscribe to messages in a conversation
 */
export const subscribeToConversationMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void => {
  return subscribeToCollection<Message>(
    `${COLLECTIONS.MESSAGES}/${conversationId}/messages`,
    callback,
    {
      orderByField: 'createdAt',
      orderDirection: 'asc'
    }
  );
};

/**
 * Send a message in a conversation
 */
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  attachments: File[] = []
): Promise<string> => {
  // Upload attachments first if there are any
  const attachmentUrls: string[] = [];
  if (attachments.length > 0) {
    for (const file of attachments) {
      const filePath = `messages/${conversationId}/${senderId}/${Date.now()}_${file.name}`;
      const url = await uploadFile(filePath, file);
      attachmentUrls.push(url);
    }
  }

  // Create message
  const messageId = await addDocument<Omit<Message, 'id'>>(
    `${COLLECTIONS.MESSAGES}/${conversationId}/messages`,
    {
      conversationId,
      senderId,
      receiverId,
      content,
      attachments: attachmentUrls,
      read: false
    }
  );

  // Update conversation's last message
  await addDocument<any>(
    COLLECTIONS.MESSAGES,
    conversationId,
    {
      lastMessage: {
        content,
        senderId,
        timestamp: new Date()
      }
    }
  );

  return messageId;
};

/**
 * Mark all messages from a specific sender as read
 */
export const markMessagesAsRead = async (
  conversationId: string,
  senderId: string,
  receiverId: string
): Promise<void> => {
  const messages = await getDocuments<Message>(
    `${COLLECTIONS.MESSAGES}/${conversationId}/messages`,
    {
      whereConditions: [
        ['senderId', '==', senderId],
        ['receiverId', '==', receiverId],
        ['read', '==', false]
      ]
    }
  );

  // Update each unread message
  const updates = messages.map(message =>
    addDocument(`${COLLECTIONS.MESSAGES}/${conversationId}/messages`, message.id, {
      read: true
    })
  );

  await Promise.all(updates);
}; 