export type ProjectPrimaryAction = 'manage-proposals' | 'submit-proposal' | 'sign-in-to-submit' | 'none';

interface ProjectActionViewer {
  id: string;
  role: 'freelancer' | 'employer' | 'admin';
}

interface ProjectActionTarget {
  employerId: string;
  status: string;
}

export function getProjectPrimaryAction(
  viewer: ProjectActionViewer | null,
  project: ProjectActionTarget,
): ProjectPrimaryAction {
  if (viewer?.role === 'employer' && viewer.id === project.employerId) {
    return 'manage-proposals';
  }

  if (viewer?.role === 'freelancer' && project.status === 'open') {
    return 'submit-proposal';
  }

  if (!viewer && project.status === 'open') {
    return 'sign-in-to-submit';
  }

  return 'none';
}
