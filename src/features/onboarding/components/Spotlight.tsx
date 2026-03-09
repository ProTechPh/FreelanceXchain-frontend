interface SpotlightProps {
  rect: DOMRect | null;
  padding?: number;
  blockInteraction?: boolean;
  onBackdropClick?: () => void;
}

export function Spotlight({
  rect,
  padding = 8,
  blockInteraction = false,
  onBackdropClick,
}: SpotlightProps) {
  if (!rect) {
    return (
      <div
        className="fixed inset-0 z-[90] bg-black/55 dark:bg-black/65"
        onClick={blockInteraction ? onBackdropClick : undefined}
      />
    );
  }

  const top = Math.max(0, rect.top - padding);
  const left = Math.max(0, rect.left - padding);
  const width = rect.width + padding * 2;
  const height = rect.height + padding * 2;

  return (
    <>
      {blockInteraction && (
        <div className="fixed inset-0 z-[90] bg-black/20" onClick={onBackdropClick} />
      )}
      <div
        className="fixed z-[91] rounded-xl border border-primary-500/60 dark:border-primary-400/60 pointer-events-none"
        style={{
          top,
          left,
          width,
          height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        }}
      />
    </>
  );
}
