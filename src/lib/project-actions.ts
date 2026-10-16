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

  // One account can act as both roles; never offer a proposal on your own project.
  if (viewer?.role === 'freelancer' && viewer.id !== project.employerId && project.status === 'open') {
    return 'submit-proposal';
  }

  if (!viewer && project.status === 'open') {
    return 'sign-in-to-submit';
  }

  return 'none';
}
