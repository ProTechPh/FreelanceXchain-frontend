import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useThemeStore, useAuthStore } from '../../store';
import { Footer } from './Footer';
import { useState } from 'react';

interface PublicLayoutProps {
  children: ReactNode;
  showMinimalHeader?: boolean;
}

export function PublicLayout({ children, showMinimalHeader = false }: PublicLayoutProps) {
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-dark-bg text-gray-100 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
        className={`fixed top-0 left-0 right-0 z-50 ${
          showMinimalHeader || isLandingPage
            ? 'bg-transparent'
            : 'bg-dark-card/80 backdrop-blur-xl border-b border-dark-border'
        }`}
      >
        <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center"
            >
              <img 
                src="/logo.png" 
                alt="FreelanceXchain Logo" 
                className="h-10 w-auto object-contain"
              />
            </motion.div>
            <span className="text-xl font-bold text-white tracking-tight hidden sm:block">
              Freelance<span className="text-primary-400">Xchain</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          {!showMinimalHeader && !isLandingPage && (
            <nav className="hidden md:flex items-center gap-6">
              <Link
                to="/projects"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Browse Projects
              </Link>
              <Link
                to="/how-it-works"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                How It Works
              </Link>
              <Link
                to="/faqs"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                FAQs
              </Link>
            </nav>
          )}

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            {/* Auth buttons or Dashboard link */}
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-5 py-2.5 bg-gradient-to-r from-primary-500 to-indigo-500 hover:from-primary-600 hover:to-indigo-600 text-white rounded-full transition-all text-sm font-bold shadow-lg shadow-primary-500/20"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5 hidden sm:block"
                >
                  Log In
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                    className="px-5 py-2.5 bg-gradient-to-r from-white to-gray-100 text-primary-900 hover:from-gray-100 hover:to-white rounded-full transition-all text-sm font-bold shadow-lg shadow-white/10"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}

            {/* Mobile menu button */}
            {!showMinimalHeader && !isLandingPage && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {!showMinimalHeader && !isLandingPage && mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-dark-border bg-dark-card/95 backdrop-blur-xl"
          >
            <nav className="px-4 py-4 space-y-2">
              <Link
                to="/projects"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Browse Projects
              </Link>
              <Link
                to="/how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                How It Works
              </Link>
              <Link
                to="/faqs"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                FAQs
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors sm:hidden"
                >
                  Log In
                </Link>
              )}
            </nav>
          </motion.div>
        )}
      </motion.header>

      {/* Main content */}
      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
