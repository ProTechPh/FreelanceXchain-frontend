interface TutorialProgressProps {
  current: number;
  total: number;
}

export function TutorialProgress({ current, total }: TutorialProgressProps) {
  const safeTotal = Math.max(total, 1);
  const progress = Math.min(100, Math.max(0, (current / safeTotal) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-gray-400">Tutorial progress</span>
        <span className="text-gray-700 dark:text-gray-300">
          Step {current} of {safeTotal}
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-white/10">
        <div
          className="h-2 rounded-full bg-primary-600 dark:bg-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
