export type FreelancerProfileForm = {
  bio: string;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'unavailable';
};

export type EmployerProfileForm = {
  companyName: string;
  description: string;
  industry: string;
};

export type ExperienceForm = {
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string | null;
  skills: string[];
};

export function validateFreelancerProfile(form: FreelancerProfileForm): string | null {
  if (form.bio.trim().length < 10) return 'Bio must be at least 10 characters.';
  if (!Number.isFinite(form.hourlyRate) || form.hourlyRate < 1) return 'Hourly rate must be at least 1.';
  return null;
}

export function validateEmployerProfile(form: EmployerProfileForm): string | null {
  if (form.companyName.trim().length < 2) return 'Company name must be at least 2 characters.';
  if (form.description.trim().length < 10) return 'Description must be at least 10 characters.';
  if (form.industry.trim().length < 2) return 'Industry must be at least 2 characters.';
  return null;
}

export function validateExperience(form: ExperienceForm): string | null {
  if (form.title.trim().length < 2) return 'Job position must be at least 2 characters.';
  if (form.company.trim().length < 2) return 'Company must be at least 2 characters.';
  if (form.description.trim().length < 10) return 'Work history description must be at least 10 characters.';
  if (!form.startDate) return 'Start date is required.';
  if (form.endDate && form.endDate < form.startDate) return 'End date cannot be before start date.';
  return null;
}

function experienceKeyPart(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** An existing entry with the same position, company and dates, other than the one being edited. */
export function findDuplicateExperience<T extends { id: string; title: string; company: string; startDate: string; endDate: string | null }>(
  form: ExperienceForm,
  entries: T[],
  editingId: string | null,
): T | undefined {
  return entries.find(
    (entry) =>
      entry.id !== editingId &&
      experienceKeyPart(entry.title) === experienceKeyPart(form.title) &&
      experienceKeyPart(entry.company) === experienceKeyPart(form.company) &&
      experienceKeyPart(entry.startDate).slice(0, 10) === experienceKeyPart(form.startDate).slice(0, 10) &&
      experienceKeyPart(entry.endDate).slice(0, 10) === experienceKeyPart(form.endDate).slice(0, 10),
  );
}
