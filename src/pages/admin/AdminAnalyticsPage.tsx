import { useState, useEffect } from 'react';
import { BarChart3, Users, Briefcase, DollarSign, TrendingUp, Activity } from 'lucide-react';
import api from '../../lib/api';

interface AnalyticsData {
  totalUsers: number;
  totalProjects: number;
  totalRevenue: number;
  activeContracts: number;
  userGrowth: number;
  projectGrowth: number;
}

export function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalProjects: 0,
    totalRevenue: 0,
    activeContracts: 0,
    userGrowth: 0,
    projectGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getAdminAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
        <p className="text-gray-400">Platform performance and statistics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Users */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary-500/10 rounded-lg">
              <Users className="w-6 h-6 text-primary-400" />
            </div>
            <span className="text-green-400 text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              +{analytics.userGrowth}%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Total Users</h3>
          <p className="text-3xl font-bold text-white">{analytics.totalUsers.toLocaleString()}</p>
        </div>

        {/* Total Projects */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-green-400 text-sm font-medium flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              +{analytics.projectGrowth}%
            </span>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Total Projects</h3>
          <p className="text-3xl font-bold text-white">{analytics.totalProjects.toLocaleString()}</p>
        </div>

        {/* Total Revenue */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-white">${analytics.totalRevenue.toLocaleString()}</p>
        </div>

        {/* Active Contracts */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
          </div>
          <h3 className="text-gray-400 text-sm mb-1">Active Contracts</h3>
          <p className="text-3xl font-bold text-white">{analytics.activeContracts}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placeholder for charts */}
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-primary-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">User Growth</h2>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Chart visualization coming soon</p>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-5 h-5 text-blue-400 mr-2" />
            <h2 className="text-xl font-semibold text-white">Project Activity</h2>
          </div>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
