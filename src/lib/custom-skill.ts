import { countMeaningfulChars } from './text-validation.ts';

export type CustomSkillDraft = {
  name: string;
  description: string;
  yearsOfExperience: number;
};

export function validateCustomSkill(draft: CustomSkillDraft): string | null {
  if (countMeaningfulChars(draft.name) < 2) return 'Skill name must include at least 2 letters or numbers.';
  if (draft.name.trim().length > 100) return 'Skill name must be 100 characters or fewer.';
  if (countMeaningfulChars(draft.description) < 10) return 'Description must include at least 10 letters or numbers.';
  if (draft.description.trim().length > 500) return 'Description must be 500 characters or fewer.';
  if (!Number.isFinite(draft.yearsOfExperience) || draft.yearsOfExperience < 0 || draft.yearsOfExperience > 50) return 'Years of experience must be between 0 and 50.';
  return null;
}
