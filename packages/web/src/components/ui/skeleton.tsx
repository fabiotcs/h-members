interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function SkeletonBase({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-[var(--radius-card)] bg-[var(--color-bg-elevated)] ${className}`}
      style={style}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="w-[240px] shrink-0 sm:w-[280px]">
      <SkeletonBase className="aspect-[16/9] w-full" />
      <div className="mt-2 space-y-1.5 px-1">
        <SkeletonBase className="h-4 w-3/4" />
        <SkeletonBase className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <section className="space-y-3">
      <SkeletonBase className="mx-1 h-6 w-40" />
      <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </section>
  );
}

export function SkeletonBanner() {
  return (
    <SkeletonBase
      className="w-full rounded-xl"
      style={{ aspectRatio: '21/9' } as React.CSSProperties}
    />
  );
}
