'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  subtitle?: string;
}

export function StatCard({ title, value, icon: Icon, trend, subtitle }: StatCardProps) {
  const isPositive = trend && trend.value >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--color-text-muted)]">{title}</p>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
          <Icon size={20} className="text-[var(--color-primary-light)]" />
        </div>
      </div>
      {(trend || subtitle) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <>
              <span
                className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                  isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
                }`}
              >
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">{trend.label}</span>
            </>
          )}
          {subtitle && !trend && (
            <span className="text-xs text-[var(--color-text-muted)]">{subtitle}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
