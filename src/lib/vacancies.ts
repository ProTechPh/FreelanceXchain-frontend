/**
 * How many freelancer spots on a project are still open, shown instead of how
 * many have been hired. A project without a limit has one spot.
 */
export function getVacancies(project: { freelancerLimit?: number | null; hiredCount?: number | null }): {
  left: number;
  total: number;
} {
  const total = Math.max(1, project.freelancerLimit || 1);
  const left = Math.max(0, total - (project.hiredCount ?? 0));
  return { left, total };
}

/** e.g. "4 of 5 vacancies left", "1 of 1 vacancy left", "No vacancies left". */
export function formatVacancies(project: { freelancerLimit?: number | null; hiredCount?: number | null }): string {
  const { left, total } = getVacancies(project);
  if (left === 0) return 'No vacancies left';
  return `${left} of ${total} ${total === 1 ? 'vacancy' : 'vacancies'} left`;
}
