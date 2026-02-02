import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, Briefcase, User, AlertCircle } from 'lucide-react';
import { Button, Card, StatusBadge, PageLoader } from '../../components/ui';
import api from '../../lib/api';
import type { Project, FreelancerProfile } from '../../types';

type SearchTab = 'projects' | 'freelancers';

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [activeTab, setActiveTab] = useState<SearchTab>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    setError('');

    try {
      const [projectResults, freelancerResults] = await Promise.all([
        api.searchProjects({ keyword: query }),
        api.searchFreelancers({ keyword: query })
      ]);

      setProjects(projectResults.items || []);
      setFreelancers(freelancerResults.items || []);
    } catch (err: any) {
      setError(err.message || 'Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  const totalResults = projects.length + freelancers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Search Results</h1>
          <p className="text-gray-400">
            {totalResults} {totalResults === 1 ? 'result' : 'results'} for "{query}"
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('projects')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'projects'
              ? 'text-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Projects ({projects.length})
          </div>
          {activeTab === 'projects' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('freelancers')}
          className={`px-6 py-3 font-medium transition-colors relative ${
            activeTab === 'freelancers'
              ? 'text-primary-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Freelancers ({freelancers.length})
          </div>
          {activeTab === 'freelancers' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-400" />
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <Card>
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Results */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          {projects.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Projects Found</h3>
                <p className="text-gray-400">
                  Try adjusting your search terms or browse all projects
                </p>
                <Link to="/projects">
                  <Button variant="primary" className="mt-4">
                    Browse All Projects
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            projects.map((project) => (
              <Card key={project.id} hover>
                <Link to={`/projects/${project.id}`} className="block">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2 hover:text-primary-400 transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-gray-400 line-clamp-2">{project.description}</p>
                      </div>
                      <StatusBadge status={project.status} />
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Budget:</span>
                        <span className="text-primary-400 font-semibold">${project.budget}</span>
                      </div>
                      {project.deadline && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Deadline:</span>
                          <span className="text-white">
                            {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {project.requiredSkills && project.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.requiredSkills.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-500/10 text-primary-400 rounded-full text-xs font-medium"
                          >
                            {skill.skillName}
                          </span>
                        ))}
                        {project.requiredSkills.length > 5 && (
                          <span className="px-3 py-1 bg-white/5 text-gray-400 rounded-full text-xs">
                            +{project.requiredSkills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'freelancers' && (
        <div className="space-y-4">
          {freelancers.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Freelancers Found</h3>
                <p className="text-gray-400">
                  Try adjusting your search terms or browse all freelancers
                </p>
                <Link to="/freelancers">
                  <Button variant="primary" className="mt-4">
                    Browse All Freelancers
                  </Button>
                </Link>
              </div>
            </Card>
          ) : (
            freelancers.map((freelancer) => (
              <Card key={freelancer.id} hover>
                <Link to={`/freelancers/${freelancer.userId}`} className="block">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-2 hover:text-primary-400 transition-colors">
                          {freelancer.name || 'Anonymous'}
                        </h3>
                        <p className="text-gray-400 line-clamp-2">{freelancer.bio}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary-400">
                          ${freelancer.hourlyRate}
                        </div>
                        <div className="text-xs text-gray-400">per hour</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                      <StatusBadge status={freelancer.availability} />
                      {freelancer.nationality && (
                        <span className="text-gray-400">{freelancer.nationality}</span>
                      )}
                    </div>

                    {freelancer.skills && freelancer.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {freelancer.skills.slice(0, 5).map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary-500/10 text-primary-400 rounded-full text-xs font-medium"
                          >
                            {skill.name}
                          </span>
                        ))}
                        {freelancer.skills.length > 5 && (
                          <span className="px-3 py-1 bg-white/5 text-gray-400 rounded-full text-xs">
                            +{freelancer.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
