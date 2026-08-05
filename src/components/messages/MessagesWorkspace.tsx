'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { contractsApi, freelancersApi, messagesApi } from '@/lib/api';
import {
  getRealtimeMessage,
  getConversationlessContacts,
  getInitialConversationId,
  mergeConversationMessages,
} from '@/lib/dashboard-message-route';
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

export function MessagesWorkspace() {
  const searchParams = useSearchParams();
  const requestedRecipientId = searchParams?.get('recipientId')?.trim() || null;
  const currentUser = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [directRecipient, setDirectRecipient] = useState<ConversationWithDetails['otherUser'] | null>(null);
  const [acceptedContacts, setAcceptedContacts] = useState<ConversationWithDetails['otherUser'][]>([]);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  const loadAcceptedContacts = useCallback(async () => {
    if (currentUser?.role !== 'employer') {
      setAcceptedContacts([]);
      return;
    }

    try {
      const { data } = await contractsApi.list({ limit: 1000 });
      const freelancerIds = [...new Set(
        data.items
          .filter((contract) => contract.employerId === currentUser.id && contract.status !== 'cancelled')
          .map((contract) => contract.freelancerId),
      )];
      const contacts = await Promise.all(
        freelancerIds.map(async (freelancerId) => {
          try {
            const { data: profile } = await freelancersApi.getPublicProfile(freelancerId);
            return {
              id: freelancerId,
              name: profile.name || 'Freelancer',
              email: '',
            };
          } catch {
            return { id: freelancerId, name: 'Freelancer', email: '' };
          }
        }),
      );
      setAcceptedContacts(contacts);
    } catch {
      toast.error('Failed to load accepted freelancers');
    }
  }, [currentUser]);

  const loadConversations = useCallback(async (selectFirstIfNone = false) => {
    try {
      const { data } = await messagesApi.getConversations();
      setConversations(data.items);
      if (selectFirstIfNone) {
        const initialConversationId = getInitialConversationId(data.items, requestedRecipientId);
        setSelectedId(initialConversationId);

        if (requestedRecipientId && !initialConversationId) {
          setDirectRecipient({ id: requestedRecipientId, name: 'Freelancer', email: '' });
          try {
            const { data: profile } = await freelancersApi.getPublicProfile(requestedRecipientId);
            setDirectRecipient({
              id: requestedRecipientId,
              name: profile.name || 'Freelancer',
              email: '',
            });
          } catch {
            // Sending still works with the user ID if the optional profile lookup fails.
          }
        } else {
          setDirectRecipient(null);
        }
      }
    } catch {
      toast.error('Failed to load conversations');
    }
  }, [requestedRecipientId]);

  const loadMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const { data } = await messagesApi.getConversationMessages(conversationId);
      const fetchedMessages = data.items.slice().reverse();
      setMessages((currentMessages) => mergeConversationMessages(
        fetchedMessages,
        currentMessages.filter((message) => message.conversation_id === conversationId),
      ));
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
    const loadInbox = async () => {
      await Promise.all([loadConversations(true), loadAcceptedContacts()]);
      setLoadingConversations(false);
    };
    loadInbox();
  }, [loadAcceptedContacts, loadConversations]);

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
      const incomingMessage = getRealtimeMessage<Message>(notification.data);
      const activeConversationId = selectedIdRef.current;

      if (incomingMessage?.conversation_id === activeConversationId) {
        setMessages((currentMessages) => mergeConversationMessages(
          currentMessages.filter(
            (message) => message.conversation_id === incomingMessage.conversation_id,
          ),
          [incomingMessage],
        ));
      }

      loadConversations(false);
      if (activeConversationId && incomingMessage?.conversation_id === activeConversationId) {
        loadMessages(activeConversationId);
      } else if (activeConversationId && !incomingMessage) {
        loadMessages(activeConversationId);
      }
    });
    return unsubscribe;
  }, [loadConversations, loadMessages]);

  const selectedConversation = conversations.find((c) => c.id === selectedId) ?? null;
  const chatRecipient = selectedConversation?.otherUser ?? directRecipient;
  const conversationlessContacts = getConversationlessContacts(conversations, acceptedContacts);

  const filteredConversations = conversations.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      c.otherUser.name.toLowerCase().includes(term) ||
      c.otherUser.email.toLowerCase().includes(term)
    );
  });
  const filteredContacts = conversationlessContacts.filter((contact) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return contact.name.toLowerCase().includes(term) || contact.email.toLowerCase().includes(term);
  });

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content || !chatRecipient || sending) return;

    setSending(true);
    try {
      const { data: sent } = await messagesApi.send(chatRecipient.id, content);
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
      if (!selectedConversation) {
        selectedIdRef.current = sent.conversation_id;
        setSelectedId(sent.conversation_id);
      }
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
          {filteredConversations.length === 0 && filteredContacts.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-center px-4">
              <MessageSquare className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {conversations.length === 0 && conversationlessContacts.length === 0
                  ? 'No conversations yet'
                  : 'No matches'}
              </p>
            </div>
          )}
          {filteredConversations.map((conv) => {
            const unread = currentUser && conv.participant1_id === currentUser.id
              ? conv.unread_count_1
              : conv.unread_count_2;
            return (
              <button
                type="button"
                key={conv.id}
                onClick={() => {
                  setDirectRecipient(null);
                  setSelectedId(conv.id);
                }}
                className={`flex w-full items-center gap-3 p-4 text-left transition-colors ${
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
              </button>
            );
          })}
          {filteredContacts.map((contact) => {
            const isSelected = !selectedId && directRecipient?.id === contact.id;
            return (
              <button
                type="button"
                key={`contact-${contact.id}`}
                onClick={() => {
                  selectedIdRef.current = null;
                  setSelectedId(null);
                  setMessages([]);
                  setDirectRecipient(contact);
                }}
                className={`flex w-full items-center gap-3 p-4 text-left transition-colors ${
                  isSelected
                    ? 'bg-primary/10 border-r-2 border-primary'
                    : 'hover:bg-secondary/50'
                }`}
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="gradient-primary text-white text-sm">
                    {initials(contact.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium">{contact.name}</p>
                    <Badge variant="secondary" className="shrink-0">Accepted</Badge>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    Start a conversation
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!chatRecipient ? (
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
                    {initials(chatRecipient.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{chatRecipient.name}</p>
                  {chatRecipient.email && (
                    <p className="text-xs text-muted-foreground">{chatRecipient.email}</p>
                  )}
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
