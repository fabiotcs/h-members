'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  CheckCircle,
  LogIn,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api';
import { StatCard } from '@/components/admin/stat-card';

interface DashboardData {
  users: { total: number; active: number };
  courses: { total: number; active: number; draft: number };
  lessonsCompleted30d: number;
  logins7d: number;
  recentUsers: {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }[];
}

const fallbackData: DashboardData = {
  users: { total: 0, active: 0 },
  courses: { total: 0, active: 0, draft: 0 },
  lessonsCompleted30d: 0,
  logins7d: 0,
  recentUsers: [],
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
          value={stats.users.total}
          icon={Users}
        />
        <StatCard
          title="Total de Cursos"
          value={stats.courses.total}
          icon={BookOpen}
        />
        <StatCard
          title="Aulas Concluidas"
          value={stats.lessonsCompleted30d}
          icon={CheckCircle}
        />
        <StatCard
          title="Logins (7 dias)"
          value={stats.logins7d}
          icon={LogIn}
        />
      </div>

      {/* Recent users */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-5 py-4">
          <Activity size={18} className="text-[var(--color-primary-light)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Usuarios Recentes
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
          ) : stats.recentUsers.length > 0 ? (
            stats.recentUsers.map((user, idx) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between px-5 py-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--color-primary)' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      {user.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full px-2 py-0.5 text-xs font-medium" style={{
                    backgroundColor: user.role === 'ADMIN' ? 'var(--color-primary)' : 'var(--color-bg-elevated)',
                    color: user.role === 'ADMIN' ? 'white' : 'var(--color-text-secondary)',
                  }}>
                    {user.role === 'ADMIN' ? 'Admin' : 'Aluno'}
                  </span>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-[var(--color-text-muted)]">
              Nenhum usuario cadastrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
