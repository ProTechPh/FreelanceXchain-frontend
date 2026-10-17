import type { SkillCategory } from '@/types';

export interface SkillOption {
  id: string;
  name: string;
}

export interface SkillOptionCategory {
  id: string;
  name: string;
  skills: SkillOption[];
}

/** Active catalog categories and skills, in the shape the skill selector renders. */
export function toSkillCategories(categories: SkillCategory[] | undefined): SkillOptionCategory[] {
  return (categories ?? [])
    .filter((category) => category.isActive !== false)
    .map((category) => ({
      id: category.id,
      name: category.name,
      skills: (category.skills ?? [])
        .filter((skill) => skill.isActive !== false)
        .map((skill) => ({ id: skill.id, name: skill.name })),
    }))
    .filter((category) => category.skills.length > 0);
}

/** Case- and spacing-insensitive key for comparing skill names. */
export function skillNameKey(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

const SOFT_SKILLS_CATEGORY = 'soft skills';

export function isSoftSkillCategory(categoryName: string): boolean {
  return skillNameKey(categoryName) === SOFT_SKILLS_CATEGORY;
}

// Words in a job position that point to a category, keyed by category name.
// The category's own name and its catalog skill names also count.
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  blockchain: ['blockchain', 'web3', 'smart contract', 'solidity', 'defi', 'crypto', 'dapp', 'ethereum'],
  frontend: ['frontend', 'front end', 'web developer', 'full stack', 'fullstack'],
  backend: ['backend', 'back end', 'api', 'server', 'web developer', 'full stack', 'fullstack'],
  design: ['design', 'designer', 'ui', 'ux', 'graphic'],
  mobile: ['ios', 'android', 'app developer'],
  'devops & cloud': ['devops', 'cloud', 'sre', 'site reliability', 'infrastructure', 'platform engineer'],
  'ai & machine learning': ['ai', 'ml', 'machine learning', 'deep learning', 'llm', 'data scientist'],
  cybersecurity: ['security', 'cybersecurity', 'pentester', 'penetration', 'auditor'],
  'data & analytics': ['data', 'analyst', 'analytics', 'bi', 'business intelligence'],
  'quality assurance': ['qa', 'quality', 'tester', 'test engineer', 'sdet'],
  'product & management': ['product manager', 'project manager', 'product owner', 'scrum', 'manager'],
  'writing & content': ['writer', 'writing', 'content', 'copywriter', 'documentation', 'editor'],
  'web development': ['web', 'website', 'web developer', 'webmaster', 'full stack', 'fullstack', 'wordpress'],
  'nuclear engineering': ['nuclear', 'reactor', 'radiation', 'radiological', 'radioactive', 'health physicist'],
  'explosives safety & disposal': ['bomb', 'eod', 'explosive', 'explosives', 'ordnance', 'blasting', 'blaster', 'demolition', 'demining'],
};

/** Lowercase words separated by single spaces and padded, so phrases match only as whole words. */
function phraseText(text: string): string {
  const words = text.toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();
  return words ? ` ${words} ` : '';
}

/** Ids of the technical categories a job position points to, in catalog order. */
export function detectCategoryIds(title: string, categories: SkillOptionCategory[]): string[] {
  const text = phraseText(title);
  if (!text) return [];
  return categories
    .filter((category) => {
      if (isSoftSkillCategory(category.name)) return false;
      const phrases = [
        category.name,
        ...(CATEGORY_KEYWORDS[skillNameKey(category.name)] ?? []),
        ...category.skills.map((skill) => skill.name),
      ];
      return phrases.some((phrase) => {
        const needle = phraseText(phrase);
        return needle !== '' && text.includes(needle);
      });
    })
    .map((category) => category.id);
}
