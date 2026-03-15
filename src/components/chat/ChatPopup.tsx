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
import type { Conversation, Message } from '../../types';

interface ChatPopupProps {
  contractId: string;
  otherPartyId: string;
  otherPartyName: string;
  otherPartyRole: 'Client' | 'Freelancer' | 'User';
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
  isMinimized: boolean;
  onUnreadCountChange?: (count: number) => void;
}

const SSE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '') + '/api/notifications/stream';
const FALLBACK_POLLING_INTERVAL = 10000; // Fallback polling when SSE is unavailable

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationFilter, setConversationFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const sseAbortRef = useRef<AbortController | null>(null);

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
    setConversations([]);
    setError(null);
  }, [contractId, otherPartyId]);

  const getConversationUnreadCount = useCallback((conversation: Conversation) => {
    if (!user?.id) return 0;
    return conversation.participant1_id === user.id
      ? conversation.unread_count_1
      : conversation.unread_count_2;
  }, [user?.id]);

  const formatRelativeTime = useCallback((dateValue?: string) => {
    if (!dateValue) return '';
    const date = new Date(dateValue);
    const now = new Date();
    const diffMinutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));

    if (diffMinutes < 1) return 'now';
    if (diffMinutes < 60) return `${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  }, []);

  const resolveOtherPartyId = useCallback((conversation: Conversation): string | null => {
    if (!user?.id) return null;
    return conversation.participant1_id === user.id
      ? conversation.participant2_id
      : conversation.participant1_id;
  }, [user?.id]);

  const activeConversation = conversationId
    ? conversations.find((conversation) => conversation.id === conversationId) ?? null
    : null;

  const activeOtherPartyId = activeConversation
    ? (resolveOtherPartyId(activeConversation) || otherPartyId)
    : otherPartyId;
  const activeOtherPartyName = activeConversation?.otherUser?.name || otherPartyName;
  const activeOtherPartyRole = activeConversation && activeOtherPartyId !== otherPartyId
    ? 'User'
    : otherPartyRole;
  const filteredConversations = conversations.filter(
    (conversation) => conversationFilter === 'all' || getConversationUnreadCount(conversation) > 0
  );

  const fetchConversations = useCallback(async () => {
    if (!isOpen) return;

    try {
      const response = await api.getConversations({ limit: 100, page: 1 });
      setConversations(response.items);

      if (!conversationId) {
        const initialConversation = response.items.find(
          (item) =>
            item.otherUser?.id === otherPartyId ||
            item.participant1_id === otherPartyId ||
            item.participant2_id === otherPartyId
        );

        if (initialConversation) {
          setConversationId(initialConversation.id);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, [conversationId, isOpen, otherPartyId]);

  // Fetch messages from the API
  const fetchMessages = useCallback(async (showLoading = false) => {
    if (!contractId || !isOpen) return;
    
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
    } catch (err: unknown) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [contractId, conversationId, isOpen, onUnreadCountChange, otherPartyId, sortMessagesByTime, user?.id]);

  // Initial fetch + SSE subscription when chat opens
  useEffect(() => {
    if (!isOpen || isMinimized) return;

    fetchConversations();
    fetchMessages(true);

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const ctrl = new AbortController();
    sseAbortRef.current = ctrl;

    const connectSSE = async () => {
      try {
        const res = await fetch(SSE_URL, {
          headers: { Authorization: `Bearer ${token}` },
          signal: ctrl.signal,
        });
        if (!res.body) throw new Error('No body');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const event = JSON.parse(line.slice(6));
              if (event?.type === 'message' && event?.data?.message) {
                const msg = event.data.message;
                setMessages(prev => {
                  if (prev.some(m => m.id === msg.id)) return prev;
                  return sortMessagesByTime([...prev, msg]);
                });
                if (msg.conversation_id) {
                  setConversationId(prev => prev ?? msg.conversation_id);
                }
                fetchConversations();
              }
            } catch { /* ignore malformed lines */ }
          }
        }
      } catch (err: unknown) {
        if (ctrl.signal.aborted) return;
        // SSE failed — fall back to polling
        if (!pollingRef.current) {
          pollingRef.current = setInterval(() => {
            fetchConversations();
            fetchMessages(false);
          }, FALLBACK_POLLING_INTERVAL);
        }
      }
    };

    connectSSE();

    return () => {
      ctrl.abort();
      sseAbortRef.current = null;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isOpen, isMinimized, fetchConversations, fetchMessages, sortMessagesByTime]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && !isMinimized && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  // Send message
  const handleSendMessage = async () => {
    if (!activeOtherPartyId || !messageInput.trim() || sending) return;
    
    const content = messageInput.trim();
    setMessageInput('');
    setSending(true);
    
    try {
      const newMessage = await api.sendMessage(activeOtherPartyId, content);
      if (!conversationId && newMessage.conversation_id) {
        setConversationId(newMessage.conversation_id);
      }
      setMessages(prev => [...prev, newMessage]);
      scrollToBottom();
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      // Restore the message input if sending failed
      setMessageInput(content);
      setError(err instanceof Error ? err.message : 'Failed to send message');
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
          height: isMinimized ? 'auto' : '650px'
        }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={clsx(
          "fixed bottom-4 right-4 bg-white dark:bg-gray-900 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800 z-50",
          isMinimized ? "w-[380px]" : "w-[780px]"
        )}
        style={{ maxHeight: isMinimized ? '90px' : '650px' }}
      >
        {/* Minimized View - Show only selected conversation */}
        {isMinimized ? (
          <div 
            className="p-4 bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900 cursor-pointer hover:bg-primary-100 dark:hover:bg-gray-800 transition-colors"
            onClick={onMinimize}
          >
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-lg">
                  {activeOtherPartyName.charAt(0).toUpperCase()}
                </div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900 shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-gray-900 dark:text-white font-bold text-base truncate">
                  {activeOtherPartyName}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {activeOtherPartyRole}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Header - Full view */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 p-5 flex items-center justify-between relative overflow-hidden">
              {/* Decorative background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
              </div>
              
              <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-lg border-2 border-white/30 shadow-lg">
                    {activeOtherPartyName.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg truncate drop-shadow-sm">{activeOtherPartyName}</h3>
                  <p className="text-white/90 text-xs font-medium">{activeOtherPartyRole}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 relative z-10">
                <button
                  onClick={onMinimize}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm"
                  title="Minimize"
                >
                  <Minimize2 className="w-4 h-4 text-white drop-shadow" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 backdrop-blur-sm"
                  title="Close"
                >
                  <X className="w-4 h-4 text-white drop-shadow" />
                </button>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex flex-1 overflow-hidden">
            {/* Left Sidebar - Conversations */}
            <div className="w-80 flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setConversationFilter('all')}
                    className={clsx(
                      'flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                      conversationFilter === 'all'
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-primary-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setConversationFilter('unread')}
                    className={clsx(
                      'flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200',
                      conversationFilter === 'unread'
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-200 dark:shadow-primary-900/50'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    )}
                  >
                    Unread
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 custom-scrollbar">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                      {conversationFilter === 'unread' ? 'No unread conversations' : 'No conversations yet'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conversation) => {
                    const selected = conversation.id === conversationId;
                    const unreadCount = getConversationUnreadCount(conversation);
                    const peerName = conversation.otherUser?.name || 'Unknown user';
                    const preview = conversation.last_message_preview || 'No messages yet';
                    const timestamp = formatRelativeTime(conversation.last_message_at);

                    return (
                      <motion.button
                        key={conversation.id}
                        type="button"
                        onClick={() => {
                          setConversationId(conversation.id);
                          setMessages([]);
                          setError(null);
                        }}
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        className={clsx(
                          'w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-all duration-200',
                          selected
                            ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-700 shadow-sm'
                            : 'bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-200 dark:hover:border-gray-600'
                        )}
                      >
                        <div className="relative flex-shrink-0">
                          <div className={clsx(
                            "w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-md",
                            selected 
                              ? "bg-gradient-to-br from-primary-500 to-indigo-600 text-white"
                              : "bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 text-gray-700 dark:text-gray-100"
                          )}>
                            {peerName.charAt(0).toUpperCase()}
                          </div>
                          {unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-white dark:border-gray-800 shadow-sm">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className={clsx(
                              "text-sm font-bold truncate",
                              selected 
                                ? "text-primary-900 dark:text-primary-100" 
                                : "text-gray-900 dark:text-gray-100"
                            )}>{peerName}</p>
                            {timestamp && (
                              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
                                {timestamp}
                              </span>
                            )}
                          </div>
                          <p className={clsx(
                            "text-xs truncate",
                            selected 
                              ? "text-primary-700 dark:text-primary-300 font-medium" 
                              : "text-gray-600 dark:text-gray-400"
                          )}>{preview}</p>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Side - Messages and Input */}
            <div className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative">
                    <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
                    <div className="absolute inset-0 w-10 h-10 border-4 border-primary-200 rounded-full animate-ping"></div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 font-medium">Loading messages...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
                    <X className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="text-red-600 dark:text-red-400 mb-3 font-semibold">{error}</p>
                  <button
                    onClick={() => fetchMessages(true)}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md"
                  >
                    Try again
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">No messages yet</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Start the conversation with {activeOtherPartyName}
                  </p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isOwn = isMyMessage(msg);
                  const showAvatar = index === 0 || messages[index - 1]?.sender_id !== msg.sender_id;
                  
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3 }}
                      className={clsx(
                        'flex gap-2',
                        isOwn ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {!isOwn && (
                        <div className="flex-shrink-0">
                          {showAvatar ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-200 font-semibold text-xs shadow-sm">
                              {activeOtherPartyName.charAt(0).toUpperCase()}
                            </div>
                          ) : (
                            <div className="w-8 h-8"></div>
                          )}
                        </div>
                      )}
                      <div
                        className={clsx(
                          'max-w-[75%] rounded-2xl px-4 py-3 shadow-md',
                          isOwn
                            ? 'bg-gradient-to-br from-primary-600 to-indigo-600 text-white rounded-br-md'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md border border-gray-200 dark:border-gray-700'
                        )}
                      >
                        <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                        <p
                          className={clsx(
                            'text-[10px] mt-1.5 font-medium',
                            isOwn
                              ? 'text-white/80'
                              : 'text-gray-500 dark:text-gray-400'
                          )}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                      {isOwn && (
                        <div className="flex-shrink-0">
                          {showAvatar ? (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
                              {user?.email?.charAt(0).toUpperCase() || 'Y'}
                            </div>
                          ) : (
                            <div className="w-8 h-8"></div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-4px_12px_-4px_rgba(0,0,0,0.1)]">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={sending}
                    className="w-full px-4 py-3 pr-24 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl resize-none focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 dark:focus:ring-primary-900/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm max-h-32 disabled:opacity-50 transition-all duration-200"
                    rows={1}
                    style={{
                      minHeight: '48px',
                      maxHeight: '120px',
                      overflowY: messageInput.split('\n').length > 3 ? 'auto' : 'hidden'
                    }}
                  />
                  <div className="absolute right-3 bottom-3 flex items-center gap-1">
                    <button
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all duration-200 group"
                      title="Add emoji"
                    >
                      <Smile className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                    </button>
                    <button
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-all duration-200 group"
                      title="Attach file"
                    >
                      <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || sending}
                  className={clsx(
                    'p-3 rounded-xl transition-all duration-200 shadow-lg flex-shrink-0',
                    messageInput.trim() && !sending
                      ? 'bg-gradient-to-br from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white hover:shadow-xl hover:scale-105 active:scale-95'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
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
          </div>
          </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
