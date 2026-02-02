import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  FileText, 
  DollarSign, 
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useAuthStore, useProfileStore } from '../../store';
import { Card, CardHeader, Button, StatusBadge, PageLoader } from '../../components/ui';
import { KycBanner } from '../../components/KycBanner';
import api from '../../lib/api';
import type { Project, Contract, Proposal, Notification, Dispute } from '../../types';

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trend?: string;
  color: string;
  bgColor: string;
}

function StatCard({ icon: Icon, label, value, trend, color, bgColor }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full">
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </motion.div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-green-400 text-sm">
              <TrendingUp className="w-4 h-4" />
              {trend}
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { freelancerProfile, employerProfile, fetchFreelancerProfile, fetchEmployerProfile } = useProfileStore();
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Admin-specific state
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    pendingKyc: 0,
    activeDisputes: 0,
    totalProjects: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (user?.role === 'admin') {
          // Admin dashboard - fetch real admin stats
          const [adminStatsRes, pendingKycRes, allDisputesRes] = await Promise.all([
            api.getAdminStats().catch(() => ({ totalUsers: 0, totalProjects: 0, totalFreelancers: 0, totalEmployers: 0 })),
            api.getPendingKycReviews().catch(() => []),
            api.getDisputes().catch(() => ({ items: [], continuationToken: null })),
          ]);
          
          const disputes = allDisputesRes.items || [];
          
          setAdminStats({
            totalUsers: adminStatsRes.totalUsers,
            pendingKyc: Array.isArray(pendingKycRes) ? pendingKycRes.length : 0,
            activeDisputes: disputes.filter((d: Dispute) => d.status === 'open' || d.status === 'under_review').length,
            totalProjects: adminStatsRes.totalProjects,
          });
          setLoading(false);
        } else if (user?.role === 'freelancer') {
          await fetchFreelancerProfile();
          const [contractsRes, proposalsRes, notificationsRes] = await Promise.all([
            api.getMyContracts().catch(() => []),
            api.getMyProposals().catch(() => []),
            api.getNotifications({ maxItemCount: 5 }).catch(() => ({ items: [], continuationToken: null })),
          ]);
          setContracts(Array.isArray(contractsRes) ? contractsRes : []);
          setProposals(Array.isArray(proposalsRes) ? proposalsRes : []);
          setNotifications(notificationsRes.items || []);
          setLoading(false);
        } else if (user?.role === 'employer') {
          await fetchEmployerProfile();
          const [contractsRes, projectsRes, notificationsRes] = await Promise.all([
            api.getMyContracts().catch(() => []),
            api.getMyEmployerProjects().catch(() => []),
            api.getNotifications({ maxItemCount: 5 }).catch(() => ({ items: [], continuationToken: null })),
          ]);
          setContracts(Array.isArray(contractsRes) ? contractsRes : []);
          setProjects(Array.isArray(projectsRes) ? projectsRes : []);
          setNotifications(notificationsRes.items || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user, fetchFreelancerProfile, fetchEmployerProfile]);

  if (loading) {
    return <PageLoader />;
  }

  // Admin Dashboard
  if (user?.role === 'admin') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              👋
            </motion.div>
            Welcome back, Admin!
          </h1>
          <p className="text-gray-400 mt-1">
            Platform overview and management
          </p>
        </motion.div>

        {/* Admin Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Users}
            label="Total Users"
            value={adminStats.totalUsers}
            color="text-primary-400"
            bgColor="bg-primary-600/20"
          />
          <StatCard
            icon={Shield}
            label="Pending KYC"
            value={adminStats.pendingKyc}
            color="text-amber-400"
            bgColor="bg-amber-600/20"
          />
          <StatCard
            icon={AlertTriangle}
            label="Active Disputes"
            value={adminStats.activeDisputes}
            color="text-red-400"
            bgColor="bg-red-600/20"
          />
          <StatCard
            icon={BarChart3}
            label="Total Projects"
            value={adminStats.totalProjects}
            color="text-green-400"
            bgColor="bg-green-600/20"
          />
        </div>

        {/* Quick Actions for Admin */}
        <Card>
          <CardHeader title="Quick Actions" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Link
              to="/admin/users"
              className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
            >
              <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-400" />
              </div>
              <span className="text-sm text-gray-300">Manage Users</span>
            </Link>
            <Link
              to="/admin/kyc"
              className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
            >
              <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-sm text-gray-300">KYC Reviews</span>
            </Link>
            <Link
              to="/admin/disputes"
              className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
            >
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <span className="text-sm text-gray-300">Disputes</span>
            </Link>
            <Link
              to="/settings"
              className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
            >
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm text-gray-300">Settings</span>
            </Link>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Freelancer/Employer Dashboard
  const isFreelancer = user?.role === 'freelancer';
  const profile = isFreelancer ? freelancerProfile : employerProfile;
  const activeContracts = contracts.filter(c => c.status === 'active');
  const pendingProposals = proposals.filter(p => p.status === 'pending');
  const openProjects = projects.filter(p => p.status === 'open');

  // Calculate total earned/spent from contracts
  const totalEarned = contracts
    .filter(c => c.status === 'completed' && isFreelancer)
    .reduce((sum, c) => sum + (typeof c.totalAmount === 'string' ? parseFloat(c.totalAmount) : c.totalAmount), 0);
  
  const totalSpent = contracts
    .filter(c => c.status === 'completed' && !isFreelancer)
    .reduce((sum, c) => sum + (typeof c.totalAmount === 'string' ? parseFloat(c.totalAmount) : c.totalAmount), 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              👋
            </motion.div>
            Welcome back{profile?.name ? `, ${profile.name}` : ''}!
          </h1>
          <p className="text-gray-400 mt-1">
            Here's what's happening with your {isFreelancer ? 'freelance work' : 'projects'}
          </p>
        </div>
        <Link to={isFreelancer ? '/projects' : '/projects/new'}>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button>
              {isFreelancer ? 'Browse Projects' : 'Create Project'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </Link>
      </motion.div>

      {/* KYC Banner */}
      <KycBanner />
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase}
          label="Active Contracts"
          value={activeContracts.length}
          color="text-primary-400"
          bgColor="bg-primary-600/20"
        />
        {isFreelancer ? (
          <>
            <StatCard
              icon={FileText}
              label="Pending Proposals"
              value={pendingProposals.length}
              color="text-amber-400"
              bgColor="bg-amber-600/20"
            />
            <StatCard
              icon={DollarSign}
              label="Total Earned"
              value={`${totalEarned.toFixed(4)} ETH`}
              color="text-green-400"
              bgColor="bg-green-600/20"
            />
            <StatCard
              icon={TrendingUp}
              label="Completed Projects"
              value={contracts.filter(c => c.status === 'completed').length}
              color="text-blue-400"
              bgColor="bg-blue-600/20"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={FileText}
              label="Open Projects"
              value={openProjects.length}
              color="text-amber-400"
              bgColor="bg-amber-600/20"
            />
            <StatCard
              icon={DollarSign}
              label="Total Spent"
              value={`${totalSpent.toFixed(4)} ETH`}
              color="text-green-400"
              bgColor="bg-green-600/20"
            />
            <StatCard
              icon={TrendingUp}
              label="Hired Freelancers"
              value={contracts.length}
              color="text-blue-400"
              bgColor="bg-blue-600/20"
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Active Contracts */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title="Active Contracts"
              description={`${activeContracts.length} ongoing contracts`}
              action={
                <Link to="/contracts" className="text-primary-400 hover:text-primary-300 text-sm">
                  View All
                </Link>
              }
            />
            {activeContracts.length > 0 ? (
              <div className="space-y-3">
                {activeContracts.slice(0, 5).map((contract) => (
                  <Link
                    key={contract.id}
                    to={`/contracts/${contract.id}`}
                    className="flex items-center justify-between p-3 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-600/20 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Contract #{contract.id.slice(0, 8)}</p>
                        <p className="text-gray-400 text-sm">{contract.totalAmount} ETH</p>
                      </div>
                    </div>
                    <StatusBadge status={contract.status} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No active contracts</p>
                <Link to={isFreelancer ? '/projects' : '/projects/new'}>
                  <Button variant="outline" size="sm" className="mt-3">
                    {isFreelancer ? 'Find Projects' : 'Create Project'}
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader
              title="Recent Activity"
              action={
                <Link to="/notifications" className="text-primary-400 hover:text-primary-300 text-sm">
                  View All
                </Link>
              }
            />
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-dark-bg"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      notification.type.includes('approved') || notification.type.includes('accepted')
                        ? 'bg-green-600/20'
                        : notification.type.includes('rejected') || notification.type.includes('dispute')
                          ? 'bg-red-600/20'
                          : 'bg-primary-600/20'
                    }`}>
                      {notification.type.includes('approved') || notification.type.includes('accepted') ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : notification.type.includes('rejected') || notification.type.includes('dispute') ? (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      ) : (
                        <Clock className="w-4 h-4 text-primary-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{notification.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="w-10 h-10 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No recent activity</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader title="Quick Actions" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/profile"
            className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
          >
            <div className="w-12 h-12 bg-primary-600/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-primary-400" />
            </div>
            <span className="text-sm text-gray-300">Edit Profile</span>
          </Link>
          <Link
            to="/kyc"
            className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
          >
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <span className="text-sm text-gray-300">KYC Status</span>
          </Link>
          <Link
            to="/wallet"
            className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
          >
            <div className="w-12 h-12 bg-amber-600/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-sm text-gray-300">Wallet</span>
          </Link>
          <Link
            to="/settings"
            className="flex flex-col items-center gap-2 p-4 bg-dark-bg rounded-lg hover:bg-dark-border transition-colors"
          >
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm text-gray-300">Settings</span>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
