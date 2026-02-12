import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Users, Search, Filter, MapPin, Briefcase } from 'lucide-react';
import { Card, Button, Input, PageLoader, StatusBadge } from '../../components/ui';
import api from '../../lib/api';
import type { FreelancerProfile } from '../../types';

export function FreelancerListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    minRate: '',
    maxRate: '',
    availability: '',
    skills: [] as string[],
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const freelancerData = searchParams.get('q')
        ? await api.searchFreelancers({ keyword: searchParams.get('q')! })
        : await api.searchFreelancers({});
      
      setFreelancers(freelancerData.items || []);
    } catch (error) {
      console.error('Error loading freelancers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery });
    } else {
      setSearchParams({});
    }
  };

  const filteredFreelancers = freelancers.filter((freelancer) => {
    if (filters.minRate && freelancer.hourlyRate < parseFloat(filters.minRate)) {
      return false;
    }
    if (filters.maxRate && freelancer.hourlyRate > parseFloat(filters.maxRate)) {
      return false;
    }
    if (filters.availability && freelancer.availability !== filters.availability) {
      return false;
    }
    if (filters.skills.length > 0) {
      const freelancerSkills = freelancer.skills?.map(s => s.name) || [];
      if (!filters.skills.some(skillName => freelancerSkills.includes(skillName))) {
        return false;
      }
    }
    return true;
  });

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-400" />
            Browse Freelancers
          </h1>
          <p className="text-gray-400">
            {filteredFreelancers.length} {filteredFreelancers.length === 1 ? 'freelancer' : 'freelancers'} available
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <Card>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, skills, or bio..."
                  className="w-full pl-12 pr-4 py-3 bg-dark-bg border border-white/10 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                />
              </div>
            </div>
            <Button type="submit" variant="primary">
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <Input
                label="Min Hourly Rate ($)"
                type="number"
                value={filters.minRate}
                onChange={(e) => setFilters({ ...filters, minRate: e.target.value })}
                placeholder="0"
              />
              <Input
                label="Max Hourly Rate ($)"
                type="number"
                value={filters.maxRate}
                onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                placeholder="1000"
              />
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Availability
                </label>
                <select
                  value={filters.availability}
                  onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-bg border border-white/10 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">All</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          )}
        </form>
      </Card>

      {/* Freelancer Grid */}
      {filteredFreelancers.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Freelancers Found</h3>
            <p className="text-gray-400">
              Try adjusting your search or filters
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFreelancers.map((freelancer) => (
            <Card key={freelancer.id} hover>
              <Link to={`/freelancers/${freelancer.userId}`} className="block space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1 hover:text-primary-400 transition-colors">
                      {freelancer.name || 'Anonymous'}
                    </h3>
                    {freelancer.nationality && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="w-4 h-4" />
                        {freelancer.nationality}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary-400">
                      ${freelancer.hourlyRate}
                    </div>
                    <div className="text-xs text-gray-400">per hour</div>
                  </div>
                </div>

                {/* Bio */}
                {freelancer.bio && (
                  <p className="text-gray-400 line-clamp-2">{freelancer.bio}</p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 text-sm">
                  <StatusBadge status={freelancer.availability} />
                  {freelancer.experience && freelancer.experience.length > 0 && (
                    <div className="flex items-center gap-1 text-gray-400">
                      <Briefcase className="w-4 h-4" />
                      {freelancer.experience.length} {freelancer.experience.length === 1 ? 'project' : 'projects'}
                    </div>
                  )}
                </div>

                {/* Skills */}
                {freelancer.skills && freelancer.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {freelancer.skills.slice(0, 6).map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-500/10 text-primary-400 rounded-full text-xs font-medium"
                      >
                        {skill.name}
                      </span>
                    ))}
                    {freelancer.skills.length > 6 && (
                      <span className="px-3 py-1 bg-white/5 text-gray-400 rounded-full text-xs">
                        +{freelancer.skills.length - 6} more
                      </span>
                    )}
                  </div>
                )}

                {/* CTA */}
                <div className="pt-4 border-t border-white/10">
                  <Button variant="primary" size="sm" className="w-full">
                    View Profile
                  </Button>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
