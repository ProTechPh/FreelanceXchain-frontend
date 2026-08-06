import { ProfileEditor } from '@/components/dashboard/profile-editor';
import { CustomSkillsManager } from '@/components/dashboard/custom-skills-manager';

export default function FreelancerProfilePage() {
  return <div className="space-y-6"><ProfileEditor role="freelancer" /><CustomSkillsManager /></div>;
}
