import type { EmployerProfileUpdate } from '@/lib/api/profiles';
import type { BusinessDocumentType, BusinessType, EmployerProfile } from '@/types';

export type FreelancerProfileForm = {
  bio: string;
  hourlyRate: number;
  availability: 'available' | 'busy' | 'unavailable';
};

export type EmployerProfileForm = {
  companyName: string;
  description: string;
  industry: string;
  businessType: BusinessType | '';
  tin: string;
  registrationNumber: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  /** Optional: the only business field that can be left blank. */
  website: string;
  yearEstablished: string;
};

export const BUSINESS_TYPE_OPTIONS: { value: BusinessType; label: string }[] = [
  { value: 'sole_proprietorship', label: 'Sole proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'cooperative', label: 'Cooperative' },
];

export const BUSINESS_DOCUMENT_LABELS: Record<BusinessDocumentType, string> = {
  bir_2303: 'BIR Form 2303 (Certificate of Registration)',
  dti_certificate: 'DTI Business Name Registration',
  sec_registration: 'SEC Certificate of Registration',
  mayors_permit: "Mayor's / Business Permit",
  barangay_clearance: 'Barangay Business Clearance',
  other: 'Other document',
};

/** Sole proprietors register with DTI; partnerships, corporations and cooperatives with SEC. */
export function getRequiredBusinessDocuments(businessType: BusinessType | '' | null | undefined): BusinessDocumentType[] {
  const registration: BusinessDocumentType = businessType === 'sole_proprietorship' ? 'dti_certificate' : 'sec_registration';
  return ['bir_2303', registration, 'mayors_permit'];
}

export function getRegistrationNumberLabel(businessType: BusinessType | '' | null | undefined): string {
  if (businessType === 'sole_proprietorship') return 'DTI registration number';
  if (businessType) return 'SEC registration number';
  return 'DTI / SEC registration number';
}

export function getBusinessTypeLabel(businessType: BusinessType | null | undefined): string | null {
  return BUSINESS_TYPE_OPTIONS.find((option) => option.value === businessType)?.label ?? null;
}

const BUSINESS_FIELD_LABELS: Record<string, string> = {
  companyName: 'Company name',
  description: 'Company description',
  industry: 'Industry',
  businessType: 'Business type',
  tin: 'TIN',
  registrationNumber: 'DTI / SEC registration number',
  businessAddress: 'Business address',
  businessPhone: 'Business phone',
  businessEmail: 'Business email',
  yearEstablished: 'Year established',
};

export function getBusinessFieldLabel(field: string): string {
  return BUSINESS_FIELD_LABELS[field] ?? field;
}

export type EmployerProfileTab = 'company' | 'business' | 'documents';

export const EMPLOYER_PROFILE_TABS: EmployerProfileTab[] = ['company', 'business', 'documents'];

/** Which employer profile tab each required business field is edited on. */
const EMPLOYER_FIELD_TAB: Record<string, Exclude<EmployerProfileTab, 'documents'>> = {
  companyName: 'company',
  description: 'company',
  industry: 'company',
  yearEstablished: 'company',
  businessType: 'business',
  tin: 'business',
  registrationNumber: 'business',
  businessAddress: 'business',
  businessPhone: 'business',
  businessEmail: 'business',
};

export const EMPLOYER_PROFILE_TAB_LABELS: Record<EmployerProfileTab, string> = {
  company: 'Company profile',
  business: 'Business details',
  documents: 'Documents',
};

/** The next step in the employer setup, or null on the last step. */
export function getNextEmployerTab(tab: EmployerProfileTab): EmployerProfileTab | null {
  return EMPLOYER_PROFILE_TABS[EMPLOYER_PROFILE_TABS.indexOf(tab) + 1] ?? null;
}

/** The previous step in the employer setup, or null on the first step. */
export function getPreviousEmployerTab(tab: EmployerProfileTab): EmployerProfileTab | null {
  const index = EMPLOYER_PROFILE_TABS.indexOf(tab);
  return index > 0 ? EMPLOYER_PROFILE_TABS[index - 1]! : null;
}

export function isEmployerProfileTab(value: string | null | undefined): value is EmployerProfileTab {
  return EMPLOYER_PROFILE_TABS.includes(value as EmployerProfileTab);
}

/** Missing required items grouped by the tab where they are filled in. */
export function groupMissingByTab(completeness: {
  missingFields: string[];
  missingDocuments: BusinessDocumentType[];
}): Record<EmployerProfileTab, string[]> {
  const groups: Record<EmployerProfileTab, string[]> = { company: [], business: [], documents: [] };
  for (const field of completeness.missingFields) {
    groups[EMPLOYER_FIELD_TAB[field] ?? 'company'].push(getBusinessFieldLabel(field));
  }
  groups.documents = completeness.missingDocuments.map((type) => BUSINESS_DOCUMENT_LABELS[type]);
  return groups;
}

/** The first tab (in display order) that still has missing items, or 'company'. */
export function getFirstIncompleteTab(completeness: {
  missingFields: string[];
  missingDocuments: BusinessDocumentType[];
}): EmployerProfileTab {
  const groups = groupMissingByTab(completeness);
  return EMPLOYER_PROFILE_TABS.find((tab) => groups[tab].length > 0) ?? 'company';
}

export function employerFormFromProfile(profile: EmployerProfile): EmployerProfileForm {
  return {
    companyName: profile.companyName ?? '',
    description: profile.description ?? '',
    industry: profile.industry ?? '',
    businessType: profile.businessType ?? '',
    tin: profile.tin ?? '',
    registrationNumber: profile.registrationNumber ?? '',
    businessAddress: profile.businessAddress ?? '',
    businessPhone: profile.businessPhone ?? '',
    businessEmail: profile.businessEmail ?? '',
    website: profile.website ?? '',
    yearEstablished: profile.yearEstablished ? String(profile.yearEstablished) : '',
  };
}

export function employerFormToUpdate(form: EmployerProfileForm): EmployerProfileUpdate {
  return {
    companyName: form.companyName.trim(),
    description: form.description.trim(),
    industry: form.industry.trim(),
    ...(form.businessType ? { businessType: form.businessType } : {}),
    tin: form.tin.trim(),
    registrationNumber: form.registrationNumber.trim(),
    businessAddress: form.businessAddress.trim(),
    businessPhone: form.businessPhone.trim(),
    businessEmail: form.businessEmail.trim(),
    website: form.website.trim(),
    ...(form.yearEstablished ? { yearEstablished: Number(form.yearEstablished) } : {}),
  };
}

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

const TIN_PATTERN = /^\d{3}-\d{3}-\d{3}(-\d{3,5})?$/;
const PHONE_PATTERN = /^\+?[\d\s()-]{7,20}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Every business field is required except the website. */
export function validateEmployerProfile(form: EmployerProfileForm): string | null {
  if (form.companyName.trim().length < 2) return 'Company name must be at least 2 characters.';
  if (form.description.trim().length < 10) return 'Description must be at least 10 characters.';
  if (form.industry.trim().length < 2) return 'Industry must be at least 2 characters.';
  if (!form.businessType) return 'Select your business type.';
  if (!TIN_PATTERN.test(form.tin.trim())) return 'TIN must look like 123-456-789 or 123-456-789-000.';
  const registration = form.registrationNumber.trim();
  if (registration.length < 3 || registration.length > 50) {
    return `${getRegistrationNumberLabel(form.businessType)} must be 3 to 50 characters.`;
  }
  const address = form.businessAddress.trim();
  if (address.length < 5 || address.length > 500) return 'Business address must be 5 to 500 characters.';
  if (!PHONE_PATTERN.test(form.businessPhone.trim())) return 'Enter a valid business phone number.';
  if (!EMAIL_PATTERN.test(form.businessEmail.trim())) return 'Enter a valid business email address.';
  const website = form.website.trim();
  if (website && !isHttpUrl(website)) return 'Website must start with http:// or https://.';
  const year = Number(form.yearEstablished);
  const currentYear = new Date().getFullYear();
  if (!form.yearEstablished || !Number.isInteger(year) || year < 1800 || year > currentYear) {
    return `Year established must be between 1800 and ${currentYear}.`;
  }
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
