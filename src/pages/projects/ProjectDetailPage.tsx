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
  AlertTriangle,
  Upload,
  X,
  FileText,
  AlertCircle,
  ChevronRight,
  Edit,
  Trash2,
  MoreVertical,
  XCircle,
  Eye
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

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const projectData = await api.getProject(id);
        setProject(projectData);

        // If employer, fetch all proposals
        // Note: Backend returns employer_id (snake_case) but type expects employerId (camelCase)
        const employerId = projectData.employerId || (projectData as any).employer_id;
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
    };

    fetchData();
  }, [id, user, navigate]);

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSubmitting(true);
    try {
      // First, upload the files if any
      let attachments: Array<{ url: string; filename: string; size: number; mimeType: string }> = [];
      
      if (uploadedFiles.length > 0) {
        console.log('Uploading files:', uploadedFiles.map(f => f.name));
        
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
            size: uploadedFiles[index].size, // Add file size
            mimeType: uploadedFiles[index].type, // Add MIME type
          }));
          console.log('Files uploaded successfully:', attachments);
        } else {
          throw new Error('Failed to upload files');
        }
      }

      // Then submit the proposal with the uploaded file URLs
      const submittedProposal = await api.submitProposal({
        projectId: id,
        coverLetter: '',
        proposedRate: parseFloat(proposalData.proposedRate),
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
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link to="/projects" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
          Projects
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">
          {project?.title || 'Loading...'}
        </span>
      </nav>

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
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors"
                      onClick={() => {
                        setShowActionsMenu(false);
                        // TODO: Implement close project
                        console.log('Close project');
                      }}
                    >
                      <XCircle className="w-4 h-4" />
                      Close Project
                    </button>
                  )}
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-dark-bg transition-colors border-t border-gray-200 dark:border-dark-border"
                    onClick={() => {
                      setShowActionsMenu(false);
                      // TODO: Implement delete project
                      if (confirm('Are you sure you want to delete this project?')) {
                        console.log('Delete project');
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Project
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
                    disputed: 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700',
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
                        <div className="flex flex-wrap items-center gap-4 text-sm">
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
                        </div>
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
                      
                      <div className="flex items-center justify-between">
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
                        <Link to={`/projects/${project.id}/proposals/${proposal.id}`}>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </Link>
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
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
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
    </div>
  );
}
