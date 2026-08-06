export type MarketplaceFilters = {
  keyword: string;
  skillIds: string[];
  minBudget?: number;
  maxBudget?: number;
};

type SkillOption = { id: string; name: string };

export function buildMarketplaceSearchParams(filters: MarketplaceFilters, offset = 0) {
  const params: Record<string, string | number> = { pageSize: 12 };
  const keyword = filters.keyword.trim();

  if (keyword) params.keyword = keyword;
  if (filters.skillIds.length > 0) params.skills = filters.skillIds.join(',');
  if (filters.minBudget !== undefined) params.minBudget = filters.minBudget;
  if (filters.maxBudget !== undefined) params.maxBudget = filters.maxBudget;
  if (offset > 0) params.continuationToken = String(offset);

  return params;
}

export function createSavedSearchFilters(filters: MarketplaceFilters, skills: SkillOption[]) {
  const saved: Record<string, unknown> = {};
  const keyword = filters.keyword.trim();
  const namesById = new Map(skills.map((skill) => [skill.id, skill.name]));
  const skillNames = filters.skillIds
    .map((id) => namesById.get(id))
    .filter((name): name is string => Boolean(name));

  if (keyword) saved.keyword = keyword;
  if (skillNames.length > 0) saved.skills = skillNames;
  if (filters.skillIds.length > 0) saved.skillIds = filters.skillIds;
  if (filters.minBudget !== undefined) saved.minBudget = filters.minBudget;
  if (filters.maxBudget !== undefined) saved.maxBudget = filters.maxBudget;

  return saved;
}

export function restoreSavedSearchFilters(
  saved: Record<string, unknown>,
  skills: SkillOption[],
): MarketplaceFilters {
  const ids = Array.isArray(saved.skillIds)
    ? saved.skillIds.filter((value): value is string => typeof value === 'string')
    : [];
  const names = Array.isArray(saved.skills)
    ? saved.skills.filter((value): value is string => typeof value === 'string')
    : [];
  const idsByName = new Map(skills.map((skill) => [skill.name.toLowerCase(), skill.id]));
  const restoredIds = ids.length > 0
    ? ids
    : names.map((name) => idsByName.get(name.toLowerCase())).filter((id): id is string => Boolean(id));

  return {
    keyword: typeof saved.keyword === 'string' ? saved.keyword : '',
    skillIds: restoredIds,
    ...(typeof saved.minBudget === 'number' ? { minBudget: saved.minBudget } : {}),
    ...(typeof saved.maxBudget === 'number' ? { maxBudget: saved.maxBudget } : {}),
  };
}
