import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getUserProfile } from '@/lib/services/user.service';
import { 
  getOrCreateConversation, 
  getConversationMessages, 
  sendMessage,
  subscribeToConversationMessages,
  markMessagesAsRead,
  Message
} from '@/lib/services/messaging.service';
import { 
  MessageSquare, 
  ArrowLeft, 
  Send, 
  Image as ImageIcon,
  Paperclip,
  File,
  Menu,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { formatDistanceToNow } from 'date-fns';
import ConversationList from '@/components/ConversationList';

const Messages = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [otherUser, setOtherUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showSidebar, setShowSidebar] = useState<boolean>(window.innerWidth > 768);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setShowSidebar(window.innerWidth > 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Effect for scrolling to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    const fetchUserData = async () => {
      // If currentUser is not available, authentication issue
      if (!currentUser) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }
      
      // If no userId provided, just show the conversation list without loading a specific conversation
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        // Log debugging information
        console.log('Attempting to fetch user profile for:', userId);
        
        // Get other user's profile
        const userData = await getUserProfile(userId);
        if (!userData) {
          console.error('User not found:', userId);
          setError('User not found');
          setLoading(false);
          return;
        }
        
        console.log('Successfully found user:', userData.displayName);
        setOtherUser(userData);
        
        // Create or get existing conversation
        const convoId = await getOrCreateConversation(currentUser.uid, userId);
        setConversationId(convoId);
        console.log('Conversation ID:', convoId);
        
        // Subscribe to messages
        const unsubscribe = subscribeToConversationMessages(
          convoId,
          (newMessages) => {
            setMessages(newMessages);
            
            // Mark messages from other user as read
            const unreadMessages = newMessages.filter(
              msg => msg.senderId === userId && !msg.read
            );
            
            if (unreadMessages.length > 0) {
              markMessagesAsRead(convoId, userId, currentUser.uid)
                .catch(err => console.error('Error marking messages as read:', err));
            }
          }
        );
        
        setLoading(false);
        
        // Cleanup subscription
        return () => {
          unsubscribe();
        };
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message || 'Failed to load user data');
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, currentUser]);
  
  const handleSendMessage = async () => {
    if (!messageText.trim() && attachments.length === 0) return;
    
    if (!conversationId || !currentUser || !userId) {
      setError('Cannot send message: Missing conversation or user information');
      console.error('Missing required data:', { 
        conversationId, 
        currentUser: currentUser ? 'exists' : 'missing', 
        userId 
      });
      return;
    }
    
    try {
      setSendingMessage(true);
      console.log('Sending message:', {
        conversationId,
        from: currentUser.uid,
        to: userId,
        contentLength: messageText.trim().length,
        attachments: attachments.length
      });
      
      await sendMessage(
        conversationId,
        currentUser.uid,
        userId,
        messageText.trim(),
        attachments
      );
      
      console.log('Message sent successfully');
      
      // Clear input and attachments
      setMessageText('');
      setAttachments([]);
    } catch (err: any) {
      console.error('Error sending message:', err);
      
      // Show detailed error information
      const errorMessage = err.message || 'Failed to send message. Please try again.';
      console.error('Error details:', {
        code: err.code,
        name: err.name,
        stack: err.stack
      });
      
      // Handle specific error types
      if (err.code === 'permission-denied') {
        setError('Permission denied: You may not have access to this conversation.');
      } else if (err.code === 'not-found') {
        setError('The conversation could not be found.');
      } else {
        setError(`Failed to send message: ${errorMessage}`);
      }
    } finally {
      setSendingMessage(false);
    }
  };
  
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...fileList]);
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
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
  
  const handleConversationSelect = (selectedUserId: string) => {
    navigate(`/messages/${selectedUserId}`);
  };
  
  // If there's an error, show a user-friendly error message
  if (error && !userId) {
    return (
      <div className="container mx-auto py-12 px-4 pt-28 pb-16">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="bg-card p-8 rounded-xl border border-border/50 shadow-subtle text-center">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Could Not Load Conversations</h3>
          <p className="text-muted-foreground mb-6">
            There was an error loading your conversations.
          </p>
          <Button 
            variant="default"
            onClick={() => navigate(-1)}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }
  
  // Show all conversations view if no userId is provided
  if (!userId) {
    return (
      <div className="container mx-auto py-12 px-4 pt-28 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Messages</h2>
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="bg-card rounded-xl border border-border/50 shadow-subtle overflow-hidden h-[600px]">
          <ConversationList onConversationSelect={handleConversationSelect} />
        </div>
      </div>
    );
  }
  
  // Show loading spinner while fetching data
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin mb-4"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-12 px-4 pt-28 pb-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/messages')}
            className="flex items-center mr-2"
          >
            <Users className="h-4 w-4 mr-2" />
            All Conversations
          </Button>
          
          {/* Mobile menu toggle */}
          <Button 
            variant="ghost" 
            className="md:hidden"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      
      <div className="flex bg-card rounded-xl border border-border/50 shadow-subtle overflow-hidden h-[600px]">
        {/* Conversation sidebar */}
        {showSidebar && (
          <div className="w-full md:w-80 lg:w-96 border-r border-border/50 h-full">
            <ConversationList 
              activeUserId={userId} 
              onConversationSelect={handleConversationSelect} 
            />
          </div>
        )}
        
        {/* Message area */}
        <div className="flex-grow flex flex-col h-full">
          {error ? (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
              <Alert variant="destructive" className="mb-4 w-full max-w-md">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button 
                variant="default"
                onClick={() => navigate('/messages')}
                className="mt-4"
              >
                View All Conversations
              </Button>
            </div>
          ) : (
            <>
              {/* Header with user info */}
              <div className="p-4 border-b border-border/50 flex items-center">
                <div className="h-10 w-10 rounded-full bg-muted overflow-hidden mr-4">
                  {otherUser?.photoURL ? (
                    <img 
                      src={otherUser.photoURL} 
                      alt={otherUser.displayName || 'User'} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-primary/10">
                      <span className="text-primary font-medium">
                        {otherUser?.displayName?.charAt(0) || 'U'}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">{otherUser?.displayName || 'User'}</h3>
                  <p className="text-xs text-muted-foreground">{otherUser?.email || ''}</p>
                </div>
              </div>
              
              {/* Messages area */}
              <div className="p-4 flex-grow overflow-y-auto bg-muted/20">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Send a message to start your conversation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div 
                        key={message.id}
                        className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                      >
                        <div 
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.senderId === currentUser?.uid 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <div className="mb-1">{message.content}</div>
                          
                          {/* Display attachments if any */}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {message.attachments.map((url, idx) => {
                                const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);
                                
                                return isImage ? (
                                  <a 
                                    key={idx} 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img 
                                      src={url} 
                                      alt={`Attachment ${idx}`} 
                                      className="rounded border border-muted max-h-32 w-auto"
                                    />
                                  </a>
                                ) : (
                                  <a 
                                    key={idx} 
                                    href={url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center p-2 rounded bg-background/50"
                                  >
                                    <File className="h-4 w-4 mr-2" />
                                    <span className="text-xs truncate">Attachment</span>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                          
                          <div 
                            className={`text-xs mt-1 ${
                              message.senderId === currentUser?.uid 
                                ? 'text-primary-foreground/80' 
                                : 'text-muted-foreground'
                            }`}
                          >
                            {formatMessageTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
              
              {/* Attachment preview */}
              {attachments.length > 0 && (
                <div className="p-2 border-t border-border/50 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div 
                      key={index}
                      className="relative bg-muted rounded p-1 group"
                    >
                      <div className="flex items-center space-x-1">
                        {file.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4" />
                        ) : (
                          <File className="h-4 w-4" />
                        )}
                        <span className="text-xs truncate max-w-[100px]">
                          {file.name}
                        </span>
                      </div>
                      <button
                        className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full flex items-center justify-center text-white text-xs"
                        onClick={() => removeAttachment(index)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Message input */}
              <div className="p-4 border-t border-border/50 flex items-center">
                <Input 
                  placeholder="Type a message..." 
                  className="flex-grow mr-2"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                
                <label className="cursor-pointer mr-2">
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleAttachmentChange}
                  />
                  <Paperclip className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                </label>
                
                <Button 
                  size="icon"
                  disabled={sendingMessage || (!messageText.trim() && attachments.length === 0)}
                  onClick={handleSendMessage}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages; 