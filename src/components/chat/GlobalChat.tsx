import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatButton } from './ChatButton';
import { ChatPopup } from './ChatPopup';
import { useAuthStore } from '../../store';
import { useChatContext } from '../../contexts/ChatContext';
import api from '../../lib/api';
import type { Conversation } from '../../types';

const SSE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/api$/, '') + '/api/notifications/stream';
const FALLBACK_POLLING_INTERVAL = 15000; // Fallback polling when SSE unavailable

export function GlobalChat() {
  const { isAuthenticated, user } = useAuthStore();
  const { preferredRecipient } = useChatContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const sseAbortRef = useRef<AbortController | null>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !user?.id) return;

    try {
      const response = await api.getConversations({ limit: 100, page: 1 });
      const total = response.items.reduce((sum, conv) => {
        const count = conv.participant1_id === user.id 
          ? conv.unread_count_1 
          : conv.unread_count_2;
        return sum + count;
      }, 0);
      setUnreadCount(total);

      // Set first conversation as selected if none selected
      if (!selectedConversation && response.items.length > 0) {
        setSelectedConversation(response.items[0]);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [isAuthenticated, user?.id, selectedConversation]);

  // SSE subscription for real-time unread count (polling fallback when SSE unavailable)
  useEffect(() => {
    if (!isAuthenticated || !user?.id || isChatOpen) return;

    fetchUnreadCount();

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
              if (event?.type === 'message') {
                fetchUnreadCount();
              }
            } catch { /* ignore */ }
          }
        }
      } catch {
        if (ctrl.signal.aborted) return;
        // SSE unavailable — poll
        if (!pollingRef.current) {
          pollingRef.current = setInterval(fetchUnreadCount, FALLBACK_POLLING_INTERVAL);
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
  }, [isAuthenticated, user?.id, isChatOpen, fetchUnreadCount]);

  // Don't render if not authenticated
  if (!isAuthenticated || !user?.id) {
    return null;
  }

  // Use preferred recipient if set, otherwise use first conversation or fallback
  let contractId: string;
  let otherPartyId: string;
  let otherPartyName: string;
  let otherPartyRole: 'Client' | 'Freelancer' | 'User';

  if (preferredRecipient) {
    // Use the preferred recipient from context (e.g., project creator)
    contractId = preferredRecipient.contextId || 'global';
    otherPartyId = preferredRecipient.userId;
    otherPartyName = preferredRecipient.name;
    otherPartyRole = preferredRecipient.role;
  } else if (selectedConversation) {
    // Use selected conversation
    contractId = selectedConversation.id;
    otherPartyId = selectedConversation.participant1_id === user.id 
      ? selectedConversation.participant2_id 
      : selectedConversation.participant1_id;
    otherPartyName = selectedConversation.otherUser?.name || 'User';
    otherPartyRole = 'User';
  } else {
    // Fallback
    contractId = 'global';
    otherPartyId = user.id;
    otherPartyName = 'Messages';
    otherPartyRole = 'User';
  }

  return (
    <>
      <ChatButton
        onClick={() => {
          setIsChatOpen(true);
          setIsChatMinimized(false);
        }}
        unreadCount={unreadCount}
        isOpen={isChatOpen}
      />

      <ChatPopup
        contractId={contractId}
        otherPartyId={otherPartyId}
        otherPartyName={otherPartyName}
        otherPartyRole={otherPartyRole}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setIsChatMinimized(false);
          fetchUnreadCount(); // Refresh unread count when closing
        }}
        onMinimize={() => setIsChatMinimized(!isChatMinimized)}
        isMinimized={isChatMinimized}
        onUnreadCountChange={(count) => {
          if (count === 0) {
            fetchUnreadCount();
          }
        }}
      />
    </>
  );
}
