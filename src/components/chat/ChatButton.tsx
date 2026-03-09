import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface ChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  isOpen: boolean;
}

export function ChatButton({ onClick, unreadCount = 0, isOpen }: ChatButtonProps) {
  if (isOpen) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-full shadow-2xl shadow-primary-500/50 flex items-center justify-center z-40 transition-all duration-300"
      title="Open chat"
    >
      <MessageCircle className="w-6 h-6" />
      
      {/* Unread Badge */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-dark-bg shadow-lg"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.div>
      )}

      {/* Pulse animation for unread messages */}
      {unreadCount > 0 && (
        <span className="absolute inset-0 rounded-full bg-primary-600 animate-ping opacity-40"></span>
      )}
    </motion.button>
  );
}
