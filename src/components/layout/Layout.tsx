import { useState, useEffect, type ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAuthStore, useThemeStore } from '../../store';
import { GlobalChat } from '../chat';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg text-gray-900 dark:text-gray-100 flex flex-col">
      <Navbar
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="pt-0 flex-grow">
        {isAuthenticated && (
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}

        <main className={isAuthenticated ? 'lg:ml-64 pt-20' : ''}>
          <div className={isAuthenticated ? "p-4 sm:p-6 lg:p-8" : ""}>
            {children}
          </div>
        </main>
      </div>

      {!isAuthenticated && <Footer />}
      
      {/* Global Chat - Available on all authenticated pages */}
      {isAuthenticated && <GlobalChat />}
    </div>
  );
}
