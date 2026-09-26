export interface ProposalSubmissionForm {
  proposedRate: string;
  estimatedDuration: string;
  coverLetter?: string;
  files: File[];
}

interface SubmittedProposal {
  id: string;
}

export interface ProposalSubmissionApi {
  submitWithFiles(data: FormData): Promise<{ data: SubmittedProposal }>;
}

export class ProposalFormValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProposalFormValidationError';
  }
}

import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_FORMATS_DESCRIPTION,
  isAllowedDocumentFile,
} from './file-validation.ts';

export const ALLOWED_PROPOSAL_EXTENSIONS = ALLOWED_DOCUMENT_EXTENSIONS;

/** Exported so the dialog can warn when it has to drop files, rather than
 * silently truncating the selection. */
export const MAX_FILE_COUNT = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;

// Mirrors submitProposalMultipartSchema on the API, so anything the form
// accepts the server accepts too.
export const MIN_PROPOSED_RATE = 1;
export const MAX_PROPOSED_RATE = 1_000_000;
export const MAX_DURATION_DAYS = 3650;
export const MAX_COVER_LETTER_LENGTH = 10_000;

/** Which control a validation message belongs to. */
export type ProposalField = 'proposedRate' | 'estimatedDuration' | 'files' | 'coverLetter';

export interface ProposalFieldError {
  field: ProposalField;
  message: string;
}

/**
 * Same rules as `validateProposalForm`, but says *which* field is wrong.
 *
 * The dialog used to surface these as a toast in the corner, leaving the user to
 * work out which of three inputs it meant. Naming the field lets the message sit
 * under the control it describes.
 */
export function findProposalFormError(form: ProposalSubmissionForm): ProposalFieldError | null {
  const proposedRate = Number(form.proposedRate);
  if (form.proposedRate.trim() === '' || !Number.isFinite(proposedRate) || proposedRate <= 0) {
    return { field: 'proposedRate', message: 'Proposed rate must be greater than 0.' };
  }
  if (proposedRate < MIN_PROPOSED_RATE) {
    return { field: 'proposedRate', message: `Proposed rate must be at least $${MIN_PROPOSED_RATE}.` };
  }
  if (proposedRate > MAX_PROPOSED_RATE) {
    return { field: 'proposedRate', message: 'Proposed rate cannot exceed $1,000,000.' };
  }

  const estimatedDuration = Number(form.estimatedDuration);
  if (form.estimatedDuration.trim() === '' || !Number.isFinite(estimatedDuration) || estimatedDuration < 1) {
    return { field: 'estimatedDuration', message: 'Estimated duration must be at least 1 day.' };
  }
  if (!Number.isInteger(estimatedDuration)) {
    return { field: 'estimatedDuration', message: 'Estimated duration must be a whole number of days.' };
  }
  if (estimatedDuration > MAX_DURATION_DAYS) {
    return { field: 'estimatedDuration', message: `Estimated duration cannot exceed ${MAX_DURATION_DAYS} days.` };
  }

  if (form.coverLetter && form.coverLetter.length > MAX_COVER_LETTER_LENGTH) {
    return {
      field: 'coverLetter',
      message: `Cover letter must be ${MAX_COVER_LETTER_LENGTH.toLocaleString('en-US')} characters or fewer.`,
    };
  }

  if (form.files.length === 0) {
    return { field: 'files', message: 'Attach at least one proposal file.' };
  }
  if (form.files.length > MAX_FILE_COUNT) {
    return { field: 'files', message: `You can attach up to ${MAX_FILE_COUNT} files.` };
  }
  for (const file of form.files) {
    if (!isAllowedDocumentFile(file)) {
      return {
        field: 'files',
        message: `File type not allowed for "${file.name}". ${ALLOWED_FORMATS_DESCRIPTION}`,
      };
    }
    if (file.size > MAX_FILE_SIZE) {
      return { field: 'files', message: 'Each attachment must be 10 MB or smaller.' };
    }
  }

  const totalSize = form.files.reduce((total, file) => total + file.size, 0);
  if (totalSize > MAX_TOTAL_SIZE) {
    return { field: 'files', message: 'Attachments must be 25 MB or smaller in total.' };
  }

  return null;
}

export function validateProposalForm(form: ProposalSubmissionForm): string | null {
  return findProposalFormError(form)?.message ?? null;
}

export async function submitProposal(
  api: ProposalSubmissionApi,
  projectId: string,
  form: ProposalSubmissionForm,
): Promise<SubmittedProposal> {
  const validationError = validateProposalForm(form);
  if (validationError) {
    throw new ProposalFormValidationError(validationError);
  }

  const formData = new FormData();
  formData.set('projectId', projectId);
  formData.set('proposedRate', String(Number(form.proposedRate)));
  formData.set('estimatedDuration', String(Number(form.estimatedDuration)));
  if (form.coverLetter) {
    formData.set('coverLetter', form.coverLetter);
  }
  for (const file of form.files) {
    formData.append('files', file);
  }

  const { data } = await api.submitWithFiles(formData);
  return data;
}
