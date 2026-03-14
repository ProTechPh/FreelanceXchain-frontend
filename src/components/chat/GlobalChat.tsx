import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatButton } from './ChatButton';
import { ChatPopup } from './ChatPopup';
import { useAuthStore } from '../../store';
import api from '../../lib/api';
import type { Conversation } from '../../types';

const POLLING_INTERVAL = 10000; // Poll every 10 seconds for unread count

export function GlobalChat() {
  const { isAuthenticated, user } = useAuthStore();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

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

  // Poll for unread messages
  useEffect(() => {
    if (isAuthenticated && !isChatOpen) {
      fetchUnreadCount();
      pollingRef.current = setInterval(fetchUnreadCount, POLLING_INTERVAL);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [isAuthenticated, isChatOpen, fetchUnreadCount]);

  // Don't render if not authenticated
  if (!isAuthenticated || !user?.id) {
    return null;
  }

  // Use first conversation or fallback
  const contractId = selectedConversation?.id || 'global';
  const otherPartyId = selectedConversation 
    ? (selectedConversation.participant1_id === user.id 
        ? selectedConversation.participant2_id 
        : selectedConversation.participant1_id)
    : user.id; // Fallback to self
  const otherPartyName = selectedConversation?.otherUser?.name || 'Messages';
  const otherPartyRole = 'User' as const;

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
