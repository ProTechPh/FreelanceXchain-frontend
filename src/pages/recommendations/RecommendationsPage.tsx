import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { ProjectRecommendation, FreelancerRecommendation } from '../../types';
import { useAuthStore } from '../../store';
import { Card, Button, Badge, Loader } from '../../components/ui';
import { Link } from 'react-router-dom';
import { FiStar, FiBriefcase, FiRefreshCw, FiArrowRight, FiUser, FiCheck, FiX, FiZap, FiAlertCircle } from 'react-icons/fi';

export function RecommendationsPage() {
  const { user } = useAuthStore();
  const isFreelancer = user?.role === 'freelancer';

  const [projectRecs, setProjectRecs] = useState<ProjectRecommendation[]>([]);
  const [freelancerRecs, setFreelancerRecs] = useState<FreelancerRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations(true);
  }, [isFreelancer]);

  const fetchRecommendations = async (isInitialLoad = false) => {
    console.log('[Recommendations] === FETCH START === isInitialLoad:', isInitialLoad);
    
    // Only set loading on initial load, not on refresh
    if (isInitialLoad) {
      setLoading(true);
      console.log('[Recommendations] Initial load - loading set to true');
    }
    setError(null);
    
    try {
      if (isFreelancer) {
        console.log('[Recommendations] Calling API for project recommendations...');
        const data = await api.getProjectRecommendations();
        console.log('[Recommendations] API responded with:', data?.length || 0, 'recommendations');
        console.log('[Recommendations] Full response:', JSON.stringify(data).substring(0, 500));
        
        if (data) {
          setProjectRecs(data);
          console.log('[Recommendations] State updated with', data.length, 'recommendations');
        } else {
          console.warn('[Recommendations] Received null/undefined data');
          setProjectRecs([]);
        }
      } else {
        // Employer - show placeholder since we need a projectId for freelancer recs
        console.log('[Recommendations] Employer view - clearing recommendations');
        setFreelancerRecs([]);
      }
    } catch (err: any) {
      console.error('[Recommendations] ERROR:', err);
      console.error('[Recommendations] Error message:', err?.message);
      console.error('[Recommendations] Error stack:', err?.stack);
      setError(err?.message || 'Failed to load recommendations');
      // Clear recommendations on error
      setProjectRecs([]);
      setFreelancerRecs([]);
    }
    
    // ALWAYS clear loading state on initial load
    if (isInitialLoad) {
      console.log('[Recommendations] Initial load - setting loading to FALSE');
      setLoading(false);
    }
    console.log('[Recommendations] === FETCH END ===');
  };

  const handleRefresh = async () => {
    console.log('[Recommendations] === REFRESH START ===');
    setRefreshing(true);
    setError(null);
    
    try {
      await fetchRecommendations(false);
    } catch (err) {
      console.error('[Recommendations] Refresh error:', err);
    }
    
    // ALWAYS clear refreshing state
    console.log('[Recommendations] Setting refreshing to FALSE');
    setRefreshing(false);
    console.log('[Recommendations] === REFRESH END ===');
  };

  // Debug logging for render state
  console.log('[Recommendations] Render - loading:', loading, 'projectRecs:', projectRecs.length, 'refreshing:', refreshing);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader size="lg" />
        <div className="text-center">
          <p className="text-gray-700 dark:text-gray-300 font-medium">Loading AI recommendations...</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Analyzing projects and matching with your skills (may take up to 5 minutes)
          </p>
        </div>
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
          <div className="p-4">
            <div className="flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-red-400 font-medium mb-1">Error</h4>
                <p className="text-red-300">{error}</p>
                {error.includes('timed out') && (
                  <div className="mt-3">
                    <p className="text-red-300/80 text-sm mb-2">
                      The AI service is taking longer than usual. This can happen during high load.
                    </p>
                    <Button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      size="sm"
                      variant="outline"
                      className="border-red-400 text-red-400 hover:bg-red-500/20"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Freelancer View - Project Recommendations */}
      {isFreelancer && (
        <div className="space-y-4">
          {projectRecs.length === 0 && !error ? (
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
          ) : !error ? (
            projectRecs.map((rec) => (
              <ProjectRecommendationCard key={rec.projectId} recommendation={rec} />
            ))
          ) : null}
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
