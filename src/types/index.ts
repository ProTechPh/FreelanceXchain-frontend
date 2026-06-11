export type UserRole = 'freelancer' | 'employer' | 'admin';

export type ProjectStatus = 'draft' | 'open' | 'in_progress' | 'completed' | 'cancelled';

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

export type ContractStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'disputed';

export type MilestoneStatus = 'pending' | 'funded' | 'in_progress' | 'submitted' | 'approved' | 'disputed' | 'released';

export type Availability = 'available' | 'busy' | 'unavailable';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'escalated';

export type EvidenceType = 'document' | 'screenshot' | 'message' | 'contract' | 'other';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  wallet_address: string;
  is_suspended: boolean;
  mfa_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FreelancerProfile {
  id: string;
  user_id: string;
  name: string;
  nationality: string;
  bio: string;
  hourly_rate: number;
  skills: Skill[];
  experience: Experience[];
  availability: Availability;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface EmployerProfile {
  id: string;
  user_id: string;
  name: string;
  nationality: string;
  company_name: string;
  description: string;
  industry: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface Skill {
  id: string;
  name: string;
  category?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  description: string;
  start_date: string;
  end_date?: string;
}

export interface Project {
  id: string;
  employer_id: string;
  title: string;
  description: string;
  required_skills: Skill[];
  budget: number;
  deadline: string;
  is_rush: boolean;
  rush_fee_percentage: number;
  status: ProjectStatus;
  milestones: Milestone[];
  freelancer_limit: number;
  tags: string[];
  attachments: Attachment[];
  created_at: string;
  updated_at: string;
  employer?: EmployerProfile;
  proposal_count?: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  status: MilestoneStatus;
  deliverables: Attachment[];
  deadline?: string;
  completed_at?: string;
}

export interface Proposal {
  id: string;
  project_id: string;
  freelancer_id: string;
  cover_letter: string;
  attachments: Attachment[];
  proposed_rate: number;
  estimated_duration: number;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
  project?: Project;
  freelancer?: FreelancerProfile;
}

export interface Contract {
  id: string;
  project_id: string;
  proposal_id: string;
  freelancer_id: string;
  employer_id: string;
  escrow_address: string;
  total_amount: number;
  funded_amount: number;
  status: ContractStatus;
  milestones: Milestone[];
  created_at: string;
  updated_at: string;
  project?: Project;
  freelancer?: FreelancerProfile;
  employer?: EmployerProfile;
}

export interface Review {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  contract_id: string;
  overall_rating: number;
  work_quality: number;
  communication: number;
  professionalism: number;
  would_rehire: boolean;
  comment: string;
  created_at: string;
}

export interface Dispute {
  id: string;
  contract_id: string;
  milestone_id: string;
  raised_by: string;
  reason: string;
  status: DisputeStatus;
  evidence: DisputeEvidence[];
  resolution?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DisputeEvidence {
  id: string;
  type: EvidenceType;
  content: string;
  file_url?: string;
  submitted_by: string;
  created_at: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  type: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: Attachment[];
  read_at?: string;
  created_at: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  participants: User[];
  last_message?: Message;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, unknown>;
  created_at: string;
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
  name: string;
  role: UserRole;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
