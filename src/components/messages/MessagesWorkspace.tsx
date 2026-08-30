'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/ui/status-badge';
import { contractsApi, employersApi, fileUploadsApi, freelancersApi, messagesApi, projectsApi } from '@/lib/api';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import { formatRelativeTime } from '@/lib/format';
import { MessageAttachmentValidationError, sendMessageWithAttachments, validateMessageAttachments } from '@/lib/message-attachment';
import {
  getRealtimeMessage,
  getConversationlessContacts,
  getInitialConversationId,
  mergeConversationMessages,
} from '@/lib/dashboard-message-route';
import { subscribeToNotificationStream } from '@/lib/sse';
import { useAuthStore } from '@/stores/authStore';
import type { ConversationWithDetails, Message, Project } from '@/types';
import { toast } from 'sonner';
import { Send, Search, Check, CheckCheck, MessageSquare, ExternalLink, FileText, Paperclip, X, ArrowLeft, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessagesWorkspaceSkeleton, MessageThreadSkeleton } from '@/components/messages/messages-workspace-skeleton';

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return 'recently';
  return formatRelativeTime(iso);
}

export function MessagesWorkspace() {
  const searchParams = useSearchParams();
  const requestedRecipientId = searchParams?.get('recipientId')?.trim() || null;
  const requestedProjectId = searchParams?.get('projectId')?.trim() || null;
  const currentUser = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageFiles, setMessageFiles] = useState<File[]>([]);
  const [search, setSearch] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [directRecipient, setDirectRecipient] = useState<ConversationWithDetails['otherUser'] | null>(null);
  const [acceptedContacts, setAcceptedContacts] = useState<ConversationWithDetails['otherUser'][]>([]);
  const [inquiredProject, setInquiredProject] = useState<Project | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    let active = true;

    if (requestedProjectId) {
      projectsApi
        .get(requestedProjectId)
        .then((res) => {
          if (active && res.data) {
            setInquiredProject(res.data);
            setNewMessage((prev) =>
              prev ? prev : `Hi! I am reaching out regarding your project "${res.data.title}".`
            );
          }
        })
        .catch(() => {
          // Ignore if not found
        });
      return () => {
        active = false;
      };
    }

    if (messages.length === 0) {
      setInquiredProject(null);
      return;
    }

    // Inspect messages for project references
    const inspectMessages = async () => {
      for (const msg of messages) {
        // 1. Direct project link in message
        const idMatch = msg.content.match(/\/projects\/([a-f0-9-]{36}|[a-zA-Z0-9_-]{10,})/i);
        if (idMatch && idMatch[1]) {
          try {
            const { data } = await projectsApi.get(idMatch[1]);
            if (active && data) {
              setInquiredProject(data);
              return;
            }
          } catch {
            // Ignore
          }
        }

        // 2. Project title in quotes: regarding your project "test lang"
        const titleMatch =
          msg.content.match(/regarding (?:your )?project ["“](.+?)["”]/i) ||
          msg.content.match(/project ["“](.+?)["”]/i);
        if (titleMatch && titleMatch[1]) {
          const titleQuery = titleMatch[1].trim();
          try {
            const { data } = await projectsApi.list({ limit: 50 });
            if (active && data.items.length > 0) {
              const matched =
                data.items.find(
                  (p) => p.title.toLowerCase() === titleQuery.toLowerCase()
                ) || data.items.find((p) => p.title.toLowerCase().includes(titleQuery.toLowerCase()));
              if (matched) {
                setInquiredProject(matched);
                return;
              }
            }
          } catch {
            // Ignore
          }
        }
      }
    };

    void inspectMessages();

    return () => {
      active = false;
    };
  }, [requestedProjectId, messages]);

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
          setDirectRecipient({ id: requestedRecipientId, name: 'Client', email: '' });
          try {
            if (currentUser?.role === 'freelancer') {
              const { data: profile } = await employersApi.getPublicProfile(requestedRecipientId);
              setDirectRecipient({
                id: requestedRecipientId,
                name: profile.name || profile.companyName || 'Employer',
                email: '',
              });
            } else {
              const { data: profile } = await freelancersApi.getPublicProfile(requestedRecipientId);
              setDirectRecipient({
                id: requestedRecipientId,
                name: profile.name || 'Freelancer',
                email: '',
              });
            }
          } catch {
            try {
              const { data: fallbackProfile } = await employersApi.getPublicProfile(requestedRecipientId);
              setDirectRecipient({
                id: requestedRecipientId,
                name: fallbackProfile.name || fallbackProfile.companyName || 'Employer',
                email: '',
              });
            } catch {
              // Sending still works with the user ID if the optional profile lookup fails.
            }
          }
        } else {
          setDirectRecipient(null);
        }
      }
    } catch {
      toast.error('Failed to load conversations');
    }
  }, [currentUser, requestedRecipientId]);

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
      const sent = await sendMessageWithAttachments(fileUploadsApi, messagesApi, chatRecipient.id, content, messageFiles);
      setMessages((prev) => [...prev, sent]);
      setNewMessage('');
      setMessageFiles([]);
      if (!selectedConversation) {
        selectedIdRef.current = sent.conversation_id;
        setSelectedId(sent.conversation_id);
      }
      loadConversations(false);
    } catch (error) {
      toast.error(error instanceof MessageAttachmentValidationError ? error.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loadingConversations) {
    return <MessagesWorkspaceSkeleton />;
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl overflow-hidden border border-border bg-card">
      {/* Conversations List */}
      <div className={cn('w-full md:w-80 border-r border-border flex flex-col', chatRecipient ? 'hidden md:flex' : 'flex')}>
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
          {!selectedId && directRecipient && !filteredContacts.some((c) => c.id === directRecipient.id) && (
            <div
              className="flex w-full items-center gap-3 p-4 text-left transition-colors bg-primary/10 border-r-2 border-primary"
            >
              <Avatar className="w-10 h-10">
                <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
                  {initials(directRecipient.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{directRecipient.name}</p>
                  <Badge className="shrink-0 gradient-primary text-primary-foreground text-3xs py-0.5">New Chat</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-primary font-medium">
                  Type a message to start chatting
                </p>
              </div>
            </div>
          )}
          {filteredConversations.length === 0 &&
            filteredContacts.length === 0 &&
            !(!selectedId && directRecipient) && (
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
                  <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
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
                  <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs gradient-primary text-primary-foreground">
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
                  <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
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
      <div className={cn('flex-1 flex flex-col', !chatRecipient ? 'hidden md:flex' : 'flex')}>
        {!chatRecipient ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a conversation to start chatting
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden -ml-2 h-8 w-8"
                  onClick={() => {
                    setSelectedId(null);
                    setDirectRecipient(null);
                  }}
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="gradient-primary text-primary-foreground text-sm">
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
            </div>

            {/* Inquired Project Context Banner */}
            {inquiredProject && (
              <div className="mx-4 mt-3 mb-1 p-3 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    <Briefcase className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-3xs uppercase font-bold tracking-wider text-primary">Inquiring Project</span>
                      <StatusBadge status={inquiredProject.status} domain="project" />
                    </div>
                    <p className="text-sm font-bold text-foreground truncate">{inquiredProject.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <span className="text-xs font-bold text-foreground px-2.5 py-1 rounded-lg bg-card border border-border">
                    ${inquiredProject.budget} USDC
                  </span>
                  <Button asChild variant="outline" size="sm" className="h-7 text-xs rounded-lg border-border">
                    <Link
                      href={
                        currentUser?.role === 'employer'
                          ? `/dashboard/employer/projects/${inquiredProject.id}`
                          : `/dashboard/freelancer/projects/${inquiredProject.id}`
                      }
                      target="_blank"
                    >
                      View Project <ExternalLink className="size-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <MessageThreadSkeleton />
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
                            ? 'gradient-primary text-primary-foreground rounded-br-md'
                            : 'bg-secondary border border-border rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        {(msg.attachments ?? []).length > 0 && (
                          <ul className="mt-2 space-y-1.5" aria-label="Message attachments">
                            {(msg.attachments ?? []).map((attachment) => {
                              const url = safeAttachmentUrl(attachment.url);
                              return <li key={`${msg.id}-${attachment.filename}-${attachment.url}`}>{url ? <a href={url} target="_blank" rel="noreferrer" className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${isMine ? 'border-primary-foreground/30 hover:bg-primary-foreground/10' : 'border-border hover:bg-background'}`}><FileText className="h-3.5 w-3.5 shrink-0" /><span className="min-w-0 flex-1 truncate">{attachment.filename}</span><span className={isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}>{formatFileSize(attachment.size)}</span><ExternalLink className="h-3 w-3 shrink-0" /></a> : <span className="flex items-center gap-2 text-xs"><FileText className="h-3.5 w-3.5" />Attachment unavailable</span>}</li>;
                            })}
                          </ul>
                        )}
                        <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : ''}`}>
                          <span className={`text-xs ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {relativeTime(msg.created_at)}
                          </span>
                          {isMine && (
                            msg.is_read ? (
                              <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                            ) : (
                              <Check className="w-3 h-3 text-primary-foreground/70" />
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
              {messageFiles.length > 0 && <ul className="mb-3 flex flex-wrap gap-2" aria-label="Selected message attachments">{messageFiles.map((file) => <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex max-w-60 items-center gap-2 rounded-lg border border-border px-2 py-1 text-xs"><Paperclip className="h-3.5 w-3.5 shrink-0" /><span className="min-w-0 truncate">{file.name}</span><span className="shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span><button type="button" aria-label={`Remove ${file.name}`} className="rounded-sm hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => setMessageFiles((current) => current.filter((candidate) => candidate !== file))}><X className="h-3.5 w-3.5" /></button></li>)}</ul>}
              <div className="flex items-center gap-3">
                <label htmlFor="message-attachments" className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-border hover:bg-accent focus-within:ring-2 focus-within:ring-ring" aria-label="Attach files">
                  <Paperclip className="h-4 w-4" />
                  <input id="message-attachments" type="file" multiple className="sr-only" accept=".pdf,.doc,.docx,.xlsx,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip,.rar,.7z,.mp4,.webm,.mov" onChange={(event) => {
                    const next = [...messageFiles, ...Array.from(event.target.files ?? [])];
                    const error = validateMessageAttachments(next);
                    if (error) toast.error(error); else setMessageFiles(next);
                    event.target.value = '';
                  }} />
                </label>
                <label htmlFor="new-message" className="sr-only">Message</label>
                <Input
                  id="new-message"
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
                <Button variant="gradient" size="icon" aria-label="Send message" onClick={handleSend} loading={sending} disabled={!newMessage.trim()}>
                  <Send className="size-5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
