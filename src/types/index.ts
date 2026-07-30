export type UserRole = 'freelancer' | 'employer' | 'admin';

export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type ContractStatus = 'pending' | 'active' | 'completed' | 'disputed' | 'resolved' | 'cancelled';

export type MilestoneStatus =
  | 'pending'
  | 'in_progress'
  | 'submitted'
  | 'releasing'
  | 'approved'
  | 'rejected'
  | 'disputed'
  | 'refunded'
  | 'completed';

export type Availability = 'available' | 'busy' | 'unavailable';

export type DisputeStatus = 'open' | 'under_review' | 'resolved';

export type EvidenceType = 'document' | 'screenshot' | 'message' | 'contract' | 'other';

export type NotificationType =
  | 'proposal_received'
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'milestone_submitted'
  | 'milestone_approved'
  | 'milestone_rejected'
  | 'payment_released'
  | 'dispute_created'
  | 'dispute_resolved'
  | 'dispute_evidence_submitted'
  | 'refund_requested'
  | 'refund_approved'
  | 'refund_rejected'
  | 'rating_received'
  | 'rush_upgrade_requested'
  | 'rush_upgrade_accepted'
  | 'rush_upgrade_declined'
  | 'rush_upgrade_counter_offered'
  | 'message';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  walletAddress: string;
  kycStatus?: KycStatus;
  createdAt: string;
  updatedAt: string;
}

export interface WorkExperience {
  id: string;
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string | null;
}

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

// Full skill catalog entry
export interface Skill {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// A freelancer's claimed skill (FreelancerProfile.skills)
export interface SkillReference {
  name: string;
  yearsOfExperience: number;
}

// A skill required by a project (Project.requiredSkills)
export interface ProjectSkillReference {
  skillId?: string;
  skillName: string;
  categoryId?: string;
  yearsOfExperience?: number;
}

export interface Project {
  id: string;
  employerId: string;
  title: string;
  description: string;
  requiredSkills: ProjectSkillReference[];
  budget: number;
  deadline: string;
  isRush: boolean;
  rushFeePercentage: number;
  status: ProjectStatus;
  milestones: Milestone[];
  freelancerLimit: number;
  tags: string[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  employer?: EmployerProfile;
  proposalCount?: number;
}

export interface Milestone {
  id: string;
  contractId?: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: MilestoneStatus;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  deliverableFiles?: Attachment[];
  rejectionReason?: string;
  revisionCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Proposal {
  id: string;
  projectId: string;
  freelancerId: string;
  coverLetter: string | null;
  attachments: Attachment[];
  proposedRate: number;
  estimatedDuration: number;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  freelancer?: FreelancerProfile;
}

export interface Contract {
  id: string;
  projectId: string;
  proposalId: string;
  freelancerId: string;
  employerId: string;
  escrowAddress: string;
  baseAmount: number;
  rushFee: number;
  totalAmount: number;
  status: ContractStatus;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  milestones?: Milestone[];
  createdAt: string;
  updatedAt: string;
  project?: Project;
  freelancer?: FreelancerProfile;
  employer?: EmployerProfile;
}

export interface Review {
  id: string;
  contractId: string;
  projectId?: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  reviewerRole?: string;
  workQuality?: number;
  communication?: number;
  professionalism?: number;
  wouldWorkAgain?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Evidence embedded directly on a Dispute
export interface Evidence {
  id: string;
  submitterId: string;
  type: 'text' | 'file' | 'link';
  content: string;
  submittedAt: string;
}

export interface DisputeResolution {
  decision: 'freelancer_favor' | 'employer_favor' | 'split';
  reasoning: string;
  resolvedBy: string;
  resolvedAt: string;
}

export interface Dispute {
  id: string;
  contractId: string;
  milestoneId: string;
  initiatorId: string;
  reason: string;
  evidence: Evidence[];
  status: DisputeStatus;
  resolution: DisputeResolution | null;
  createdAt: string;
  updatedAt: string;
}

// Standalone dispute-evidence entity (separate submission/verification workflow)
export interface DisputeEvidence {
  id: string;
  disputeId: string;
  submittedBy: string;
  evidenceType: EvidenceType;
  fileUrl?: string;
  description: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  lastMessageAt: string;
  lastMessagePreview?: string;
  unreadCount1: number;
  unreadCount2: number;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'escrow_deposit' | 'escrow_release' | 'refund';
  amount: number;
  currency: string;
  tx_hash?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export interface ReputationScore {
  user_id: string;
  overall_score: number;
  total_ratings: number;
  breakdown: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  on_chain_verified: boolean;
}

export interface PlatformStats {
  total_freelancers: number;
  total_employers: number;
  total_projects: number;
  total_earned: number;
  active_contracts: number;
  countries: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthApiUser {
  id: string;
  email: string;
  role: UserRole;
  walletAddress: string;
  kycStatus?: KycStatus;
  createdAt: string;
  authProvider?: 'email' | 'oauth';
}

export interface AuthSuccessResponse {
  user: AuthApiUser;
  accessToken: string;
  refreshToken: string;
}

export interface MfaRequiredResponse {
  mfaRequired: true;
  mfaSessionToken: string;
}

export type AuthResponse = AuthSuccessResponse | MfaRequiredResponse;

export interface MfaVerifyRequest {
  mfaSessionToken: string;
  factorId: string;
  code: string;
}

export interface MfaEnrollRequest {
  factorType: 'totp' | 'email';
}

export interface MfaEnrollResponse {
  success: boolean;
  recoveryCodes?: string[];
  secret?: string;
  uri?: string;
}

export interface MfaFactor {
  id: string;
  type: 'totp' | 'email';
}

export interface MfaFactorsResponse {
  factors: MfaFactor[];
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  total?: number;
}

// KYC Verification Types (backend returns these as-is, snake_case — not mapped to camelCase)
export type KycStatus = 'pending' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'expired';

export interface KycVerification {
  id: string;
  user_id: string;
  status: KycStatus;
  didit_session_id: string;
  didit_session_url: string | null;
  didit_workflow_id: string;
  decision: 'approved' | 'declined' | 'review' | null;
  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  document_type: string | null;
  document_number: string | null;
  issuing_country: string | null;
  document_verified: boolean | null;
  liveness_passed: boolean | null;
  liveness_confidence_score: string | null;
  face_matched: boolean | null;
  face_similarity_score: string | null;
  ip_address: string | null;
  ip_country_code: string | null;
  is_vpn: boolean | null;
  is_proxy: boolean | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  expires_at: string | null;
}
