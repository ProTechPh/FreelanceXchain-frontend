import type { UserRole } from '@/types';

/** The roles a participant can switch between. Admins never switch. */
export type ParticipantRole = Extract<UserRole, 'freelancer' | 'employer'>;

/** Where a freelancer sets up their business information before acting as an employer. */
export const BECOME_EMPLOYER_PATH = '/dashboard/freelancer/become-employer';

export function isParticipantRole(role: unknown): role is ParticipantRole {
  return role === 'freelancer' || role === 'employer';
}

export function getOtherRole(role: ParticipantRole): ParticipantRole {
  return role === 'freelancer' ? 'employer' : 'freelancer';
}

export function getRoleLabel(role: ParticipantRole): string {
  return role === 'freelancer' ? 'Freelancer' : 'Employer';
}

/**
 * When a participant opens a page that belongs to their other role (for
 * example a freelancer contract link while acting as an employer), the role
 * they should switch to in order to view it. Null when no switch applies.
 */
export function getRoleSwitchTarget(
  role: UserRole | null | undefined,
  allowedRoles: readonly UserRole[] | undefined,
): ParticipantRole | null {
  if (!isParticipantRole(role) || !allowedRoles || allowedRoles.includes(role)) return null;
  const other = getOtherRole(role);
  return allowedRoles.includes(other) ? other : null;
}

/**
 * Whether a contract (or anything with both party IDs) belongs to the given
 * side of the user's account. One account can be the employer on some
 * contracts and the freelancer on others; each dashboard shows only its side.
 */
export function isOnRoleSide(
  record: { employerId?: string | null; freelancerId?: string | null },
  role: ParticipantRole,
  userId: string | null | undefined,
): boolean {
  if (!userId) return true;
  return role === 'employer' ? record.employerId === userId : record.freelancerId === userId;
}
