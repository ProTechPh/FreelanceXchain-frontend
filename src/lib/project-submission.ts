export interface ProjectSubmissionSkill {
  id: string;
  name: string;
}

export interface ProjectSubmissionMilestone {
  title: string;
  description: string;
  amount: string;
}

export interface ProjectSubmissionForm {
  title: string;
  description: string;
  skills: ProjectSubmissionSkill[];
  budget: string;
  deadline: string;
  milestones: ProjectSubmissionMilestone[];
  files: File[];
}

export interface CreateProjectPayload {
  title: string;
  description: string;
  requiredSkills: Array<{ skillId: string }>;
  budget: number;
  deadline: string;
  isRush: boolean;
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
  setMilestones(
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

export function validateProjectFiles(files: File[]): string | null {
  if (files.length > 10) {
    return 'You can attach up to 10 project files.';
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

export function validateProjectStep(
  step: number,
  form: ProjectSubmissionForm,
): string | null {
  if (step === 1) {
    if (form.title.trim().length < 5) {
      return 'Project title must be at least 5 characters.';
    }
    if (form.description.trim().length < 20) {
      return 'Project description must be at least 20 characters.';
    }
    if (form.skills.length === 0) {
      return 'Select at least one required skill.';
    }
    const fileError = validateProjectFiles(form.files);
    if (fileError) return fileError;
  }

  if (step === 2) {
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
    }
  }

  if (step === 3) {
    const budget = Number(form.budget);
    if (!Number.isFinite(budget) || budget <= 0) {
      return 'Total budget must be greater than 0.';
    }
    if (!form.deadline) {
      return 'Select a project deadline.';
    }

    const milestoneTotal = form.milestones.reduce(
      (total, milestone) => total + Number(milestone.amount),
      0,
    );
    if (Math.abs(milestoneTotal - budget) > 0.01) {
      return 'Milestone amounts must equal the total budget.';
    }
  }

  if (step === 4) {
    for (const formStep of [1, 2, 3]) {
      const error = validateProjectStep(formStep, form);
      if (error) return error;
    }
  }

  return null;
}

export async function submitProject(
  api: ProjectSubmissionApi,
  form: ProjectSubmissionForm,
): Promise<CreatedProject> {
  const validationError = validateProjectStep(4, form);
  if (validationError) {
    throw new ProjectFormValidationError(validationError);
  }

  const deadline = getDeadlineTimestamp(form.deadline);
  const projectPayload: CreateProjectPayload = {
    title: form.title.trim(),
    description: form.description.trim(),
    requiredSkills: form.skills.map((skill) => ({ skillId: skill.id })),
    budget: Number(form.budget),
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
    formData.set('budget', String(projectPayload.budget));
    formData.set('deadline', projectPayload.deadline);
    form.files.forEach((file) => formData.append('files', file));
    ({ data: createdProject } = await api.createWithAttachments(formData));
  } else {
    ({ data: createdProject } = await api.create(projectPayload));
  }

  const { data: projectWithMilestones } = await api.setMilestones(
    createdProject.id,
    {
      milestones: form.milestones.map((milestone) => ({
        title: milestone.title.trim(),
        description: milestone.description.trim(),
        amount: Number(milestone.amount),
        dueDate: deadline,
      })),
    },
  );

  return projectWithMilestones;
}
