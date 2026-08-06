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

export interface SkillCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  skills: Skill[];
}

export interface SkillTaxonomy {
  categories: SkillCategory[];
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

// Portfolio responses are camelCase (service layer maps snake_case entities before
// returning), unlike Message/Conversation which are returned as raw snake_case entities.
export interface PortfolioItem {
  id: string;
  freelancerId: string;
  title: string;
  description: string;
  projectUrl?: string;
  images: Attachment[];
  skills: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Messaging types (backend returns these as-is, snake_case — not mapped to camelCase,
// same precedent as KycVerification below)
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  attachments?: Attachment[];
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  participant1_id: string;
  participant2_id: string;
  last_message_at: string;
  last_message_preview?: string;
  unread_count_1: number;
  unread_count_2: number;
  created_at: string;
  updated_at: string;
}

// getConversations() enriches each conversation with the other participant's basic
// info server-side — this enrichment does not exist on any other endpoint's response.
export interface ConversationWithDetails extends Conversation {
  otherUser: {
    id: string;
    name: string;
    email: string;
  };
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
  totalUsers: number;
  totalFreelancers: number;
  totalEmployers: number;
  totalProjects: number;
  totalContracts: number;
  totalDisputes: number;
  totalTransactionVolume: number;
  activeProjects: number;
  completedProjects: number;
  averageProjectBudget: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  walletAddress: string;
  createdAt: string;
  name: string;
  kycVerified: boolean;
  isActive: boolean;
}

export interface DisputeManagementData {
  disputes: Dispute[];
  total: number;
  pendingCount: number;
  resolvedCount: number;
}

export interface SystemHealth {
  database: 'healthy' | 'unhealthy';
  storage: 'healthy' | 'unhealthy';
  uptime: number;
  timestamp: string;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalProjects: number;
  totalRevenue: number;
  activeContracts: number;
  userGrowth: number;
  projectGrowth: number;
  userGrowthData: { month: string; count: number }[];
  projectActivityData: { month: string; count: number }[];
}

export interface FreelancerAnalytics {
  totalEarnings: number;
  projectsCompleted: number;
  averageRating: number;
  earningsByMonth: { month: string; amount: number }[];
  topSkills: { skill: string; projectCount: number }[];
  proposalAcceptanceRate: number;
}

export interface EmployerAnalytics {
  totalSpent: number;
  projectsPosted: number;
  projectsCompleted: number;
  averageProjectBudget: number;
  spendingByMonth: { month: string; amount: number }[];
  topHiredSkills: { skill: string; projectCount: number }[];
}

export interface SkillTrend {
  skillId: string;
  skillName: string;
  demandLevel: 'high' | 'medium' | 'low';
  projectCount: number;
  averageBudget: number;
  growthRate: number;
}

export interface PlatformMetrics {
  totalUsers: number;
  totalProjects: number;
  totalContracts: number;
  totalTransactionVolume: number;
  activeUsers: number;
  completionRate: number;
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

export interface RegistrationRequiredResponse {
  status: 'registration_required';
  message?: string;
  access_token?: string;
}

export type OAuthCallbackResponse = AuthResponse | RegistrationRequiredResponse;

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

export interface EmailPreferences {
  id: string;
  userId: string;
  proposalReceived: boolean;
  proposalAccepted: boolean;
  milestoneUpdates: boolean;
  paymentNotifications: boolean;
  disputeNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  createdAt: string;
  updatedAt: string;
}

export type EmailPreferencesUpdate = Partial<{
  proposal_received: boolean;
  proposal_accepted: boolean;
  milestone_updates: boolean;
  payment_notifications: boolean;
  dispute_notifications: boolean;
  marketing_emails: boolean;
  weekly_digest: boolean;
}>;

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  hasMore: boolean;
  total?: number;
}

export interface SearchResult<T> {
  items: T[];
  metadata: {
    pageSize: number;
    hasMore: boolean;
    offset?: number;
  };
}

export interface Favorite<T = unknown> {
  id: string;
  userId: string;
  targetType: 'project' | 'freelancer';
  targetId: string;
  createdAt: string;
  target?: T | null;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  searchType: 'project' | 'freelancer';
  filters: Record<string, unknown>;
  notifyOnNew: boolean;
  createdAt: string;
  updatedAt: string;
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

// Audit log entry (backend returns these as-is, snake_case — not mapped to camelCase)
export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  payload: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  status: 'success' | 'failure' | 'pending';
  error_message: string | null;
  created_at: string;
}
