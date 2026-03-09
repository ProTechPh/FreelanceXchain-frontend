// User Types
export type UserRole = 'freelancer' | 'employer' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  walletAddress: string;
  kycStatus?: KycStatus; // KYC verification status
  mfaEnabled?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
  mfaRequired?: boolean;
  mfaSessionId?: string;
  factorId?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  role: UserRole;
  name?: string;
  walletAddress?: string;
  captchaToken?: string;
}

export interface LoginInput {
  email: string;
  password: string;
  captchaToken?: string;
}

// Profile Types
export interface SkillReference {
  name: string;
  yearsOfExperience: number;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string | null;
  current?: boolean;
}

export type Availability = 'available' | 'busy' | 'unavailable';

export interface FreelancerProfile {
  id: string;
  userId: string;
  name: string | null;
  nationality: string | null;
  bio: string;
  hourlyRate: number;
  skills: SkillReference[];
  experience: WorkExperience[];
  availability: Availability;
  createdAt: string;
  updatedAt: string;
}

export interface FreelancerProfileUpdate {
  bio?: string;
  hourlyRate?: number;
  availability?: Availability;
  name?: string;
  nationality?: string;
}

export interface EmployerProfile {
  id: string;
  userId: string;
  name: string | null;
  nationality: string | null;
  companyName: string;
  description: string;
  industry: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployerProfileUpdate {
  companyName?: string;
  description?: string;
  industry?: string;
  name?: string;
  nationality?: string;
}

// Skill Types
export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Project Types
export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';
export type MilestoneStatus = 'pending' | 'in_progress' | 'submitted' | 'approved' | 'disputed';

export interface ProjectSkillReference {
  skillId?: string;
  skillName: string;
  categoryId?: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
}

export interface Project {
  id: string;
  employerId: string;
  title: string;
  description: string;
  requiredSkills: ProjectSkillReference[];
  budget: number;
  budgetMin?: number;
  budgetMax?: number;
  deadline: string;
  status: ProjectStatus;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
  // Extended fields that may be populated in list views
  employer?: EmployerProfile;
  proposalCount?: number;
  skills?: Skill[];
}

export interface CreateProjectInput {
  title: string;
  description: string;
  requiredSkills: Array<{ skillId: string; yearsOfExperience?: number }>;
  budget: number;
  deadline: string;
}

export interface AddMilestonesInput {
  milestones: Array<{
    title: string;
    description: string;
    amount: number;
    dueDate: string;
  }>;
}

// Proposal Types
export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export interface ProposalMilestone {
  title: string;
  description: string;
  amount: number;
  dueDate: string;
}

export interface Proposal {
  id: string;
  projectId: string;
  freelancerId: string;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: number;
  status: ProposalStatus;
  milestones?: ProposalMilestone[];
  attachments?: Array<{ url: string; filename: string; size: number; mimeType: string }>;
  createdAt: string;
  updatedAt: string;
  // Extended fields
  project?: Project;
  freelancer?: FreelancerProfile;
}

export interface SubmitProposalInput {
  projectId: string;
  coverLetter: string;
  proposedRate: number;
  estimatedDuration: number;
  attachments?: Array<{ url: string; filename: string; size: number; mimeType: string }>;
}

// Contract Types
export type ContractStatus = 'active' | 'completed' | 'disputed' | 'cancelled';

export interface ContractMilestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  id: string;
  projectId: string;
  proposalId: string;
  freelancerId: string;
  employerId: string;
  escrowAddress: string;
  title: string;
  description: string;
  totalAmount: number;
  status: ContractStatus;
  startDate: string;
  endDate?: string;
  milestones: ContractMilestone[];
  createdAt: string;
  updatedAt: string;
  // Extended fields
  project?: Project;
  freelancer?: FreelancerProfile;
  employer?: EmployerProfile;
}

export interface PaymentStatus {
  contractId: string;
  escrowAddress: string;
  totalAmount: number;
  releasedAmount: number;
  pendingAmount: number;
  milestones: Array<{
    id: string;
    title: string;
    amount: number;
    status: MilestoneStatus;
  }>;
  contractStatus: string;
}

// Dispute Types
export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'escalated';
export type EvidenceType = 'text' | 'file' | 'link';
export type DisputeDecision = 'freelancer_favor' | 'employer_favor' | 'split';

export interface Evidence {
  id: string;
  submitterId: string;
  type: EvidenceType;
  content: string;
  fileUrl?: string;
  submittedAt: string;
}

export interface DisputeResolution {
  decision: DisputeDecision;
  reasoning: string;
  resolvedBy: string;
  resolvedAt: string;
  amountToFreelancer?: number;
  amountToEmployer?: number;
}

