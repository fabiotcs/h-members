interface ProgressBarProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const heights: Record<string, string> = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  percentage,
  size = 'md',
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percentage));

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex-1 overflow-hidden rounded-full bg-[var(--color-bg-elevated)] ${heights[size]}`}
      >
        <div
          className={`${heights[size]} rounded-full bg-[var(--color-primary)] transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="shrink-0 text-xs font-medium text-[var(--color-text-muted)]">
          {Math.round(clamped)}%
        </span>
      )}
    </div>
  );
}
