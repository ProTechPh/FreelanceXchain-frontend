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
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 hover:from-primary-500 hover:via-primary-600 hover:to-indigo-600 text-white rounded-full shadow-2xl shadow-primary-500/40 flex items-center justify-center z-40 transition-all duration-300 ring-4 ring-primary-100 dark:ring-primary-900/30"
      title="Open chat"
    >
      <MessageCircle className="w-7 h-7 drop-shadow-lg" strokeWidth={2.5} />
      
      {/* Unread Badge */}
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="absolute -top-1 -right-1 min-w-[26px] h-[26px] px-1.5 bg-gradient-to-br from-red-500 to-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-3 border-white dark:border-gray-900 shadow-lg"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </motion.div>
      )}

      {/* Pulse animation for unread messages */}
      {unreadCount > 0 && (
        <span className="absolute inset-0 rounded-full bg-primary-600 animate-ping opacity-30"></span>
      )}
      
      {/* Subtle glow effect */}
      <span className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-50"></span>
    </motion.button>
  );
}
