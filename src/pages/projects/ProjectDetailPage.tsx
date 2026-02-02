import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  DollarSign, 
  Clock, 
  User,
  Calendar,
  CheckCircle,
  Send,
  AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, Button, StatusBadge, Badge, PageLoader } from '../../components/ui';
import { useAuthStore } from '../../store';
import api from '../../lib/api';
import type { Project, Proposal } from '../../types';
import { format } from 'date-fns';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({
    coverLetter: '',
    proposedRate: '',
    estimatedDuration: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const projectData = await api.getProject(id);
        setProject(projectData);

        // If employer, fetch proposals
        if (user?.role === 'employer' && user.id === projectData.employerId) {
          const proposalsData = await api.getProjectProposals(id);
          setProposals(proposalsData);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
        navigate('/projects');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmitting(true);
    try {
      await api.submitProposal({
        projectId: id,
        coverLetter: proposalData.coverLetter,
        proposedRate: parseFloat(proposalData.proposedRate),
        estimatedDuration: parseInt(proposalData.estimatedDuration, 10),
      });
      setShowProposalForm(false);
      setProposalData({ coverLetter: '', proposedRate: '', estimatedDuration: '' });
      // Show success message or redirect
    } catch (error) {
      console.error('Error submitting proposal:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-white">Project not found</h2>
        <Link to="/projects">
          <Button variant="outline" className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const isOwner = user?.role === 'employer' && user.id === project.employerId;
  const isFreelancer = user?.role === 'freelancer';
  const canApply = isFreelancer && project.status === 'open';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{project.title}</h1>
                <StatusBadge status={project.status} />
              </div>
              {isOwner && project.status === 'draft' && (
                <Link to={`/projects/${project.id}/edit`}>
                  <Button variant="outline">Edit Project</Button>
                </Link>
              )}
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-300 whitespace-pre-wrap">{project.description}</p>
            </div>
          </Card>

          {/* Skills */}
          {project.requiredSkills && project.requiredSkills.length > 0 && (
            <Card>
              <CardHeader title="Required Skills" />
              <div className="flex flex-wrap gap-2">
                {project.requiredSkills.map((skill, idx) => (
                  <Badge key={skill.skillId || idx} variant="primary">
                    {skill.skillName}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Milestones */}
          {project.milestones && project.milestones.length > 0 && (
            <Card>
              <CardHeader title="Milestones" description={`${project.milestones.length} milestones`} />
              <div className="space-y-4">
                {project.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="flex items-start gap-4 p-4 bg-dark-bg rounded-lg">
                    <div className="w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center text-primary-400 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-white">{milestone.title}</h4>
                        <StatusBadge status={milestone.status} />
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{milestone.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          {milestone.amount} ETH
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {milestone.dueDate
                            ? format(new Date(milestone.dueDate), 'MMM d, yyyy')
                            : 'No date'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Proposals (for employer) */}
          {isOwner && proposals.length > 0 && (
            <Card>
              <CardHeader 
                title="Proposals" 
                description={`${proposals.length} proposals received`}
                action={
                  <Link to={`/projects/${project.id}/proposals`} className="text-primary-400 text-sm">
                    View All
                  </Link>
                }
              />
              <div className="space-y-4">
                {proposals.slice(0, 5).map((proposal) => (
                  <div key={proposal.id} className="flex items-start gap-4 p-4 bg-dark-bg rounded-lg">
                    <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-white">
                          {proposal.freelancer?.name || 'Freelancer'}
                        </h4>
                        <StatusBadge status={proposal.status} />
                      </div>
                      <p className="text-gray-400 text-sm line-clamp-2">{proposal.coverLetter}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span>{proposal.proposedRate} ETH</span>
                        <span>{proposal.estimatedDuration} days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Apply Form */}
          {canApply && (
            <Card>
              {!showProposalForm ? (
                <div className="text-center py-6">
                  <h3 className="text-lg font-semibold text-white mb-2">Interested in this project?</h3>
                  <p className="text-gray-400 mb-4">Submit a proposal to get started</p>
                  <Button onClick={() => setShowProposalForm(true)}>
                    <Send className="w-4 h-4" />
                    Submit Proposal
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitProposal}>
                  <CardHeader title="Submit Proposal" />
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Cover Letter *
                      </label>
                      <textarea
                        value={proposalData.coverLetter}
                        onChange={(e) => setProposalData({ ...proposalData, coverLetter: e.target.value })}
                        rows={5}
                        required
                        className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                        placeholder="Explain why you're a great fit for this project..."
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Proposed Rate (ETH) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={proposalData.proposedRate}
                          onChange={(e) => setProposalData({ ...proposalData, proposedRate: e.target.value })}
                          required
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Estimated Duration (days) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={proposalData.estimatedDuration}
                          onChange={(e) => setProposalData({ ...proposalData, estimatedDuration: e.target.value })}
                          required
                          className="w-full bg-dark-bg border border-dark-border rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                          placeholder="30"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Proposal'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => setShowProposalForm(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              )}
            </Card>
          )}

          {!isAuthenticated && project.status === 'open' && (
            <Card className="text-center py-6">
              <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Want to apply?</h3>
              <p className="text-gray-400 mb-4">Sign in or create an account to submit a proposal</p>
              <div className="flex gap-3 justify-center">
                <Link to="/login">
                  <Button>Sign In</Button>
                </Link>
                <Link to="/register">
                  <Button variant="outline">Register</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <Card>
            <CardHeader title="Project Details" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Budget</span>
                <span className="text-white font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  {project.budget} ETH
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Deadline</span>
                <span className="text-white flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-400" />
                  {project.deadline 
                    ? format(new Date(project.deadline), 'MMM d, yyyy')
                    : 'No deadline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Posted</span>
                <span className="text-white">
                  {project.createdAt
                    ? format(new Date(project.createdAt), 'MMM d, yyyy')
                    : 'Unknown'}
                </span>
              </div>
              {project.proposalCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Proposals</span>
                  <span className="text-white">{project.proposalCount}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Employer Info */}
          <Card>
            <CardHeader title="About the Client" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-600/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-400" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {project.employer?.companyName || 'Company Name'}
                </p>
                <p className="text-gray-400 text-sm">
                  {project.employer?.industry || 'Technology'}
                </p>
              </div>
            </div>
            {project.employer?.description && (
              <p className="text-gray-400 text-sm mt-4">{project.employer.description}</p>
            )}
          </Card>

          {/* Safety Tips */}
          <Card className="bg-amber-900/20 border-amber-700/30">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-400 font-medium mb-1">Secure Payments</h4>
                <p className="text-amber-200/80 text-sm">
                  All payments are held in smart contract escrow until milestones are approved.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
