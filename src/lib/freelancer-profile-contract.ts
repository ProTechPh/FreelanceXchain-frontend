import type { FreelancerProfile, SkillReference } from '@/types';

type ProfileWithUntrustedSkills = {
  skills?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function skillName(skill: Record<string, unknown>): string | null {
  for (const value of [skill.name, skill.skillName, skill.skill_name]) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function skillYears(skill: Record<string, unknown>): number {
  const value = skill.yearsOfExperience ?? skill.years_of_experience;
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

/**
 * Keep components on the current camelCase profile contract while tolerating
 * legacy skill objects that can still exist in persisted profile documents.
 */
export function normalizeFreelancerSkills(value: unknown): SkillReference[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate) => {
    if (!isRecord(candidate)) return [];
    const name = skillName(candidate);
    return name ? [{ name, yearsOfExperience: skillYears(candidate) }] : [];
  });
}

export function normalizeFreelancerProfile<T extends ProfileWithUntrustedSkills>(
  profile: T,
): Omit<T, 'skills'> & Pick<FreelancerProfile, 'skills'> {
  return {
    ...profile,
    skills: normalizeFreelancerSkills(profile.skills),
  };
}
