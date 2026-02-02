import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  DollarSign,
  Clock,
  Grid3x3,
  List,
  X,
  Briefcase,
  TrendingUp,
  Plus,
  Sparkles,
  Users,
  Target,
  ArrowRight
} from 'lucide-react';
import { Card, Button, StatusBadge, Badge, ProjectCardSkeleton } from '../../components/ui';
import api from '../../lib/api';
import type { Project, Skill } from '../../types';
import { format } from 'date-fns';
import { useAuthStore } from '../../store';
import { motion } from 'framer-motion';

export function ProjectListPage({ showMyProjects = false }: { showMyProjects?: boolean }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState(searchParams.get('keyword') || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    searchParams.get('skills')?.split(',').filter(Boolean) || []
  );
  const [filters, setFilters] = useState({
    minBudget: searchParams.get('minBudget') || '',
    maxBudget: searchParams.get('maxBudget') || '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalBudget: 0
  });

  // Fetch available skills for filter
  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const allSkills = await api.getAllSkills();
        setSkills(allSkills.filter(s => s.isActive));
      } catch (error) {
        console.error('Error fetching skills:', error);
      }
    };
    fetchSkills();
  }, []);

  const fetchProjects = async (loadMore = false) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        limit: 20,
      };

      if (loadMore && continuationToken) {
        params.continuationToken = continuationToken;
      }

      if (searchTerm) params.keyword = searchTerm;
      if (selectedSkills.length > 0) params.skills = selectedSkills.join(',');
      if (filters.minBudget) params.minBudget = parseFloat(filters.minBudget);
      if (filters.maxBudget) params.maxBudget = parseFloat(filters.maxBudget);

      const response = showMyProjects
        ? await api.getMyProjects(params)
        : await api.getProjects(params);
      
      if (loadMore) {
        setProjects(prev => [...prev, ...response.items]);
      } else {
        setProjects(response.items);
      }
      
      setHasMore(response.hasMore);
      setContinuationToken(response.continuationToken);

      // Calculate stats
      const activeProjects = response.items.filter((p: Project) => p.status === 'open').length;
      const totalBudget = response.items.reduce((sum: number, p: Project) => {
        const budget = typeof p.budget === 'string' ? parseFloat(p.budget) : p.budget;
        return sum + (budget || 0);
      }, 0);
      setStats({
        totalProjects: response.items.length,
        activeProjects,
        totalBudget
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('keyword', searchTerm);
    if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','));
    if (filters.minBudget) params.set('minBudget', filters.minBudget);
    if (filters.maxBudget) params.set('maxBudget', filters.maxBudget);
    setSearchParams(params);
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId)
        ? prev.filter(id => id !== skillId)
        : [...prev, skillId]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSkills([]);
    setFilters({ minBudget: '', maxBudget: '' });
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm || selectedSkills.length > 0 || filters.minBudget || filters.maxBudget;

  const EmptyState = () => {
    if (hasActiveFilters) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No projects found</h3>
              <p className="text-gray-400 mb-6">
                We couldn't find any projects matching your criteria. Try adjusting your filters or search terms.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isAuthenticated && user?.role === 'employer' ? 'No projects yet' : 'No projects available'}
            </h3>
            <p className="text-gray-400 mb-6">
              {isAuthenticated && user?.role === 'employer'
                ? 'Start by creating your first project and find the perfect freelancer for your needs.'
                : isAuthenticated
                ? 'Check back soon for new opportunities, or refine your profile to get better matches.'
                : 'Sign up to access exclusive projects and start your freelancing journey.'}
            </p>
            {isAuthenticated && user?.role === 'employer' ? (
              <Button onClick={() => navigate('/projects/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            ) : !isAuthenticated ? (
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/register')}>
                  Get Started
                </Button>
                <Button variant="outline" onClick={() => navigate('/login')}>
                  Log In
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-900/20 via-dark-bg to-dark-bg border-b border-dark-border">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iIzZCNzI4MCIgc3Ryb2tlLXdpZHRoPSIuNSIgb3BhY2l0eT0iLjEiLz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-sm font-medium text-primary-300">Discover Your Next Opportunity</span>
            </motion.div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              {showMyProjects ? (
                <>
                  My <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">Projects</span>
                </>
              ) : (
                <>
                  Browse <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">Blockchain-Powered</span> Projects
                </>
              )}
            </h1>
            <p className="text-lg text-gray-400 mb-8">
              {showMyProjects
                ? 'Manage your projects, track proposals, and monitor progress. All secured by blockchain technology.'
                : 'Find projects that match your skills. Secure payments through smart contracts. Build your reputation on-chain.'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-dark-card/50 backdrop-blur-sm border border-dark-border rounded-xl p-4"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Briefcase className="w-5 h-5 text-primary-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalProjects}</div>
                <div className="text-xs sm:text-sm text-gray-400">Total Projects</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-dark-card/50 backdrop-blur-sm border border-dark-border rounded-xl p-4"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">{stats.activeProjects}</div>
                <div className="text-xs sm:text-sm text-gray-400">Active Now</div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="bg-dark-card/50 backdrop-blur-sm border border-dark-border rounded-xl p-4"
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalBudget.toFixed(2)}</div>
                <div className="text-xs sm:text-sm text-gray-400">ETH Available</div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {showMyProjects ? 'My Projects' : 'All Projects'}
            </h2>
            <p className="text-gray-400 mt-1">
              {projects.length > 0 ? `Showing ${projects.length} project${projects.length !== 1 ? 's' : ''}` : showMyProjects ? 'No projects created yet' : 'Find your next opportunity'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && user?.role === 'employer' && (
              <Button onClick={() => navigate('/projects/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card>
        <form onSubmit={handleSearch}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button
                type="button"
                variant={showFilters ? 'primary' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 px-1.5 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                    {[searchTerm, ...selectedSkills, filters.minBudget, filters.maxBudget].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-dark-border space-y-4">
              {/* Skills Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Required Skills
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-dark-bg rounded-lg border border-dark-border">
                  {skills.length === 0 ? (
                    <p className="text-sm text-gray-500">Loading skills...</p>
                  ) : (
                    skills.map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedSkills.includes(skill.id)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        {skill.name}
                      </button>
                    ))
                  )}
                </div>
                {selectedSkills.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedSkills.map((skillId) => {
                      const skill = skills.find(s => s.id === skillId);
                      return skill ? (
                        <Badge key={skillId} variant="primary" className="flex items-center gap-1">
                          {skill.name}
                          <button
                            type="button"
                            onClick={() => toggleSkill(skillId)}
                            className="ml-1 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Budget Range */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Min Budget (ETH)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={filters.minBudget}
                      onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                      className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Budget (ETH)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={filters.maxBudget}
                      onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                      className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-primary-500 transition-colors"
                      placeholder="10.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  Clear All Filters
                </Button>
                <Button type="submit">
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </form>
      </Card>
      </motion.div>

      {/* Results */}
      {loading ? (
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={viewMode === 'grid' ? 'grid gap-4' : 'space-y-4'}
          >
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <Link to={`/projects/${project.id}`}>
                  <Card hover className="transition-all hover:shadow-lg hover:shadow-primary-500/10 hover:border-primary-500/30">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white truncate hover:text-primary-400 transition-colors">
                            {project.title}
                          </h3>
                          <StatusBadge status={project.status} />
                        </div>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-3">
                          {project.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {project.requiredSkills?.slice(0, 5).map((skill, idx) => (
                            <Badge key={skill.skillId || idx} variant="primary" size="sm">
                              {skill.skillName}
                            </Badge>
                          ))}
                          {project.requiredSkills && project.requiredSkills.length > 5 && (
                            <Badge variant="default" size="sm">
                              +{project.requiredSkills.length - 5} more
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          <span className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="font-medium text-white">{project.budget} ETH</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-500" />
                            {project.deadline
                              ? format(new Date(project.deadline), 'MMM d, yyyy')
                              : 'No deadline'}
                          </span>
                          {project.proposalCount !== undefined && (
                            <span className="flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-purple-500" />
                              {project.proposalCount} proposal{project.proposalCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center gap-2">
                        <Button size="sm" variant="ghost" className="group">
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => fetchProjects(true)}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More Projects'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* CTA Section for non-authenticated users */}
      {!isAuthenticated && projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-primary-900/20 to-indigo-900/20 border-primary-500/20">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Ready to Get Started?</h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                Join thousands of freelancers and employers using blockchain technology for secure, transparent work agreements.
              </p>
              <div className="flex gap-3 justify-center">
                <Button size="lg" onClick={() => navigate('/register')}>
                  Sign Up Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
                  Log In
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  </div>
  );
}
