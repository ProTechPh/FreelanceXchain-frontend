import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Minimize2, 
  Send, 
  Smile, 
  Paperclip,
  Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import api from '../../lib/api';
import { useAuthStore } from '../../store';
import type { Message } from '../../types';

interface ChatPopupProps {
  contractId: string;
  otherPartyId: string;
  otherPartyName: string;
  otherPartyRole: 'Client' | 'Freelancer';
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  onUnreadCountChange?: (count: number) => void;
}

const POLLING_INTERVAL = 5000; // Poll for new messages every 5 seconds

export function ChatPopup({
  contractId,
  otherPartyId,
  otherPartyName,
  otherPartyRole,
  isOpen,
  onClose,
  onMinimize,
  isMinimized,
  onUnreadCountChange
}: ChatPopupProps) {
  const { user } = useAuthStore();
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const sortMessagesByTime = useCallback((items: Message[]) => {
    return [...items].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, []);

  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  }, [contractId, otherPartyId]);

  // Fetch messages from the API
  const fetchMessages = useCallback(async (showLoading = false) => {
    if (!contractId || !otherPartyId || !isOpen) return;
    
    if (showLoading) setLoading(true);
    setError(null);
    
    try {
      let activeConversationId = conversationId;

      if (!activeConversationId) {
        const conversation = await api.findConversationWithUser(otherPartyId);
        if (!conversation) {
          setConversationId(null);
          setMessages([]);
          onUnreadCountChange?.(0);
          return;
        }

        activeConversationId = conversation.id;
        setConversationId(activeConversationId);
      }

      const response = await api.getMessages(activeConversationId, { limit: 100 });
      setMessages(sortMessagesByTime(response.items));

      const unreadForCurrentUser = response.items.filter(
        (item) => item.receiver_id === user?.id && !item.is_read
      ).length;
      
      // Mark messages as read when fetched
      try {
        await api.markMessagesAsRead(activeConversationId);
        onUnreadCountChange?.(0);
      } catch {
        // Keep unread count accurate if mark-as-read request fails
        onUnreadCountChange?.(unreadForCurrentUser);
      }
    } catch (err: any) {
      console.error('Error fetching messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [contractId, conversationId, isOpen, onUnreadCountChange, otherPartyId, sortMessagesByTime, user?.id]);

  // Initial fetch and start polling when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      fetchMessages(true);
      
      // Start polling for new messages
      pollingRef.current = setInterval(() => {
        fetchMessages(false);
      }, POLLING_INTERVAL);
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, isMinimized, fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && !isMinimized && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  // Send message
  const handleSendMessage = async () => {
    if (!otherPartyId || !messageInput.trim() || sending) return;
    
    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);
    
    try {
      const newMessage = await api.sendMessage(otherPartyId, content);
      if (!conversationId && newMessage.conversation_id) {
        setConversationId(newMessage.conversation_id);
      }
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    } catch (err: any) {
      console.error('Error sending message:', err);
      // Restore the message input if sending failed
      setMessageInput(content);
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const isMyMessage = (msg: Message) => {
    return msg.sender_id === user?.id;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          scale: 1,
          height: isMinimized ? 'auto' : '600px'
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-4 right-4 w-[380px] bg-white dark:bg-dark-card rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-gray-200 dark:border-dark-border z-50"
        style={{ maxHeight: isMinimized ? '64px' : '600px' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-semibold">
                {otherPartyName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-semibold truncate">{otherPartyName}</h3>
              <p className="text-white/80 text-xs">{otherPartyRole}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={onMinimize}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Chat Content - Hidden when minimized */}
        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-dark-bg">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
                  <button
                    onClick={() => fetchMessages(true)}
                    className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                  >
                    Try again
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <p className="text-gray-500 dark:text-gray-400 mb-1">No messages yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">
                    Start the conversation with {otherPartyName}
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={clsx(
                      'flex',
                      isMyMessage(msg) ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={clsx(
                        'max-w-[70%] rounded-2xl px-4 py-2 shadow-sm',
                        isMyMessage(msg)
                          ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-dark-card text-gray-900 dark:text-white rounded-bl-sm border border-gray-200 dark:border-dark-border'
                      )}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
                      <p
                        className={clsx(
                          'text-xs mt-1',
                          isMyMessage(msg)
                            ? 'text-white/70'
                            : 'text-gray-500 dark:text-gray-400'
                        )}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-dark-card border-t-2 border-gray-200 dark:border-dark-border">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="w-full px-4 py-2 pr-20 bg-gray-100 dark:bg-dark-bg border-2 border-gray-200 dark:border-dark-border rounded-full resize-none focus:outline-none focus:border-primary-500 dark:focus:border-primary-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm max-h-32 disabled:opacity-50"
                    rows={1}
                    style={{
                      minHeight: '40px',
                      maxHeight: '120px',
                      overflowY: messageInput.split('\n').length > 3 ? 'auto' : 'hidden'
                    }}
                  />
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <button
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-border rounded-full transition-colors"
                      title="Add emoji"
                    >
                      <Smile className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                    <button
                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-dark-border rounded-full transition-colors"
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sending}
                  className={clsx(
                    'p-2.5 rounded-full transition-all shadow-lg',
                    messageInput.trim() && !sending
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white hover:shadow-xl'
                      : 'bg-gray-200 dark:bg-dark-border text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  )}
                  title="Send message"
                >
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
