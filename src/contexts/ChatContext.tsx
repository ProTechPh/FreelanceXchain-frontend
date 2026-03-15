import { createContext, useContext, useState, type ReactNode } from 'react';

interface ChatRecipient {
  userId: string;
  name: string;
  role: 'Client' | 'Freelancer' | 'User';
  contextId?: string; // project ID, contract ID, etc.
}

interface ChatContextType {
  preferredRecipient: ChatRecipient | null;
  setPreferredRecipient: (recipient: ChatRecipient | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [preferredRecipient, setPreferredRecipient] = useState<ChatRecipient | null>(null);

  return (
    <ChatContext.Provider value={{ preferredRecipient, setPreferredRecipient }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
