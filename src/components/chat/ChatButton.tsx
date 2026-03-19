import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ChatButtonProps {
  onClick: () => void;
  unreadCount?: number;
  isOpen: boolean;
}

export function ChatButton({ onClick, unreadCount = 0, isOpen }: ChatButtonProps) {
  const [position, setPosition] = useState({ x: 0, y: 24 });
  const [side, setSide] = useState<'left' | 'right'>('right');
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);

  // Load saved position from localStorage
  useEffect(() => {
    const savedSide = localStorage.getItem('chatButtonSide');
    const savedY = localStorage.getItem('chatButtonYPos');
    if (savedSide === 'left' || savedSide === 'right') {
      setSide(savedSide);
    }
    if (savedY) {
      setPosition({ x: 0, y: parseFloat(savedY) });
    }
  }, []);

  const handleDragStart = () => {
    setIsDragging(true);
    setHasMoved(false);
  };

  const handleDrag = (_: any, info: any) => {
    // If moved more than 5px, consider it a drag
    if (Math.abs(info.offset.x) > 5 || Math.abs(info.offset.y) > 5) {
      setHasMoved(true);
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Get the drag endpoint
    const endX = info.point.x;
    const endY = info.point.y;

    // Determine which side to snap to
    const newSide = endX < windowWidth / 2 ? 'left' : 'right';
    
    // Calculate Y position from bottom (keep within bounds)
    const bottomY = windowHeight - endY;
    const clampedY = Math.max(24, Math.min(windowHeight - 88, bottomY));

    setSide(newSide);
    setPosition({ x: 0, y: clampedY });
    setIsDragging(false);

    // Save to localStorage
    localStorage.setItem('chatButtonSide', newSide);
    localStorage.setItem('chatButtonYPos', clampedY.toString());
  };

  const handleClick = (e: React.MouseEvent) => {
    // Prevent click if user was dragging
    if (hasMoved) {
      e.preventDefault();
      e.stopPropagation();
      setHasMoved(false);
      return;
    }
    onClick();
  };

  if (isOpen) return null;

  return (
    <motion.button
      drag
      dragMomentum={false}
      dragElastic={0}
      dragTransition={{ power: 0, timeConstant: 0 }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      animate={!isDragging ? { x: 0, y: 0 } : undefined}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        mass: 0.5
      }}
      initial={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: isDragging ? 1 : 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      style={{
        [side]: '24px',
        bottom: `${position.y}px`,
        touchAction: 'none'
      }}
      className="fixed w-16 h-16 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-700 hover:from-primary-500 hover:via-primary-600 hover:to-indigo-600 text-white rounded-full shadow-2xl shadow-primary-500/40 flex items-center justify-center z-40 ring-4 ring-primary-100 dark:ring-primary-900/30 cursor-grab active:cursor-grabbing"
      title="Open chat (drag to move)"
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
