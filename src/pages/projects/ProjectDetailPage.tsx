import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  Clock,
  User,
  Calendar,
  CheckCircle,
  Send,
  AlertTriangle,
  Upload,
  X,
  FileText,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
  XCircle,
  Eye,
  Image as ImageIcon,
  Download
} from 'lucide-react';
import { Card, CardHeader, Button, StatusBadge, Badge, PageLoader } from '../../components/ui';
import { FileUpload } from '../../components/ui/FileUpload';
import { ChatPopup, ChatButton } from '../../components/chat';
import { useAuthStore } from '../../store';
import { useToast } from '../../contexts/ToastContext';
import api from '../../lib/api';
import type { Project, Proposal } from '../../types';
import { format } from 'date-fns';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { success, error } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [myProposal, setMyProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalData, setProposalData] = useState({
    proposedRate: '',
    estimatedDuration: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [milestoneFiles, setMilestoneFiles] = useState<Record<string, File[]>>({});
  const [milestoneNotes, setMilestoneNotes] = useState<Record<string, string>>({});
  const [submittingMilestone, setSubmittingMilestone] = useState<string | null>(null);
  const [processingProposalId, setProcessingProposalId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const MAX_FILES = 5;
  const MAX_FILE_SIZE_MB = 10;
  const MAX_TOTAL_SIZE_MB = 25;
  const ACCEPTED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const ACCEPTED_EXT = ['.pdf', '.doc', '.docx'];

  const validateAndAddFiles = (incoming: FileList | File[]) => {
    setFileError(null);
    const incomingArr = Array.from(incoming);
    const combined = [...uploadedFiles, ...incomingArr];

    if (combined.length > MAX_FILES) {
      setFileError(`You can upload a maximum of ${MAX_FILES} files.`);
      return;
    }

    for (const file of incomingArr) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" is not supported. Only PDF and Word documents are allowed.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        setFileError(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB per-file limit.`);
        return;
      }
    }

    const totalSize = combined.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_MB * 1024 * 1024) {
      setFileError(`Total upload size exceeds the ${MAX_TOTAL_SIZE_MB}MB limit.`);
      return;
    }

    setUploadedFiles(combined);
  };

  const removeFile = (index: number) => {
    setFileError(null);
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const projectData = await api.getProject(id);
      setProject(projectData);

      // If employer, fetch all proposals
      // Backend may return employer_id (snake_case) or employerId (camelCase)
      const employerId = projectData.employerId || projectData.employer_id;
      if (user?.role === 'employer' && user.id === employerId) {
        console.log('[PROPOSALS DEBUG] Fetching proposals for project:', id);
        try {
          const proposalsData = await api.getProjectProposals(id);
          console.log('[PROPOSALS DEBUG] Proposals received:', proposalsData);
          setProposals(proposalsData);
        } catch (error) {
          console.error('[PROPOSALS DEBUG] Error fetching proposals:', error);
        }
      } else {
        console.log('[PROPOSALS DEBUG] Not fetching proposals - not owner or not employer');
      }
      
      // If freelancer, fetch their own proposal for this project
      if (user?.role === 'freelancer') {
        try {
          const myProposalsData = await api.getMyProposals();
          const proposalForThisProject = myProposalsData.find(p => p.projectId === id);
          // Only set myProposal if it's not withdrawn
          if (proposalForThisProject && proposalForThisProject.status !== 'withdrawn') {
            setMyProposal(proposalForThisProject);
          } else {
            setMyProposal(null); // Clear if withdrawn
          }
        } catch (error) {
          console.log('No proposal found for this project');
        }
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, user?.role, user?.id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const projectOwnerUserId = project?.employer?.userId || project?.employerId || project?.employer_id || null;
  const canUseChat = isAuthenticated && !!user?.id && !!projectOwnerUserId && projectOwnerUserId !== user.id;
  const chatPartyName = project?.employer?.companyName || project?.employer?.name || 'Client';

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!canUseChat || !projectOwnerUserId || !user?.id) return;

      try {
        const conversation = await api.findConversationWithUser(projectOwnerUserId);
        if (!conversation) {
          setUnreadCount(0);
          return;
        }

        const count = conversation.participant1_id === user.id
          ? conversation.unread_count_1
          : conversation.unread_count_2;
        setUnreadCount(count);
      } catch (chatError) {
        console.error('Error fetching unread chat count:', chatError);
      }
    };

    fetchUnreadCount();

    const interval = setInterval(() => {
      if (!isChatOpen) {
        fetchUnreadCount();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [canUseChat, isChatOpen, projectOwnerUserId, user?.id]);

  const handleCloseProject = async () => {
    if (!id || actionLoading) return;
    
    setActionLoading(true);
    try {
      // Note: Using 'cancelled' status as 'closed' is not in ProjectStatus type
      await api.updateProject(id, { deadline: project?.deadline || new Date().toISOString() });
      // Refresh the project data
      await fetchData();
      setShowActionsMenu(false);
    } catch (error) {
      console.error('Error closing project:', error);
      alert(error instanceof Error ? error.message : 'Failed to close project');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id || actionLoading) return;
    
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      await api.deleteProject(id);
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete project');
      setActionLoading(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || submitting) return; // Prevent double submission

    // Validate proposal rate against project budget
    const proposedRate = parseFloat(proposalData.proposedRate);
    if (isNaN(proposedRate) || proposedRate <= 0) {
      setFileError('Please enter a valid proposed rate');
      return;
    }
    
    if (project && proposedRate > project.budget) {
      setFileError(`Proposed rate (${proposedRate} ETH) cannot exceed project budget (${project.budget} ETH)`);
      return;
    }

    setSubmitting(true);
    try {
      // First, upload the files if any
      let attachments: Array<{ url: string; filename: string; size: number; mimeType: string }> = [];
      
      if (uploadedFiles.length > 0) {
        console.log('Uploading files:', uploadedFiles.map(f => f.name));
        
        try {
          // Upload files using the API client
          const uploadResults = await api.uploadMultipleFiles(
            uploadedFiles,
            'proposal-attachments',
            `project-${id}`
          );
          
          if (uploadResults.success && uploadResults.files) {
            attachments = uploadResults.files.map((file, index) => ({
              url: file.url,
              filename: file.filename,
              size: uploadedFiles[index].size,
              mimeType: uploadedFiles[index].type,
            }));
            console.log('Files uploaded successfully:', attachments);
          } else {
            // Provide specific error message
            const fileNames = uploadedFiles.map(f => f.name).join(', ');
            throw new Error(`Failed to upload files: ${fileNames}. Please check file size and format.`);
          }
        } catch (uploadError) {
          // Enhance error message with file details
          const fileNames = uploadedFiles.map(f => f.name).join(', ');
          const errorMsg = uploadError instanceof Error ? uploadError.message : 'Unknown error';
          throw new Error(`File upload error (${fileNames}): ${errorMsg}`);
        }
      }

      // Then submit the proposal with the uploaded file URLs
      const submittedProposal = await api.submitProposal({
        projectId: id,
        coverLetter: '',
        proposedRate,
        estimatedDuration: parseInt(proposalData.estimatedDuration, 10),
        attachments, // This will be an empty array if no files uploaded, which is now valid
      });
      
      // Update the myProposal state with the newly submitted proposal
      setMyProposal(submittedProposal);
      
      setShowProposalForm(false);
      setProposalData({ proposedRate: '', estimatedDuration: '' });
      setUploadedFiles([]);
      setFileError(null);
      // Show success message or redirect
    } catch (error) {
      console.error('Error submitting proposal:', error);
      setFileError(error instanceof Error ? error.message : 'Failed to submit proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitMilestone = async (milestoneId: string) => {
    try {
      setSubmittingMilestone(milestoneId);
      const files = milestoneFiles[milestoneId] || [];
      const notes = milestoneNotes[milestoneId] || '';
      const milestone = project?.milestones?.find((m) => m.id === milestoneId);
      const existingDeliverables = milestone?.deliverableFiles || (milestone as any)?.attachments || [];
      
      if (files.length === 0) {
        error('Please upload at least one deliverable file', 'Error');
        return;
      }
      
      await api.submitMilestoneWithFiles(milestoneId, files, notes, existingDeliverables);
      
      success('Milestone submitted successfully!', 'Success');
      
      // Clear files and notes
      setMilestoneFiles(prev => {
        const updated = { ...prev };
        delete updated[milestoneId];
        return updated;
      });
      setMilestoneNotes(prev => {
        const updated = { ...prev };
        delete updated[milestoneId];
        return updated;
      });
      
      // Refresh project data
      await fetchData();
    } catch (err: any) {
      error(err.message || 'Failed to submit milestone', 'Error');
    } finally {
      setSubmittingMilestone(null);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    if (processingProposalId) return;
    
    setProcessingProposalId(proposalId);
    try {
      await api.acceptProposal(proposalId);
      success('Proposal accepted successfully!', 'Success');
      
      // Refresh project data to show updated status
      await fetchData();
    } catch (err: any) {
      console.error('Error accepting proposal:', err);
      
      // Show specific error messages based on error code
      if (err.code === 'CSRF_VALIDATION_FAILED') {
        error('Security token expired. Please refresh the page and try again.', 'Error');
      } else if (err.code === 'KYC_REQUIRED') {
        error('Identity verification is required. Please complete KYC verification first.', 'KYC Required');
      } else if (err.code === 'AUTH_FORBIDDEN') {
        error('Only employers can accept proposals.', 'Permission Denied');
      } else if (err.code === 'UNAUTHORIZED') {
        error('You are not authorized to accept proposals for this project.', 'Unauthorized');
      } else if (err.code === 'NO_MILESTONES') {
        error('Project must have milestones defined before accepting a proposal.', 'Milestones Required');
      } else if (err.code === 'AMOUNT_MISMATCH') {
        error('Proposal rate must match the total project milestone amount.', 'Amount Mismatch');
      } else {
        error(err.message || 'Failed to accept proposal. Please try again.', 'Error');
      }
    } finally {
      setProcessingProposalId(null);
    }
  };

  const handleRejectProposal = async (proposalId: string) => {
    if (processingProposalId) return;
    
    if (!confirm('Are you sure you want to reject this proposal?')) {
      return;
    }
    
    setProcessingProposalId(proposalId);
    try {
      await api.rejectProposal(proposalId);
      success('Proposal rejected.', 'Success');
      
      // Refresh project data
      await fetchData();
    } catch (err: any) {
      console.error('Error rejecting proposal:', err);
      error(err.message || 'Failed to reject proposal. Please try again.', 'Error');
    } finally {
      setProcessingProposalId(null);
    }
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl text-gray-900 dark:text-white">Project not found</h2>
        <Link to="/projects">
          <Button variant="outline" className="mt-4">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  // Note: Backend returns employer_id (snake_case) but type expects employerId (camelCase)
  const employerId = project.employerId || (project as any).employer_id;
  const isOwner = user?.role === 'employer' && user.id === employerId;
  const isFreelancer = user?.role === 'freelancer';
  const canApply = isFreelancer && project.status === 'open';

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between gap-4">
        <Link to="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Projects
          </Button>
        </Link>
        
        {/* Employer Actions Menu */}
        {isOwner && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="gap-2"
            >
              <MoreVertical className="w-4 h-4" />
              Actions
            </Button>
            
            {showActionsMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowActionsMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-surface rounded-lg shadow-lg border border-gray-200 dark:border-dark-border z-20 py-1">
                  {project?.status === 'draft' && (
                    <Link
                      to={`/projects/${project.id}/edit`}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                      onClick={() => setShowActionsMenu(false)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit Project
                    </Link>
                  )}
                  <Link
                    to={`/projects/${project?.id}`}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                    onClick={() => setShowActionsMenu(false)}
                  >
                    <Eye className="w-4 h-4" />
                    View Proposals
                  </Link>
                  {project?.status === 'open' && (
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleCloseProject}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4" />
                      {actionLoading ? 'Closing...' : 'Close Project'}
                    </button>
                  )}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors border-t border-gray-200 dark:border-dark-border disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleDeleteProject}
                    disabled={actionLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                    {actionLoading ? 'Deleting...' : 'Delete Project'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{project.title}</h1>
                <StatusBadge status={project.status} className="text-base px-4 py-1.5" />
              </div>
              
              {/* Project Meta Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Posted {project.createdAt ? format(new Date(project.createdAt), 'MMM d, yyyy') : 'Recently'}
                </span>
                {project.proposalCount !== undefined && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {project.proposalCount} {project.proposalCount === 1 ? 'Proposal' : 'Proposals'}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  {project.budget} ETH Budget
                </span>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{project.description}</p>
            </div>
          </Card>

          {/* Project Attachments */}
          {project.attachments && project.attachments.length > 0 && (() => {
            const images = project.attachments.filter(a => a.mimeType.startsWith('image/'));
            const files = project.attachments.filter(a => !a.mimeType.startsWith('image/'));
            
            return (
              <Card>
                <CardHeader
                  title="Project Attachments"
                  description={`${project.attachments.length} reference file${project.attachments.length > 1 ? 's' : ''} provided by the employer`}
                />
                
                <div className="space-y-6">
                  {/* Image Gallery */}
                  {images.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" />
                        Images ({images.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {images.map((image, idx) => (
                          <a
                            key={idx}
                            href={image.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-all"
                          >
                            <img
                              src={image.url}
                              alt={image.filename}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                              <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                              <p className="text-xs text-white truncate">{image.filename}</p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* File List */}
                  {files.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Documents ({files.length})
                      </h4>
                      <div className="space-y-2">
                        {files.map((file, idx) => (
                          <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-dark-surface rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors group"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="w-5 h-5 text-primary-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {file.filename}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatBytes(file.size)} • {file.mimeType}
                                </p>
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-gray-400 group-hover:text-primary-500 flex-shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            );
          })()}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <Card>
              <CardHeader title="Tags" />
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag, idx) => (
                  <Badge key={idx} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

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
              <CardHeader
                title="Project Milestones"
                description={`${project.milestones.length} milestone${project.milestones.length !== 1 ? 's' : ''} • Total: ${project.budget} ETH`}
              />
              <div className="space-y-3">
                {project.milestones.map((milestone, index) => {
                  const statusColors = {
                    pending: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700',
                    in_progress: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
                    submitted: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
                    approved: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
                    rejected: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
                    disputed: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
                    completed: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
                    refunded: 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700'
                  };
                  
                  return (
                    <div
                      key={milestone.id}
                      className={`flex items-start gap-4 p-4 rounded-lg border-2 transition-all ${statusColors[milestone.status] || statusColors.pending}`}
                    >
                      <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{milestone.title}</h4>
                          <StatusBadge status={milestone.status} className="flex-shrink-0" />
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 leading-relaxed">{milestone.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm mb-3">
                          <span className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-400">
                            <DollarSign className="w-4 h-4" />
                            {milestone.amount} ETH
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {milestone.dueDate
                              ? format(new Date(milestone.dueDate), 'MMM d, yyyy')
                              : 'No deadline'}
                          </span>
                          {milestone.deliverableFiles && milestone.deliverableFiles.length > 0 && (
                            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                              <FileText className="w-4 h-4" />
                              {milestone.deliverableFiles.length} file{milestone.deliverableFiles.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        {/* Milestone Deliverables Display */}
                        {milestone.deliverableFiles && milestone.deliverableFiles.length > 0 && (() => {
                          const images = milestone.deliverableFiles.filter(f => f.mimeType.startsWith('image/'));
                          const files = milestone.deliverableFiles.filter(f => !f.mimeType.startsWith('image/'));
                          
                          return (
                            <div className="mt-4 space-y-3">
                              {images.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    Images ({images.length})
                                  </h5>
                                  <div className="grid grid-cols-3 gap-2">
                                    {images.map((image, idx) => (
                                      <a
                                        key={idx}
                                        href={image.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-dark-surface border border-gray-200 dark:border-dark-border hover:border-primary-500 transition-all"
                                      >
                                        <img
                                          src={image.url}
                                          alt={image.filename}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                                          <Eye className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {files.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5" />
                                    Documents ({files.length})
                                  </h5>
                                  <div className="space-y-1">
                                    {files.map((file, idx) => (
                                      <a
                                        key={idx}
                                        href={file.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 bg-white dark:bg-dark-bg rounded hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors text-xs group"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
                                        <span className="flex-1 truncate text-gray-900 dark:text-gray-100">
                                          {file.filename}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {formatBytes(file.size)}
                                        </span>
                                        <Download className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary-500 flex-shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* File Upload for Pending/In Progress Milestones (Freelancer Only) */}
                        {(milestone.status === 'pending' || milestone.status === 'in_progress' || milestone.status === 'rejected') &&
                         user?.role === 'freelancer' &&
                         project.status === 'in_progress' && (
                          <div className="mt-4 p-4 bg-white dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border">
                            <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                              Submit Deliverables
                            </h5>
                            
                            <FileUpload
                              maxFiles={10}
                              maxSizeMB={25}
                              acceptedTypes={[
                                '.pdf', '.doc', '.docx', '.xlsx', '.pptx', '.txt', '.csv',
                                '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
                                '.zip', '.rar', '.7z',
                                '.html', '.css', '.js', '.json', '.xml',
                                '.mp4', '.webm', '.mov'
                              ]}
                              onFilesChange={(files) => setMilestoneFiles({
                                ...milestoneFiles,
                                [milestone.id]: files
                              })}
                              files={milestoneFiles[milestone.id] || []}
                              disabled={submittingMilestone === milestone.id}
                              label="Upload Files"
                              helperText="Max 10 files, 25MB per file. Documents, Images, Archives, Code, Videos"
                            />
                            
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Submission Notes (Optional)
                              </label>
                              <textarea
                                value={milestoneNotes[milestone.id] || ''}
                                onChange={(e) => setMilestoneNotes({
                                  ...milestoneNotes,
                                  [milestone.id]: e.target.value
                                })}
                                className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                                rows={2}
                                placeholder="Add any notes about your submission..."
                                disabled={submittingMilestone === milestone.id}
                              />
                            </div>
                            
                            <Button
                              onClick={() => handleSubmitMilestone(milestone.id)}
                              disabled={!milestoneFiles[milestone.id] || milestoneFiles[milestone.id].length === 0 || submittingMilestone === milestone.id}
                              className="mt-3 w-full sm:w-auto"
                              size="sm"
                            >
                              {submittingMilestone === milestone.id ? (
                                <>
                                  <Upload className="w-4 h-4 animate-pulse" />
                                  Submitting...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4" />
                                  Submit Milestone
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
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
                  <Link to={`/projects/${project.id}/proposals`} className="text-primary-600 dark:text-primary-400 text-sm hover:underline">
                    View All
                  </Link>
                }
              />
              <div className="space-y-4">
                {proposals.slice(0, 5).map((proposal) => (
                  <div key={proposal.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-dark-bg rounded-lg border border-gray-200 dark:border-dark-border hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-600/20 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {proposal.freelancer?.name || 'Freelancer'}
                        </h4>
                        <StatusBadge status={proposal.status} />
                      </div>
                      {proposal.coverLetter && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-2">{proposal.coverLetter}</p>
                      )}
                      
                      {/* Attachments Preview */}
                      {proposal.attachments && proposal.attachments.length > 0 && (
                        <div className="mb-2 p-2 bg-white dark:bg-dark-surface rounded border border-gray-200 dark:border-dark-border">
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                            Attachments ({proposal.attachments.length})
                          </p>
                          <div className="space-y-1">
                            {proposal.attachments.slice(0, 2).map((attachment, idx) => (
                              <a
                                key={idx}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                              >
                                <FileText className="w-3 h-3" />
                                <span className="truncate">{attachment.filename}</span>
                              </a>
                            ))}
                            {proposal.attachments.length > 2 && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                +{proposal.attachments.length - 2} more file{proposal.attachments.length - 2 > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            {proposal.proposedRate} ETH
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {proposal.estimatedDuration} days
                          </span>
                        </div>
                        
                        {/* Action buttons for pending proposals */}
                        {proposal.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => handleAcceptProposal(proposal.id)}
                              disabled={processingProposalId === proposal.id}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {processingProposalId === proposal.id ? (
                                'Processing...'
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4" />
                                  Accept
                                </>
                              )}
                            </Button>
                            <Button 
                              onClick={() => handleRejectProposal(proposal.id)}
                              disabled={processingProposalId === proposal.id}
                              variant="outline" 
                              size="sm"
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                            <Link to={`/projects/${project.id}/proposals/${proposal.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <Link to={`/projects/${project.id}/proposals/${proposal.id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* My Submitted Proposal (for freelancers) */}
          {myProposal && (
            <Card>
              <CardHeader title="Your Proposal" description="You have already submitted a proposal for this project" />
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-bg rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={myProposal.status} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Submitted {myProposal.createdAt ? format(new Date(myProposal.createdAt), 'MMM d, yyyy') : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Proposed Rate:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{myProposal.proposedRate} ETH</span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="ml-2 font-medium text-gray-900 dark:text-white">{myProposal.estimatedDuration} days</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Attachments */}
                {myProposal.attachments && myProposal.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Attachments ({myProposal.attachments.length})</h4>
                    <ul className="space-y-2">
                      {myProposal.attachments.map((attachment: { url: string; filename: string; size: number; mimeType: string }, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-dark-border/30 border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                            <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{attachment.filename}</span>
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                              {formatBytes(attachment.size || 0)}
                            </span>
                          </div>
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 dark:text-primary-400 hover:underline text-sm flex-shrink-0"
                          >
                            View
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Apply Form */}
          {canApply && !myProposal && (
            <Card>
              {!showProposalForm ? (
                <div className="text-center py-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Interested in this project?</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Submit a proposal to get started</p>
                  <Button onClick={() => setShowProposalForm(true)}>
                    <Send className="w-4 h-4" />
                    Submit Proposal
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmitProposal}>
                  <CardHeader title="Submit Proposal" />
                  <div className="space-y-4">
                    {/* File Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Proposal Documents (Optional)
                        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">
                          PDF or Word · max {MAX_FILES} files · {MAX_FILE_SIZE_MB}MB each · {MAX_TOTAL_SIZE_MB}MB total
                        </span>
                      </label>

                      {/* Drop Zone */}
                      <div
                        className={`relative border-2 border-dashed rounded-lg px-6 py-8 text-center transition-colors cursor-pointer ${
                          isDragging
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-dark-border hover:border-primary-400 dark:hover:border-primary-500 bg-white dark:bg-dark-bg'
                        }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          validateAndAddFiles(e.dataTransfer.files);
                        }}
                        onClick={() => document.getElementById('proposal-file-input')?.click()}
                      >
                        <input
                          id="proposal-file-input"
                          type="file"
                          multiple
                          accept={ACCEPTED_EXT.join(',')}
                          className="hidden"
                          onChange={(e) => e.target.files && validateAndAddFiles(e.target.files)}
                        />
                        <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Drag &amp; drop files here or <span className="text-primary-600 dark:text-primary-400">browse</span>
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          Supported: .pdf, .doc, .docx
                        </p>
                      </div>

                      {/* Error */}
                      {fileError && (
                        <div className="flex items-center gap-2 mt-2 text-red-600 dark:text-red-400 text-sm">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{fileError}</span>
                        </div>
                      )}

                      {/* File List */}
                      {uploadedFiles.length > 0 && (
                        <ul className="mt-3 space-y-2">
                          {uploadedFiles.map((file, idx) => (
                            <li
                              key={idx}
                              className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-dark-border/30 border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{file.name}</span>
                                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{formatBytes(file.size)}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 flex-shrink-0 transition-colors"
                                aria-label="Remove file"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Counter */}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                        {uploadedFiles.length}/{MAX_FILES} files &nbsp;·&nbsp;
                        {formatBytes(uploadedFiles.reduce((s, f) => s + f.size, 0))} / {MAX_TOTAL_SIZE_MB}MB
                      </p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Proposed Rate (ETH) *
                          <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                            Max: {project.budget} ETH
                          </span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max={project.budget}
                          value={proposalData.proposedRate}
                          onChange={(e) => setProposalData({ ...proposalData, proposedRate: e.target.value })}
                          required
                          className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Estimated Duration (days) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={proposalData.estimatedDuration}
                          onChange={(e) => setProposalData({ ...proposalData, estimatedDuration: e.target.value })}
                          required
                          className="w-full bg-white dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-lg px-4 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                          placeholder="30"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" disabled={submitting}>
                        {submitting ? 'Submitting...' : 'Submit Proposal'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={() => { setShowProposalForm(false); setUploadedFiles([]); setFileError(null); }}>
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
              <AlertTriangle className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Want to apply?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Sign in or create an account to submit a proposal</p>
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
                <span className="text-gray-600 dark:text-gray-400">Budget</span>
                <span className="text-gray-900 dark:text-white font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                  {project.budget} ETH
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Deadline</span>
                <span className="text-gray-900 dark:text-white flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {project.deadline 
                    ? format(new Date(project.deadline), 'MMM d, yyyy')
                    : 'No deadline'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Posted</span>
                <span className="text-gray-900 dark:text-white">
                  {project.createdAt
                    ? format(new Date(project.createdAt), 'MMM d, yyyy')
                    : 'Recently'}
                </span>
              </div>
              {project.proposalCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Proposals</span>
                  <span className="text-gray-900 dark:text-white">{project.proposalCount}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Employer Info */}
          <Card>
            <CardHeader title="About the Client" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 dark:bg-primary-600/20 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {project.employer?.companyName || 'Company Name'}
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {project.employer?.industry || 'Technology'}
                </p>
              </div>
            </div>
            {project.employer?.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-4">{project.employer.description}</p>
            )}
          </Card>

          {/* Safety Tips */}
          <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/30">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-amber-700 dark:text-amber-400 font-medium mb-1">Secure Payments</h4>
                <p className="text-amber-700 dark:text-amber-200/80 text-sm">
                  All payments are held in smart contract escrow until milestones are approved.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {canUseChat && projectOwnerUserId && (
        <>
          <ChatButton
            onClick={() => {
              setIsChatOpen(true);
              setIsChatMinimized(false);
            }}
            unreadCount={unreadCount}
            isOpen={isChatOpen}
          />
          <ChatPopup
            contractId={project.id}
            otherPartyId={projectOwnerUserId}
            otherPartyName={chatPartyName}
            otherPartyRole="Client"
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            onMinimize={() => setIsChatMinimized(!isChatMinimized)}
            isMinimized={isChatMinimized}
            onUnreadCountChange={setUnreadCount}
          />
        </>
      )}
    </div>
  );
}
