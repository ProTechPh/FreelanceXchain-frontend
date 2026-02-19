import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore, useThemeStore, useWalletStore } from './store';
import { Layout } from './components/layout/Layout';
import { PublicLayout } from './components/layout/PublicLayout';
import { KycProtectedRoute } from './components/KycProtectedRoute';
import { ToastProvider } from './contexts/ToastContext';
import { useEffect } from 'react';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { OAuthCallbackPage } from './pages/auth/OAuthCallbackPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ProjectListPage } from './pages/projects/ProjectListPage';
import { ProjectDetailPage } from './pages/projects/ProjectDetailPage';
import { CreateProjectPage } from './pages/projects/CreateProjectPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { ContractsListPage } from './pages/contracts/ContractsListPage';
import { ContractDetailPage } from './pages/contracts/ContractDetailPage';
import { ProposalsListPage } from './pages/proposals/ProposalsListPage';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { DisputesListPage } from './pages/disputes/DisputesListPage';
import { DisputeDetailPage } from './pages/disputes/DisputeDetailPage';
import { KYCPage } from './pages/kyc/KYCPage';
import { RecommendationsPage } from './pages/recommendations/RecommendationsPage';
import { SkillAnalysisPage } from './pages/skills/SkillAnalysisPage';
import { WalletPage } from './pages/wallet/WalletPage';
import { SearchResultsPage } from './pages/search/SearchResultsPage';
import { FreelancerListPage } from './pages/freelancers/FreelancerListPage';
import { FreelancerDetailPage } from './pages/freelancers/FreelancerDetailPage';

// Protected Route wrapper
function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Public Route (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminKYCPage } from './pages/admin/AdminKYCPage';
import { AdminDisputesPage } from './pages/admin/AdminDisputesPage';
import { AdminSkillsPage } from './pages/admin/AdminSkillsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { HowItWorksPage } from './pages/info/HowItWorksPage';
import { FAQsPage } from './pages/info/FAQsPage';
import { HelpCenterPage } from './pages/info/HelpCenterPage';
import { BlogPage } from './pages/info/BlogPage';
import { TutorialsPage } from './pages/info/TutorialsPage';
import { TermsPage } from './pages/info/TermsPage';
import { PrivacyPage } from './pages/info/PrivacyPage';
import { AboutPage } from './pages/info/AboutPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { TutorialProvider } from './features/onboarding/components/TutorialProvider';
import { MfaChallengePage } from './pages/auth/MfaChallengePage';

