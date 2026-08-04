'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { messagesApi } from '@/lib/api';
import { subscribeToNotificationStream } from '@/lib/sse';
import { useAuthStore } from '@/stores/authStore';
import type { ConversationWithDetails, Message } from '@/types';
import { toast } from 'sonner';
import {
  Send,
  Search,
  MoreVertical,
  Check,
  CheckCheck,
  Loader2,
  MessageSquare,
} from 'lucide-react';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.round(diffMs / 1000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(diffSec) < 60) return rtf.format(-diffSec, 'second');
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute');
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24) return rtf.format(-diffHour, 'hour');
  const diffDay = Math.round(diffHour / 24);
  return rtf.format(-diffDay, 'day');
}

export default function MessagesPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadConversations = useCallback(async (selectFirstIfNone = false) => {
    try {
      const { data } = await messagesApi.getConversations();
      setConversations(data.items);
      if (selectFirstIfNone && !selectedIdRef.current && data.items.length > 0) {
        setSelectedId(data.items[0].id);
      }
    } catch {
      toast.error('Failed to load conversations');
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data } = await messagesApi.getConversationMessages(conversationId);
      setMessages(data.items.slice().reverse());
      await messagesApi.markConversationRead(conversationId);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId || !currentUser) return c;
          return c.participant1_id === currentUser.id
            ? { ...c, unread_count_1: 0 }
            : { ...c, unread_count_2: 0 };
        })
      );
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations(true);
  }, [loadConversations]);

  useEffect(() => {
    if (selectedId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadMessages(selectedId);
    } else {
      setMessages([]);
    }
  }, [selectedId, loadMessages]);

  useEffect(() => {
    const unsubscribe = subscribeToNotificationStream((notification) => {
      if (notification.type !== 'message') return;
      loadConversations(false);
      if (selectedIdRef.current) {
        loadMessages(selectedIdRef.current);
      }
    });
    return unsubscribe;
  }, [loadConversations, loadMessages]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.otherUser.name.toLowerCase().includes(term) ||
      c.otherUser.email.toLowerCase().includes(term)
    );
  });

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !selectedConversation || sending) return;

    setSending(true);
    try {
      const { data: sent } = await messagesApi.send(selectedConversation.otherUser.id, content);
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
      loadConversations(false);
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loadingConversations) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-border bg-card">
      {/* Conversations List */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold mb-3">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {conversations.length === 0 ? 'No conversations yet' : 'No matches'}
              </p>
            </div>
          )}
          {filteredConversations.map((conv) => {
            const unread = currentUser && conv.participant1_id === currentUser.id
              ? conv.unread_count_1
              : conv.unread_count_2;
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                  selectedId === conv.id
                    ? 'bg-primary/10 border-r-2 border-primary'
                    : 'hover:bg-secondary/50'
                }`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="gradient-primary text-white text-sm">
                    {initials(conv.otherUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{conv.otherUser.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {conv.last_message_preview || 'No messages yet'}
                  </p>
                </div>
                {unread > 0 && (
                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs gradient-primary text-white">
                    {unread}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="gradient-primary text-white text-sm">
                    {initials(selectedConversation.otherUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedConversation.otherUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedConversation.otherUser.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No messages yet — say hello
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = currentUser?.id === msg.sender_id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[70%] p-3 rounded-2xl ${
                          isMine
                            ? 'gradient-primary text-white rounded-br-md'
                            : 'bg-secondary border border-border rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                          <span className={`text-xs ${isMine ? 'text-white/70' : 'text-muted-foreground'}`}>
                            {relativeTime(msg.created_at)}
                          </span>
                          {isMine && (
                            msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-white/70" />
                            ) : (
                              <Check className="w-3 h-3 text-white/70" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1"
                  disabled={sending}
                />
                <Button variant="gradient" size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
