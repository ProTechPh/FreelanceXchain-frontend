import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, defaultTab, onChange, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  return (
    <div className={clsx('w-full', className)}>
      {/* Tab Headers */}
      <div className="flex gap-1 p-1 bg-dark-surface/50 rounded-xl border border-white/5 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={clsx(
              'relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg',
              'text-sm font-medium transition-colors flex-1',
              activeTab === tab.id
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-300'
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-primary-600/20 border border-primary-500/30 rounded-lg"
                transition={{ type: 'spring', duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {tab.icon}
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTabContent}
      </motion.div>
    </div>
  );
}
