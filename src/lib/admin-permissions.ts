import { ADMIN_PERMISSIONS, type AdminPermission, type AdminUser } from '../types/index.ts';

export interface PermissionGroup {
  name: string;
  description: string;
  items: {
    key: AdminPermission;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'KYC & Verification',
    description: 'Identity verification reviews and document management',
    items: [
      {
        key: 'kyc:view',
        label: 'View KYC Queue',
        description: 'Inspect user submissions, identity documents, and verification history',
      },
      {
        key: 'kyc:manage',
        label: 'Manage KYC Reviews',
        description: 'Approve, reject, request resubmission, or perform manual verification',
      },
    ],
  },
  {
    name: 'User Management',
    description: 'Account directory, status moderation, and profile administration',
    items: [
      {
        key: 'users:view',
        label: 'View Users',
        description: 'Search and inspect user accounts, roles, and profiles',
      },
      {
        key: 'users:manage',
        label: 'Manage Users',
        description: 'Suspend, unsuspend, verify, and modify user account statuses',
      },
    ],
  },
  {
    name: 'Disputes & Resolution',
    description: 'Contract conflicts, evidence, and mediation',
    items: [
      {
        key: 'disputes:view',
        label: 'View Disputes',
        description: 'Browse dispute cases, timelines, and submitted evidence',
      },
      {
        key: 'disputes:manage',
        label: 'Resolve Disputes',
        description: 'Make dispute rulings, trigger refund or payout disbursements',
      },
    ],
  },
  {
    name: 'Operations & Security',
    description: 'System metrics, audit trails, and administrative access',
    items: [
      {
        key: 'admin:manage',
        label: 'Admin Management (Super Admin)',
        description: 'Assign granular permissions and manage admin accounts',
      },
      {
        key: 'system:view',
        label: 'System Health',
        description: 'Monitor service health, database stats, and API uptime',
      },
      {
        key: 'audit:view',
        label: 'Security & Audit Logs',
        description: 'Search administrative logs, audit trails, and security alerts',
      },
    ],
  },
  {
    name: 'Insights & Support',
    description: 'Analytics, user feedback, tickets, and taxonomy',
    items: [
      {
        key: 'analytics:view',
        label: 'Analytics & Feedback',
        description: 'View platform metrics, revenue trends, app ratings, and user reviews',
      },
      {
        key: 'skills:manage',
        label: 'Skills Taxonomy',
        description: 'Manage platform skills, tags, and category hierarchies',
      },
      {
        key: 'support:manage',
        label: 'Support Tickets',
        description: 'Manage helpdesk inquiries and user support tickets',
      },
    ],
  },
];

export const PRESETS: { name: string; description: string; permissions: AdminPermission[] }[] = [
  {
    name: 'KYC Officer',
    description: 'Strictly restricted to KYC document reviews and approvals',
    permissions: ['kyc:view', 'kyc:manage'],
  },
  {
    name: 'Dispute Specialist',
    description: 'Handles contract disputes and arbitration',
    permissions: ['disputes:view', 'disputes:manage'],
  },
  {
    name: 'Support Agent',
    description: 'Manages support tickets and inspects user profiles',
    permissions: ['support:manage', 'users:view'],
  },
  {
    name: 'Auditor',
    description: 'Read-only access to audit logs, system health, and analytics',
    permissions: ['audit:view', 'system:view', 'analytics:view'],
  },
  {
    name: 'Super Admin',
    description: 'Full platform access including admin permission management',
    permissions: [...ADMIN_PERMISSIONS],
  },
];

export function getInitialAdminPermissions(user: AdminUser): Set<AdminPermission> {
  const perms = user.permissions;
  const isSuper =
    perms === undefined ||
    (perms as string[]).includes('*') ||
    perms.includes('admin:manage');

  return isSuper ? new Set(ADMIN_PERMISSIONS) : new Set(perms);
}
