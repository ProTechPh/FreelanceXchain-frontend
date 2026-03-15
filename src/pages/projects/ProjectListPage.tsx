import { useEffect, useState, useCallback } from 'react';
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
  Users,
  Target,
  ArrowRight,
  Tag,
  Wrench,
  Paperclip
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
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get('tags')?.split(',').filter(Boolean) || []
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
  const [availableTags, setAvailableTags] = useState<string[]>([]);

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

  const fetchProjects = useCallback(async (loadMore = false) => {
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
      if (selectedTags.length > 0) params.tags = selectedTags.join(',');
      if (filters.minBudget) params.minBudget = parseFloat(filters.minBudget);
      if (filters.maxBudget) params.maxBudget = parseFloat(filters.maxBudget);

      const response = showMyProjects
        ? await api.getMyProjects(params)
        : await api.getProjects(params);
      
      // Server-side filtering now handles tags
      const filteredItems = response.items;
      
      if (loadMore) {
        setProjects(prev => [...prev, ...filteredItems]);
      } else {
        setProjects(filteredItems);
      }
      
      setHasMore(response.hasMore);
      setContinuationToken(response.continuationToken);

      // Extract unique tags from all projects
      const allTags = new Set<string>();
      response.items.forEach((project: Project) => {
        if (project.tags) {
          project.tags.forEach(tag => allTags.add(tag));
        }
      });
      setAvailableTags(Array.from(allTags).sort());

      // Calculate stats from response metadata if available, otherwise from current page
      if ((response as any).stats) {
        setStats((response as any).stats);
      } else {
        const activeProjects = filteredItems.filter((p: Project) => p.status === 'open').length;
        const totalBudget = filteredItems.reduce((sum: number, p: Project) => {
          // Ensure budget is always treated as a number
          const budget = Number(p.budget);
          return sum + (isNaN(budget) ? 0 : budget);
        }, 0);
        setStats({
          totalProjects: filteredItems.length,
          activeProjects,
          totalBudget
        });
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedSkills, selectedTags, filters.minBudget, filters.maxBudget, showMyProjects, continuationToken]);

  useEffect(() => {
    fetchProjects();
  }, [searchParams, fetchProjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set('keyword', searchTerm);
    if (selectedSkills.length > 0) params.set('skills', selectedSkills.join(','));
    if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSkills([]);
    setSelectedTags([]);
    setFilters({ minBudget: '', maxBudget: '' });
    setSearchParams({});
  };

  const hasActiveFilters = searchTerm || selectedSkills.length > 0 || selectedTags.length > 0 || filters.minBudget || filters.maxBudget;

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
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No projects found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
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
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {isAuthenticated && user?.role === 'employer' ? 'No projects yet' : 'No projects available'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {isAuthenticated && user?.role === 'employer'
                ? 'Start by creating your first project and find the perfect freelancer for your needs.'
                : isAuthenticated
                ? 'Check back soon for new opportunities, or refine your profile to get better matches.'
                : 'Sign up to access exclusive projects and start your freelancing journey.'}
            </p>
            {isAuthenticated && user?.role === 'employer' ? (
              <Button onClick={() => navigate('/projects/new')}>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {showMyProjects ? 'My Projects' : 'Browse Projects'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {showMyProjects
              ? 'Manage your projects, track proposals, and monitor progress'
              : 'Find projects that match your skills and start building your reputation'}
          </p>
        </div>
        {isAuthenticated && user?.role === 'employer' && (
          <Button onClick={() => navigate('/projects/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        )}
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end gap-2">
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

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        data-tour-id="projects-search"
      >
        <Card>
        <form onSubmit={handleSearch}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-400" />
              <input
                type="text"
                placeholder="Search projects by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg pl-10 pr-4 py-2.5 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
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
                    {[searchTerm, ...selectedSkills, ...selectedTags, filters.minBudget, filters.maxBudget].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-border space-y-4">
              {/* Skills Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Required Skills
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
                  {skills.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-500">Loading skills...</p>
                  ) : (
                    skills.map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => toggleSkill(skill.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedSkills.includes(skill.id)
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
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

              {/* Tags Filter */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4" />
                  Project Tags
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
                  {availableTags.length === 0 ? (
                    <p className="text-sm text-gray-600 dark:text-gray-500">No tags available</p>
                  ) : (
                    availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? 'bg-secondary-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        {tag}
                      </button>
                    ))
                  )}
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className="ml-1 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Budget Range */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Min Budget (ETH)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={filters.minBudget}
                      onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })}
                      className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg pl-9 pr-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Budget (ETH)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={filters.maxBudget}
                      onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })}
                      className="w-full bg-white dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded-lg pl-9 pr-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 transition-colors"
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
                  <Card className="cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-300 hover:shadow-lg group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Title and Status */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                            {project.title}
                          </h3>
                          <StatusBadge status={project.status} className="flex-shrink-0" />
                        </div>
                        
                        {/* Description */}
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">
                          {project.description.length > 150
                            ? `${project.description.substring(0, 150)}...`
                            : project.description}
                        </p>
                        
                        {/* Tags */}
                        {project.tags && project.tags.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Tag className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tags:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {project.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" size="sm" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {project.tags.length > 3 && (
                                <Badge variant="default" size="sm" className="text-xs">
                                  +{project.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Skills */}
                        {project.requiredSkills && project.requiredSkills.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <Wrench className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Required Skills:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {project.requiredSkills.slice(0, 4).map((skill, idx) => (
                                <Badge key={skill.skillId || idx} variant="primary" size="sm">
                                  {skill.skillName}
                                </Badge>
                              ))}
                              {project.requiredSkills.length > 4 && (
                                <Badge variant="default" size="sm">
                                  +{project.requiredSkills.length - 4}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <span className="flex items-center gap-1.5 font-semibold text-green-600 dark:text-green-400">
                            <DollarSign className="w-4 h-4" />
                            {project.budget} ETH
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <Clock className="w-4 h-4" />
                            {project.deadline
                              ? format(new Date(project.deadline), 'MMM d, yyyy')
                              : 'No deadline'}
                          </span>
                          {project.proposalCount !== undefined && (
                            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                              <TrendingUp className="w-4 h-4" />
                              {project.proposalCount} proposal{project.proposalCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {project.attachments && project.attachments.length > 0 && (
                            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                              <Paperclip className="w-4 h-4" />
                              {project.attachments.length} file{project.attachments.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex sm:flex-col items-center gap-2 sm:justify-center">
                        <Button size="sm" variant="ghost" className="whitespace-nowrap">
                          View Details
                          <ArrowRight className="w-4 h-4 ml-2" />
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
          <Card className="bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border-primary-200 dark:border-primary-500/20">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ready to Get Started?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
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
  );
}
