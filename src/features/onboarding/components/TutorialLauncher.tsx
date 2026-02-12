import { useAuthStore } from '../../../store';
import { useOnboardingStore } from '../store';

interface TutorialLauncherProps {
  className?: string;
}

export function TutorialLauncher({ className }: TutorialLauncherProps) {
  const { user } = useAuthStore();
  const { restart } = useOnboardingStore();

  if (!user || user.role !== 'freelancer') return null;

  return (
    <button
      type="button"
      className={className ?? 'px-3 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors'}
      onClick={() => restart(user.id)}
    >
      Restart Onboarding Tutorial
    </button>
  );
}
