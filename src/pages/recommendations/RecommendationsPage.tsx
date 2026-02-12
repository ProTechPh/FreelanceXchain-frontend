import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { ProjectRecommendation, FreelancerRecommendation } from '../../types';
import { useAuthStore } from '../../store';
import { Card, Button, Badge, Loader } from '../../components/ui';
import { Link } from 'react-router-dom';
import { FiStar, FiBriefcase, FiRefreshCw, FiArrowRight, FiUser, FiCheck, FiX, FiZap } from 'react-icons/fi';

export function RecommendationsPage() {
  const { user } = useAuthStore();
  const isFreelancer = user?.role === 'freelancer';

  const [projectRecs, setProjectRecs] = useState<ProjectRecommendation[]>([]);
  const [freelancerRecs, setFreelancerRecs] = useState<FreelancerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, [isFreelancer]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isFreelancer) {
        const data = await api.getProjectRecommendations();
        setProjectRecs(data);
      } else {
        // Employer - show placeholder since we need a projectId for freelancer recs
        setFreelancerRecs([]);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRecommendations();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-tour-id="recommendations-main">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isFreelancer ? 'Project Recommendations' : 'Freelancer Recommendations'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isFreelancer
              ? 'AI-powered project matches based on your skills and experience'
              : 'Find the best freelancers for your projects'
            }
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="bg-red-500/10 border-red-500/30">
          <div className="p-4 text-red-400">{error}</div>
        </Card>
      )}

      {/* Freelancer View - Project Recommendations */}
      {isFreelancer && (
        <div className="space-y-4">
          {projectRecs.length === 0 ? (
            <Card>
              <div className="p-8 text-center">
                <FiBriefcase className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Recommendations Yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Complete your profile and add more skills to get personalized project recommendations.
                </p>
                <Link to="/profile">
                  <Button>Update Profile</Button>
                </Link>
              </div>
            </Card>
          ) : (
            projectRecs.map((rec) => (
              <ProjectRecommendationCard key={rec.projectId} recommendation={rec} />
            ))
          )}
        </div>
      )}

      {/* Employer View - Freelancer Recommendations */}
      {!isFreelancer && (
        <div className="space-y-4">
          <Card>
            <div className="p-8 text-center">
              <FiUser className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Get Freelancer Recommendations</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create a project to get AI-powered freelancer recommendations tailored to your needs.
              </p>
              <Link to="/projects/new">
                <Button>Create Project</Button>
              </Link>
            </div>
          </Card>
          
          {freelancerRecs.length > 0 && (
            freelancerRecs.map((rec) => (
              <FreelancerRecommendationCard key={rec.freelancerId} recommendation={rec} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ProjectRecommendationCard({ recommendation }: { recommendation: ProjectRecommendation }) {
  const { projectId, matchScore, matchedSkills, missingSkills, reasoning } = recommendation;

  return (
    <Card className="hover:border-primary-500/50 transition-colors">
      <div className="p-6">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <FiZap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Project Match</span>
              <Badge variant="success" className="flex items-center gap-1">
                <FiStar className="w-3 h-3" />
                {Math.round(matchScore * 100)}% Match
              </Badge>
            </div>
            
            {/* Reasoning */}
            <p className="text-gray-600 dark:text-gray-400 mb-4">{reasoning}</p>
            
            {/* Matched Skills */}
            {matchedSkills.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-green-400 mb-2">
                  <FiCheck className="w-4 h-4" />
                  <span>Matched Skills</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchedSkills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="success" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Missing Skills */}
            {missingSkills.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-amber-400 mb-2">
                  <FiX className="w-4 h-4" />
                  <span>Skills to Develop</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill: string, idx: number) => (
                    <Badge key={idx} variant="warning" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <Link to={`/projects/${projectId}`}>
            <Button variant="outline" className="flex items-center gap-2">
              View Project <FiArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

function FreelancerRecommendationCard({ recommendation }: { recommendation: FreelancerRecommendation }) {
  const { freelancerId, matchScore, reputationScore, combinedScore, matchedSkills, reasoning } = recommendation;

  return (
    <Card className="hover:border-primary-500/50 transition-colors">
      <div className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar Placeholder */}
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-dark-card border border-gray-200 dark:border-dark-border flex items-center justify-center">
            <FiUser className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-lg font-semibold text-gray-900 dark:text-white">Freelancer Match</span>
              <Badge variant="success" className="flex items-center gap-1">
                <FiStar className="w-3 h-3" />
                {Math.round(combinedScore * 100)}% Match
              </Badge>
            </div>
            
            {/* Scores */}
            <div className="flex gap-4 mb-3 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Match Score: <span className="text-primary-600 dark:text-primary-400">{Math.round(matchScore * 100)}%</span>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Reputation: <span className="text-yellow-600 dark:text-yellow-400">{Math.round(reputationScore * 100)}%</span>
              </span>
            </div>
            
            {/* Reasoning */}
            <p className="text-gray-600 dark:text-gray-400 mb-3">{reasoning}</p>
            
            {/* Matched Skills */}
            {matchedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {matchedSkills.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="info" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          
          <Link to={`/freelancers/${freelancerId}`}>
            <Button variant="outline" className="flex items-center gap-2">
              View Profile <FiArrowRight />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
