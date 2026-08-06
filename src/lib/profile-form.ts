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
  if (form.title.trim().length < 2) return 'Job title must be at least 2 characters.';
  if (form.company.trim().length < 2) return 'Company must be at least 2 characters.';
  if (form.description.trim().length < 10) return 'Experience description must be at least 10 characters.';
  if (!form.startDate) return 'Start date is required.';
  if (form.endDate && form.endDate < form.startDate) return 'End date cannot be before start date.';
  return null;
}
