'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  CheckCircle,
  LogIn,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/admin/stat-card';

interface DashboardData {
  totalUsers: number;
  usersGrowth: number;
  totalCourses: { active: number; draft: number; inactive: number; total: number };
  lessonsCompleted30d: number;
  lessonsCompletedGrowth: number;
  logins7d: number;
  loginsGrowth: number;
  recentActivity: {
    id: number;
    type: string;
    description: string;
    timestamp: string;
  }[];
}

const fallbackData: DashboardData = {
  totalUsers: 0,
  usersGrowth: 0,
  totalCourses: { active: 0, draft: 0, inactive: 0, total: 0 },
  lessonsCompleted30d: 0,
  lessonsCompletedGrowth: 0,
  logins7d: 0,
  loginsGrowth: 0,
  recentActivity: [],
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/v1/admin/dashboard');
      return res.data;
    },
    placeholderData: fallbackData,
  });

  const stats = data ?? fallbackData;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Visao geral da plataforma
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total de Usuarios"
          value={stats.totalUsers.toLocaleString('pt-BR')}
          icon={Users}
          trend={{ value: stats.usersGrowth, label: 'vs. mes anterior' }}
        />
        <StatCard
          title="Total de Cursos"
          value={stats.totalCourses.total}
          icon={BookOpen}
          subtitle={`${stats.totalCourses.active} ativos / ${stats.totalCourses.draft} rascunho / ${stats.totalCourses.inactive} inativos`}
        />
        <StatCard
          title="Aulas Concluidas"
          value={stats.lessonsCompleted30d.toLocaleString('pt-BR')}
          icon={CheckCircle}
          trend={{ value: stats.lessonsCompletedGrowth, label: 'ultimos 30 dias' }}
        />
        <StatCard
          title="Logins"
          value={stats.logins7d.toLocaleString('pt-BR')}
          icon={LogIn}
          trend={{ value: stats.loginsGrowth, label: 'ultimos 7 dias' }}
        />
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-4">
          <Activity size={18} className="text-[var(--color-primary-light)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Atividade Recente
          </h2>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="h-4 w-4 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
                <div className="ml-auto h-3 w-24 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
              </div>
            ))
          ) : stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {item.description}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                  {new Date(item.timestamp).toLocaleString('pt-BR')}
                </span>
              </motion.div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">
              Nenhuma atividade recente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
