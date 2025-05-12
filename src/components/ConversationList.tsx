import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/contexts/AuthContext';
import { 
  getUserConversations, 
  subscribeToUserConversations,
  Conversation 
} from '@/lib/services/messaging.service';
import { getUserProfile } from '@/lib/services/user.service';
import { MessageSquare, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';

interface ConversationListProps {
  activeUserId?: string;
  onConversationSelect?: (userId: string) => void;
}

const ConversationList = ({ activeUserId, onConversationSelect }: ConversationListProps) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<(Conversation & { otherUser: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Effect to fetch and subscribe to conversations
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      setError('You must be logged in to view conversations');
      return;
    }
    
    const fetchConversations = async () => {
      try {
        setLoading(true);
        
        // Subscribe to user conversations
        const unsubscribe = subscribeToUserConversations(
          currentUser.uid,
          async (newConversations) => {
            // For each conversation, get the other user's profile
            const conversationsWithUsers = await Promise.all(
              newConversations.map(async (convo) => {
                // Find the other user's ID
                const otherUserId = convo.participants.find(
                  id => id !== currentUser.uid
                );
                
                // Get the other user's profile
                let otherUser = null;
                if (otherUserId) {
                  try {
                    otherUser = await getUserProfile(otherUserId);
                  } catch (err) {
                    console.error(`Error fetching user ${otherUserId}:`, err);
                  }
                }
                
                return {
                  ...convo,
                  otherUser
                };
              })
            );
            
            setConversations(conversationsWithUsers);
            setLoading(false);
          }
        );
        
        return unsubscribe;
      } catch (err: any) {
        console.error('Error fetching conversations:', err);
        setError(err.message || 'Failed to load conversations');
        setLoading(false);
      }
    };
    
    const unsubscribe = fetchConversations();
    
    // Cleanup subscription
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser]);
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(convo => {
    const userName = convo.otherUser?.displayName || '';
    const email = convo.otherUser?.email || '';
    const lastMessage = convo.lastMessage?.content || '';
    
    const searchLower = searchQuery.toLowerCase();
    
    return userName.toLowerCase().includes(searchLower) ||
           email.toLowerCase().includes(searchLower) ||
           lastMessage.toLowerCase().includes(searchLower);
  });
  
  // Format the last message time
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      // Convert Firebase timestamp to JS Date if needed
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      console.error('Error formatting date:', err);
      return '';
    }
  };
  
  const handleConversationClick = (otherUserId: string) => {
    if (onConversationSelect) {
      onConversationSelect(otherUserId);
    } else {
      navigate(`/messages/${otherUserId}`);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-8">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border/50">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              {searchQuery 
                ? 'No conversations match your search' 
                : 'No conversations yet'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredConversations.map((convo) => {
              const otherUserId = convo.participants.find(id => id !== currentUser?.uid);
              if (!otherUserId || !convo.otherUser) return null;
              
              const isActive = activeUserId === otherUserId;
              
              return (
                <div 
                  key={convo.id}
                  className={`p-3 hover:bg-accent/50 cursor-pointer ${isActive ? 'bg-accent' : ''}`}
                  onClick={() => handleConversationClick(otherUserId)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-muted overflow-hidden">
                      {convo.otherUser?.photoURL ? (
                        <img 
                          src={convo.otherUser.photoURL} 
                          alt={convo.otherUser.displayName || 'User'} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary/10">
                          <span className="text-primary font-medium">
                            {convo.otherUser?.displayName?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium truncate">
                          {convo.otherUser?.displayName || 'Unknown User'}
                        </h4>
                        
                        {convo.lastMessage?.timestamp && (
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(convo.lastMessage.timestamp)}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {convo.lastMessage?.content || 'Start a conversation'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList; 