export interface Dispute {
  id: string;
  contractId: string;
  milestoneId: string;
  initiatorId: string;
  respondentId: string;
  reason: string;
  evidence: Evidence[];
  status: DisputeStatus;
  resolution: DisputeResolution | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputeInput {
  contractId: string;
  milestoneId: string;
  reason: string;
}

export interface SubmitEvidenceInput {
  type: EvidenceType;
  content: string;
  fileUrl?: string;
}

export interface ResolveDisputeInput {
  decision: DisputeDecision;
  reasoning: string;
}

// Notification Types
export type NotificationType =
  | 'proposal_received'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'milestone_submitted'
  | 'milestone_approved'
  | 'payment_released'
  | 'dispute_created'
  | 'dispute_resolved'
  | 'rating_received'
  | 'message';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// KYC Types
export type KycStatus = 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'expired';

export interface KycAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  countryCode: string;
}

export interface KycDocument {
  type: 'passport' | 'national_id' | 'drivers_license' | 'utility_bill';
  documentNumber: string;
  issuingCountry: string;
  frontImageUrl: string;
  backImageUrl?: string;
}

export interface LivenessChallenge {
  type: 'blink' | 'smile' | 'turn_left' | 'turn_right' | 'nod';
  completed: boolean;
  timestamp: string | null;
}

export interface LivenessCheck {
  id: string;
  sessionId: string;
  status: 'pending' | 'passed' | 'failed';
  confidenceScore: number;
  challenges: LivenessChallenge[];
  expiresAt: string;
}

export interface KycVerification {
  id: string;
  userId: string;
  status: KycStatus;
  tier: number;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nationality: string;
  address: KycAddress;
  documents: KycDocument[];
  documentType?: 'passport' | 'national_id' | 'drivers_license' | 'utility_bill';
  livenessCheck?: LivenessCheck;
  faceMatchScore?: number;
  faceMatchStatus?: 'matched' | 'not_matched' | 'pending';
  amlScreeningStatus?: 'clear' | 'flagged' | 'pending';
  riskLevel?: 'low' | 'medium' | 'high';
  rejectionReason?: string;
  didit_session_url?: string;
  completed_at?: string;
  admin_notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitKycInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  address: KycAddress;
  document: KycDocument;
  selfieImageUrl: string;
  tier?: number;
}

// Simplified KYC submission for frontend form
export interface KycSubmissionInput {
  documentType: 'passport' | 'national_id' | 'drivers_license';
  documentNumber: string;
  documentExpiryDate: string;
  address: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

// AI Matching Types
export interface ProjectRecommendation {
  projectId: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  reasoning: string;
}

export interface FreelancerRecommendation {
  freelancerId: string;
  matchScore: number;
  reputationScore: number;
  combinedScore: number;
  matchedSkills: string[];
  reasoning: string;
}

export interface ExtractedSkill {
  skillId: string;
  skillName: string;
  confidence: number;
}

export interface SkillGapAnalysis {
  currentSkills: string[];
  recommendedSkills: string[];
  marketDemand: Array<{
    skillName: string;
    demandLevel: 'high' | 'medium' | 'low';
  }>;
  reasoning: string;
}

// Reputation Types
export interface Rating {
  id: string;
  contractId: string;
  raterId: string;
  ratedUserId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SubmitRatingInput {
  contractId: string;
  rateeId: string;
  rating: number;
  comment?: string;
}

export interface UserReputation {
  userId: string;
  score: number; // Weighted average with time decay
  averageRating: number;
  totalRatings: number;
  ratings: Rating[];
}

export interface WorkHistoryEntry {
  contractId: string;
  projectId: string;
  projectTitle: string;
  role: 'freelancer' | 'employer';
  completedAt: string;
  rating?: number;
  ratingComment?: string;
}

export interface CanRateResponse {
  canRate: boolean;
  reason?: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  continuationToken: string | null;
}

export interface PaginatedResponseWithMetadata<T> {
  items: T[];
  metadata: {
    pageSize: number;
    hasMore: boolean;
    continuationToken: string | null;
  };
}

// Search pagination (for traditional page/limit pagination)
export interface SearchPaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// API Error Types
export interface ApiErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  timestamp: string;
  requestId: string;
}

// File Upload Types
export interface UploadedFile {
  url: string;
  path: string;
  filename: string;
  size?: number;
  mimeType?: string;
}

export type StorageBucket = 
  | 'profile-images' 
  | 'contract-documents' 
  | 'proposal-attachments' 
  | 'dispute-evidence';

export interface FileUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface MultipleFileUploadResult {
  success: boolean;
  files?: UploadedFile[];
  error?: string;
}

export interface FileListResult {
  success: boolean;
  files?: Array<{
    name: string;
    id: string;
    updated_at: string;
    created_at: string;
    last_accessed_at: string;
    metadata: Record<string, any>;
  }>;
  error?: string;
}

// Message Types (Contract Chat)
export interface Message {
  id: string;
  contract_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface SendMessageInput {
  content: string;
}

export interface MessagePaginatedResponse {
  items: Message[];
  hasMore: boolean;
  total?: number;
}

export interface ConversationSummary {
  contractId: string;
  lastMessage: Message | null;
  unreadCount: number;
}
