import type { FreelancerProfile, SkillReference, WorkExperience } from '@/types';

type ProfileWithUntrustedFields = {
  skills?: unknown;
  experience?: unknown;
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

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function nullableStringValue(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string') return value;
    if (value === null) return null;
  }
  return null;
}

function uniqueExperienceId(
  experience: Record<string, unknown>,
  index: number,
  usedIds: Set<string>,
): string {
  const persistedId = [experience.id, experience.experienceId, experience.experience_id]
    .find((value) => typeof value === 'string' && value.trim());
  let id = typeof persistedId === 'string' ? persistedId.trim() : '';

  if (!id || usedIds.has(id)) {
    const baseId = `legacy-experience-${index}`;
    id = baseId;
    let suffix = 1;
    while (usedIds.has(id)) {
      id = `${baseId}-${suffix}`;
      suffix += 1;
    }
  }

  usedIds.add(id);
  return id;
}

/**
 * Canonicalize persisted experience records so list rendering and mutations use
 * the same stable, unique identifier during a backend migration.
 */
export function normalizeFreelancerExperience(value: unknown): WorkExperience[] {
  if (!Array.isArray(value)) return [];

  const usedIds = new Set<string>();
  return value.flatMap((candidate, index) => {
    if (!isRecord(candidate)) return [];

    return [{
      id: uniqueExperienceId(candidate, index, usedIds),
      title: stringValue(candidate.title),
      company: stringValue(candidate.company),
      description: stringValue(candidate.description),
      startDate: stringValue(candidate.startDate ?? candidate.start_date),
      endDate: nullableStringValue(candidate.endDate, candidate.end_date),
    }];
  });
}

export function normalizeFreelancerProfile<T extends ProfileWithUntrustedFields>(
  profile: T,
): Omit<T, 'skills' | 'experience'> & Pick<FreelancerProfile, 'skills' | 'experience'> {
  return {
    ...profile,
    skills: normalizeFreelancerSkills(profile.skills),
    experience: normalizeFreelancerExperience(profile.experience),
  };
}
