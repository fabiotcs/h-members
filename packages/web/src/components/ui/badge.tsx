import { ReactNode } from 'react';
import { Lock } from 'lucide-react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'lock';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default:
    'bg-[var(--color-primary)] text-white',
  success:
    'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30',
  warning:
    'bg-[var(--color-warning)]/15 text-[var(--color-warning)] border border-[var(--color-warning)]/30',
  error:
    'bg-[var(--color-error)]/15 text-[var(--color-error)] border border-[var(--color-error)]/30',
  lock:
    'bg-black/60 text-[var(--color-text-muted)] backdrop-blur-sm',
};

export function Badge({ children, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${variantStyles[variant]}`}
    >
      {variant === 'lock' && <Lock size={10} />}
      {children}
    </span>
  );
}
