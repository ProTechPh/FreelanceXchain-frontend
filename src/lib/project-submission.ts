export interface ProjectSubmissionSkill {
  id: string;
  name: string;
}

export interface ProjectSubmissionMilestone {
  title: string;
  description: string;
  amount: string;
  durationDays?: string | number;
}

export interface ProjectSubmissionForm {
  title: string;
  description: string;
  skills: ProjectSubmissionSkill[];
  freelancerLimit?: number;
  budget?: string;
  deadline?: string;
  milestones?: ProjectSubmissionMilestone[];
  files: File[];
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  requiredSkills: Array<{ skillId: string }>;
  freelancerLimit?: number;
  budget?: number;
  deadline?: string;
  isRush?: boolean;
}

export interface SetProjectMilestonesPayload {
  milestones: Array<{
    title: string;
    description: string;
    amount: number;
    dueDate: string;
  }>;
}

interface CreatedProject {
  id: string;
}

export interface ProjectSubmissionApi {
  create(data: CreateProjectPayload): Promise<{ data: CreatedProject }>;
  createWithAttachments?(data: FormData): Promise<{ data: CreatedProject }>;
  setMilestones?(
    projectId: string,
    data: SetProjectMilestonesPayload,
  ): Promise<{ data: CreatedProject }>;
}

export class ProjectFormValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectFormValidationError';
  }
}

import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_FORMATS_DESCRIPTION,
  isAllowedDocumentFile,
} from './file-validation.ts';
import { countMeaningfulChars } from './text-validation.ts';

export const ALLOWED_PROJECT_EXTENSIONS = ALLOWED_DOCUMENT_EXTENSIONS;

export function validateProjectFiles(files: File[]): string | null {
  if (files.length > 10) {
    return 'You can attach up to 10 project files.';
  }
  for (const file of files) {
    if (!isAllowedDocumentFile(file)) {
      return `File type not allowed for "${file.name}". ${ALLOWED_FORMATS_DESCRIPTION}`;
    }
  }
  if (files.some((file) => file.size > 10 * 1024 * 1024)) {
    return 'Each project attachment must be 10 MB or smaller.';
  }
  if (files.reduce((total, file) => total + file.size, 0) > 25 * 1024 * 1024) {
    return 'Project attachments must total 25 MB or less.';
  }
  return null;
}

function getDeadlineTimestamp(deadline: string): string {
  return `${deadline}T23:59:59.999Z`;
}

/** Most freelancers a single project can take on. */
export const MAX_FREELANCER_LIMIT = 50;

/**
 * Problem with the "Freelancers needed" value as typed, or null when it is fine.
 * It can't drop below the freelancers already hired on the project.
 */
export function getFreelancerLimitError(value: string, hiredCount = 0): string | null {
  const text = value.trim();
  if (text === '') return 'Enter how many freelancers you need.';
  const limit = Number(text);
  if (!Number.isInteger(limit) || limit < 1) return 'Enter a whole number of at least 1.';
  if (limit > MAX_FREELANCER_LIMIT) return `You can take on at most ${MAX_FREELANCER_LIMIT} freelancers.`;
  if (limit < hiredCount) return `You've already hired ${hiredCount}, so this can't be lower than ${hiredCount}.`;
  return null;
}

