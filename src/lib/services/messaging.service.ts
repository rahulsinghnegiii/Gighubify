import {
  addDocument,
  getDocument,
  getDocuments,
  subscribeToCollection,
  updateDocument,
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
      lastMessage: null,
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
  console.log(`Attempting to send message in conversation ${conversationId}`);
  console.log(`Sender: ${senderId}, Receiver: ${receiverId}`);
  
  // Upload attachments first if there are any
  const attachmentUrls: string[] = [];
  if (attachments.length > 0) {
    for (const file of attachments) {
      const filePath = `messages/${conversationId}/${senderId}/${Date.now()}_${file.name}`;
      console.log(`Uploading attachment: ${filePath}`);
      try {
        const url = await uploadFile(filePath, file);
        attachmentUrls.push(url);
        console.log(`Attachment uploaded successfully: ${url}`);
      } catch (err) {
        console.error(`Error uploading attachment: ${err}`);
        throw err;
      }
    }
  }

  // Check if conversation exists first
  try {
    const conversation = await getConversation(conversationId);
    if (!conversation) {
      console.error(`Conversation with ID ${conversationId} does not exist`);
      throw new Error(`Conversation with ID ${conversationId} does not exist`);
    }
    console.log(`Found conversation: ${JSON.stringify(conversation)}`);
  } catch (err) {
    console.error(`Error checking conversation: ${err}`);
    throw err;
  }

  // Create message
  console.log(`Creating message in ${COLLECTIONS.MESSAGES}/${conversationId}/messages`);
  let messageId;
  try {
    messageId = await addDocument<Omit<Message, 'id'>>(
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
    console.log(`Message created with ID: ${messageId}`);
  } catch (err) {
    console.error(`Error creating message: ${err}`);
    throw err;
  }

  // Update conversation's last message
  console.log(`Updating conversation's last message`);
  try {
    await updateDocument<Conversation>(
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
    console.log(`Conversation last message updated successfully`);
  } catch (err) {
    console.error(`Error updating conversation's last message: ${err}`);
    // Don't throw here to avoid blocking the message send if only the last message update fails
    console.warn(`Message was sent but conversation metadata could not be updated`);
  }

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
    updateDocument<Message>(
      `${COLLECTIONS.MESSAGES}/${conversationId}/messages`,
      message.id,
      {
        read: true
      }
    )
  );

  await Promise.all(updates);
}; 