function App() {
  const { isDark, toggle } = useThemeStore();
  const { isAuthenticated, fetchCurrentUser } = useAuthStore();
  const { isConnected, address, updateBalance } = useWalletStore();

  // Initialize theme on mount and sync with store state
  useEffect(() => {
    // Force sync DOM with store state on mount
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Fetch current user on mount to get latest KYC status
  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentUser().catch(() => {
        // Silently fail - user will be logged out if token is invalid
      });
    }
  }, [isAuthenticated, fetchCurrentUser]);

  // Auto-reconnect wallet on mount if previously connected
  useEffect(() => {
    const reconnectWallet = async () => {
      if (isConnected && address && typeof window.ethereum !== 'undefined') {
        try {
          // Update balance on reconnect
          await updateBalance();
        } catch (error) {
          console.error('Failed to reconnect wallet:', error);
        }
      }
    };

    reconnectWallet();

    // Listen for account changes
    if (typeof window.ethereum !== 'undefined') {
      const ethereum = window.ethereum as any; // Type assertion for event listeners

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected wallet
          useWalletStore.getState().disconnect();
        } else if (accounts[0] !== address) {
          // User switched accounts - reconnect
          useWalletStore.getState().connect();
        }
      };

      const handleChainChanged = () => {
        // Reload page on chain change (recommended by MetaMask)
        window.location.reload();
      };

      ethereum.on?.('accountsChanged', handleAccountsChanged);
      ethereum.on?.('chainChanged', handleChainChanged);

      return () => {
        ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
        ethereum.removeListener?.('chainChanged', handleChainChanged);
      };
    }
  }, []); // Only run once on mount

  return (
    <ToastProvider>
      <Router>
      <TutorialProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicLayout showMinimalHeader><LandingPage /></PublicLayout>} />
        <Route path="/how-it-works" element={<PublicLayout><HowItWorksPage /></PublicLayout>} />
        <Route path="/faqs" element={<PublicLayout><FAQsPage /></PublicLayout>} />
        <Route path="/help-center" element={<PublicLayout><HelpCenterPage /></PublicLayout>} />
        <Route path="/blog" element={<PublicLayout><BlogPage /></PublicLayout>} />
        <Route path="/tutorials" element={<PublicLayout><TutorialsPage /></PublicLayout>} />
        <Route path="/terms" element={<PublicLayout showMinimalHeader><TermsPage /></PublicLayout>} />
        <Route path="/privacy" element={<PublicLayout showMinimalHeader><PrivacyPage /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout showMinimalHeader><AboutPage /></PublicLayout>} />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/mfa/challenge" element={<PublicLayout><MfaChallengePage /></PublicLayout>} />

        {/* Public Project Routes */}
        <Route path="/projects" element={<PublicLayout><ProjectListPage /></PublicLayout>} />
        <Route
          path="/projects/:id"
          element={
            isAuthenticated ? (
              <Layout><ProjectDetailPage /></Layout>
            ) : (
              <PublicLayout showMinimalHeader><ProjectDetailPage /></PublicLayout>
            )
          }
        />
        
        {/* Search Route */}
        <Route path="/search" element={<PublicLayout><SearchResultsPage /></PublicLayout>} />

        {/* Protected Routes with Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Employer Routes - Require KYC */}
        <Route
          path="/projects/new"
          element={
            <ProtectedRoute roles={['employer', 'admin']}>
              <KycProtectedRoute>
                <Layout>
                  <CreateProjectPage />
                </Layout>
              </KycProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/manage"
          element={
            <ProtectedRoute roles={['employer', 'admin']}>
              <Layout>
                <ProjectListPage showMyProjects={true} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/edit"
          element={
            <ProtectedRoute roles={['employer', 'admin']}>
              <Layout>
                <CreateProjectPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id/proposals"
          element={
            <ProtectedRoute roles={['employer', 'admin']}>
              <Layout>
                <ProposalsListPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Freelancer Routes - Require KYC */}
        <Route
          path="/proposals"
          element={
            <ProtectedRoute roles={['freelancer']}>
              <KycProtectedRoute>
                <Layout>
                  <ProposalsListPage />
                </Layout>
              </KycProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute roles={['freelancer']}>
              <Layout>
                <RecommendationsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/skill-analysis"
          element={
            <ProtectedRoute roles={['freelancer']}>
              <KycProtectedRoute>
                <Layout>
                  <SkillAnalysisPage />
                </Layout>
              </KycProtectedRoute>
            </ProtectedRoute>
          }
        />

        {/* Shared Protected Routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <KycProtectedRoute>
                <Layout>
                  <ContractsListPage />
                </Layout>
              </KycProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts/:id"
          element={
            <ProtectedRoute>
              <KycProtectedRoute>
                <Layout>
                  <ContractDetailPage />
                </Layout>
              </KycProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/disputes"
          element={
            <ProtectedRoute>
              <KycProtectedRoute>
                <Layout>
                  <DisputesListPage />
                </Layout>
              </KycProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/disputes/:id"
          element={
            <ProtectedRoute>
              <KycProtectedRoute>
                <Layout>
                  <DisputeDetailPage />
                </Layout>
              </KycProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Layout>
                <NotificationsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc"
          element={
            <ProtectedRoute>
              <Layout>
                <KYCPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wallet"
          element={
            <ProtectedRoute>
              <KycProtectedRoute>
                <Layout>
                  <WalletPage />
                </Layout>
              </KycProtectedRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout>
                <AdminAnalyticsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout>
                <AdminUsersPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/kyc"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout>
                <AdminKYCPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/disputes"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout>
                <AdminDisputesPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/skills"
          element={
            <ProtectedRoute roles={['admin']}>
              <Layout>
                <AdminSkillsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Freelancer Directory - Employer Routes */}
        <Route
          path="/freelancers"
          element={
            <ProtectedRoute roles={['employer', 'admin']}>
              <Layout>
                <FreelancerListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/freelancers/:id"
          element={
            <ProtectedRoute roles={['employer', 'admin']}>
              <Layout>
                <FreelancerDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-white dark:bg-dark-bg flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Page not found</p>
                <a href="/" className="text-primary-400 hover:text-primary-300">
                  Go back home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
      </TutorialProvider>
    </Router>
    </ToastProvider>
  );
}

export default App;