export function validateProjectStep(
  step: number,
  form: ProjectSubmissionForm,
): string | null {
  if (step === 1) {
    if (countMeaningfulChars(form.title) < 5) {
      return 'Project title must include at least 5 letters or numbers.';
    }
    if (countMeaningfulChars(form.description) < 20) {
      return 'Project description must include at least 20 letters or numbers.';
    }
    if (form.skills.length === 0) {
      return 'Select at least one required skill.';
    }
    if (form.freelancerLimit !== undefined && (!Number.isInteger(form.freelancerLimit) || form.freelancerLimit < 1)) {
      return 'Freelancer limit must be at least 1.';
    }
    const fileError = validateProjectFiles(form.files);
    if (fileError) return fileError;
  }

  if (step === 2 && form.milestones && form.milestones.length > 0) {
    for (const [index, milestone] of form.milestones.entries()) {
      if (!milestone.title.trim()) {
        return `Milestone ${index + 1} needs a title.`;
      }
      if (!milestone.description.trim()) {
        return `Milestone ${index + 1} needs a description.`;
      }
      const amount = Number(milestone.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return `Milestone ${index + 1} needs a positive amount.`;
      }
      if (milestone.durationDays !== undefined && String(milestone.durationDays).trim() !== '') {
        const days = Number(milestone.durationDays);
        if (!Number.isInteger(days) || days <= 0) {
          return `Milestone ${index + 1} duration must be a positive number of days.`;
        }
      }
    }
  }

  if (step === 3 && form.budget) {
    const budget = Number(form.budget);
    if (!Number.isFinite(budget) || budget < 0) {
      return 'Budget must be a non-negative number.';
    }
    if (form.milestones && form.milestones.length > 0) {
      const milestoneTotal = form.milestones.reduce(
        (sum, m) => sum + (Number(m.amount) || 0),
        0,
      );
      if (Math.abs(milestoneTotal - budget) > 0.001) {
        return 'Milestone amounts must equal the total budget.';
      }
    }
  }

  if (step === 4) {
    const error = validateProjectStep(1, form);
    if (error) return error;
  }

  return null;
}

export async function submitProject(
  api: ProjectSubmissionApi,
  form: ProjectSubmissionForm,
  options?: { now?: Date },
): Promise<CreatedProject> {
  const validationError = validateProjectStep(1, form);
  if (validationError) {
    throw new ProjectFormValidationError(validationError);
  }

  const deadline = form.deadline
    ? getDeadlineTimestamp(form.deadline)
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  const projectPayload: CreateProjectPayload = {
    title: form.title.trim(),
    description: form.description.trim(),
    requiredSkills: form.skills.map((skill) => ({ skillId: skill.id })),
    freelancerLimit: form.freelancerLimit && form.freelancerLimit >= 1 ? form.freelancerLimit : 1,
    budget: form.budget ? Number(form.budget) : 0,
    deadline,
    isRush: false,
  };

  let createdProject: CreatedProject;
  if (form.files.length > 0) {
    if (!api.createWithAttachments) {
      throw new Error('Project attachment uploads are unavailable.');
    }
    const formData = new FormData();
    formData.set('title', projectPayload.title);
    formData.set('description', projectPayload.description);
    formData.set('requiredSkills', JSON.stringify(projectPayload.requiredSkills));
    formData.set('freelancerLimit', String(projectPayload.freelancerLimit));
    formData.set('budget', String(projectPayload.budget));
    formData.set('deadline', projectPayload.deadline ?? deadline);
    form.files.forEach((file) => formData.append('files', file));
    ({ data: createdProject } = await api.createWithAttachments(formData));
  } else {
    ({ data: createdProject } = await api.create(projectPayload));
  }

  if (api.setMilestones && form.milestones && form.milestones.length > 0) {
    const now = options?.now ?? new Date();
    let cumulativeDays = 0;
    const milestonesPayload = form.milestones.map((milestone) => {
      let milestoneDueDate = deadline;
      const rawDays = milestone.durationDays !== undefined && String(milestone.durationDays).trim() !== ''
        ? Number(milestone.durationDays)
        : null;

      if (rawDays !== null && Number.isInteger(rawDays) && rawDays > 0) {
        cumulativeDays += rawDays;
        const targetDate = new Date(now.getTime() + cumulativeDays * 24 * 60 * 60 * 1000);
        const targetIso = `${targetDate.toISOString().split('T')[0]}T23:59:59.999Z`;
        if (new Date(targetIso).getTime() <= new Date(deadline).getTime()) {
          milestoneDueDate = targetIso;
        }
      }

      return {
        title: milestone.title.trim(),
        description: milestone.description.trim(),
        amount: Number(milestone.amount),
        dueDate: milestoneDueDate,
      };
    });

    const { data: projectWithMilestones } = await api.setMilestones(
      createdProject.id,
      {
        milestones: milestonesPayload,
      },
    );
    return projectWithMilestones;
  }

  return createdProject;
}
