import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Bell,
  Wallet,
  Sun,
  Moon,
  LogOut,
  Briefcase,
  Search,
  ChevronDown,
  Users,
  Loader2,
} from 'lucide-react';
import { useAuthStore, useNotificationStore, useWalletStore, useThemeStore } from '../../store';
import { Dropdown, DropdownItem } from '../ui';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import type { Project, FreelancerProfile } from '../../types';

interface NavbarProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

export function Navbar({ onMenuClick, isSidebarOpen }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const { address, isConnected, connect, disconnect, balance } = useWalletStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [isWalletConnecting, setIsWalletConnecting] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    projects: Project[];
    freelancers: FreelancerProfile[];
  }>({ projects: [], freelancers: [] });
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  const handleWalletConnect = async () => {
    // Check if MetaMask is installed
    if (typeof window.ethereum === 'undefined') {
      showToast({
        type: 'error',
        title: 'MetaMask Not Installed',
        message: 'Please install MetaMask browser extension to connect your wallet. Visit metamask.io to download.',
      });
      // Open MetaMask website in new tab
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsWalletConnecting(true);
    try {
      await connect();
      // Only show success toast if actually connected
      if (useWalletStore.getState().isConnected) {
        showToast({
          type: 'success',
          title: 'Wallet Connected',
          message: `Successfully connected to your wallet`,
        });
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      // Get the error message from the error object
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      showToast({
        type: 'error',
        title: 'Connection Failed',
        message: errorMessage,
      });
    } finally {
      setIsWalletConnecting(false);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ projects: [], freelancers: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [projects, freelancers] = await Promise.all([
          api.searchProjects({ keyword: searchQuery, limit: 5 }),
          api.searchFreelancers({ keyword: searchQuery, limit: 5 })
        ]);
        setSearchResults({
          projects: projects.items || [],
          freelancers: freelancers.items || []
        });
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  const isLanding = location.pathname === '/';

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled || !isLanding
          ? 'bg-dark-bg/80 backdrop-blur-xl border-b border-white/5 h-16 shadow-lg shadow-black/10'
          : 'bg-transparent h-20'
      }`}
    >
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Left section */}
        <div className="flex items-center gap-6">
          {isAuthenticated && (
            <button
              onClick={onMenuClick}
              className="p-2 text-gray-400 hover:text-white lg:hidden rounded-lg hover:bg-white/5 transition-colors"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

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

          {/* Desktop Navigation Links */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1 ml-8">
              <NavLink to="/projects" icon={<Briefcase className="w-4 h-4" />}>
                Projects
              </NavLink>
              <NavLink to="/freelancers" icon={<Users className="w-4 h-4" />}>
                Freelancers
              </NavLink>
            </nav>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-3">
          {/* Search Button */}
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 hidden sm:block"
            >
              <Search className="w-5 h-5" />
            </motion.button>
          )}

          {/* Theme toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Sun className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Moon className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {isAuthenticated ? (
            <>
              {/* Wallet - Hide for admin */}
              {user?.role !== 'admin' && (
                <>
                  {isConnected ? (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-dark-surface/50 rounded-full border border-white/10 backdrop-blur-sm"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 rounded-full bg-accent-success"
                      />
                      <span className="text-sm text-gray-300 font-mono">{formatAddress(address!)}</span>
                      {balance && (
                        <span className="text-sm text-primary-400 font-medium pl-2 border-l border-white/10">
                          {parseFloat(balance).toFixed(4)} ETH
                        </span>
                      )}
                      <button
                        onClick={() => {
                          disconnect();
                          showToast({
                            type: 'info',
                            title: 'Wallet Disconnected',
                            message: 'Your wallet has been disconnected',
                          });
                        }}
                        className="text-gray-500 hover:text-gray-300 ml-1 p-1 rounded hover:bg-white/5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleWalletConnect}
                      disabled={isWalletConnecting}
                      className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-full transition-all shadow-lg shadow-primary-500/20 text-sm font-medium"
                    >
                      <Wallet className="w-4 h-4" />
                      <span>{isWalletConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
                    </motion.button>
                  )}
                </>
              )}

              {/* Notifications */}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/notifications"
                  className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 w-2 h-2 bg-accent-error rounded-full border-2 border-dark-bg"
                    />
                  )}
                </Link>
              </motion.div>

              {/* Profile dropdown */}
              <Dropdown
                align="right"
                trigger={
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-9 h-9 bg-gradient-to-tr from-primary-600 to-purple-600 rounded-full flex items-center justify-center ring-2 ring-transparent hover:ring-primary-500/50 transition-all">
                      <span className="text-white text-sm font-bold">
                        {user?.email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block" />
                  </motion.button>
                }
              >
                <div className="p-4 border-b border-white/5 bg-white/5">
                  <p className="text-sm text-white font-medium truncate">{user?.email}</p>
                  <p className="text-xs text-primary-400 capitalize mt-0.5">{user?.role}</p>
                </div>
                <div className="p-2">
                  <DropdownItem icon={<LogOut className="w-4 h-4" />} onClick={logout} danger>
                    Logout
                  </DropdownItem>
                </div>
              </Dropdown>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
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
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-full left-0 right-0 bg-dark-surface/95 backdrop-blur-xl border-b border-white/10 p-4 shadow-2xl z-50"
          >
            <div className="max-w-2xl mx-auto space-y-4">
              <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects, freelancers..."
                    className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                    autoFocus
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                  )}
                </div>
              </form>

              {/* Search Results */}
              {searchQuery && !searchLoading && (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {/* Projects */}
                  {searchResults.projects.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2 px-2">Projects</h3>
                      <div className="space-y-1">
                        {searchResults.projects.map((project) => (
                          <Link
                            key={project.id}
                            to={`/projects/${project.id}`}
                            onClick={() => {
                              setShowSearch(false);
                              setSearchQuery('');
                            }}
                            className="block p-3 bg-dark-bg hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <div className="font-medium text-white">{project.title}</div>
                            <div className="text-sm text-gray-400 line-clamp-1">{project.description}</div>
                            <div className="text-xs text-primary-400 mt-1">${project.budget}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Freelancers */}
                  {searchResults.freelancers.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-400 mb-2 px-2">Freelancers</h3>
                      <div className="space-y-1">
                        {searchResults.freelancers.map((freelancer) => (
                          <Link
                            key={freelancer.id}
                            to={`/freelancers/${freelancer.userId}`}
                            onClick={() => {
                              setShowSearch(false);
                              setSearchQuery('');
                            }}
                            className="block p-3 bg-dark-bg hover:bg-white/5 rounded-lg transition-colors"
                          >
                            <div className="font-medium text-white">{freelancer.name || 'Anonymous'}</div>
                            <div className="text-sm text-gray-400 line-clamp-1">{freelancer.bio}</div>
                            <div className="text-xs text-primary-400 mt-1">${freelancer.hourlyRate}/hr</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {searchResults.projects.length === 0 && searchResults.freelancers.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      No results found for "{searchQuery}"
                    </div>
                  )}

                  {/* View All Results */}
                  {(searchResults.projects.length > 0 || searchResults.freelancers.length > 0) && (
                    <button
                      onClick={() => {
                        navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
                        setShowSearch(false);
                        setSearchQuery('');
                      }}
                      className="w-full p-3 text-center text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                    >
                      View all results →
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function NavLink({ to, icon, children }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? 'text-white bg-white/10'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

