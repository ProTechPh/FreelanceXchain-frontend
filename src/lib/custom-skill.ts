export type CustomSkillDraft = {
  name: string;
  description: string;
  yearsOfExperience: number;
};

export function validateCustomSkill(draft: CustomSkillDraft): string | null {
  const nameLength = draft.name.trim().length;
  if (nameLength < 2 || nameLength > 100) return 'Skill name must be between 2 and 100 characters.';
  const descriptionLength = draft.description.trim().length;
  if (descriptionLength < 10 || descriptionLength > 500) return 'Description must be between 10 and 500 characters.';
  if (!Number.isFinite(draft.yearsOfExperience) || draft.yearsOfExperience < 0 || draft.yearsOfExperience > 50) return 'Years of experience must be between 0 and 50.';
  return null;
}
