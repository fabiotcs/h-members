'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Loader2,
  BookOpen,
  ScrollText,
  Monitor,
  LogOut,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { FormInput, FormSelect } from '@/components/admin/form-field';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  courseAccess: { courseId: number; courseName: string; grantedAt: string }[];
}

interface Course {
  id: number;
  title: string;
}

interface LoginLog {
  id: number;
  email: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  success: boolean;
}

interface Session {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

type Tab = 'details' | 'courses' | 'logs' | 'sessions';

const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'details', label: 'Dados', icon: Save },
  { key: 'courses', label: 'Cursos', icon: BookOpen },
  { key: 'logs', label: 'Logs de Login', icon: ScrollText },
  { key: 'sessions', label: 'Sessoes', icon: Monitor },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminUserEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const userId = params.id as string;
  const isNew = userId === 'new';

  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [forceLogoutTarget, setForceLogoutTarget] = useState<Session | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('STUDENT');
  const [status, setStatus] = useState<string>('ACTIVE');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch user
  const { data: user, isLoading: userLoading } = useQuery<UserDetail>({
    queryKey: ['admin', 'user', userId],
    queryFn: async () => {
      const res = await api.get(`/v1/admin/users/${userId}`);
      return res.data;
    },
    enabled: !isNew,
  });

  // Fetch all courses (for course access)
  const { data: allCourses } = useQuery<Course[]>({
    queryKey: ['admin', 'courses-list'],
    queryFn: async () => {
      const res = await api.get('/v1/admin/courses?pageSize=200');
      return res.data.data ?? res.data;
    },
  });

  // Login logs
  const { data: loginLogs, isLoading: logsLoading } = useQuery<LoginLog[]>({
    queryKey: ['admin', 'user', userId, 'logs'],
    queryFn: async () => {
      const res = await api.get(`/v1/admin/users/${userId}/login-logs`);
      return res.data;
    },
    enabled: !isNew && activeTab === 'logs',
  });

  // Sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: ['admin', 'user', userId, 'sessions'],
    queryFn: async () => {
      const res = await api.get(`/v1/admin/users/${userId}/sessions`);
      return res.data;
    },
    enabled: !isNew && activeTab === 'sessions',
  });

  // Populate form on user load
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setStatus(user.status);
    }
  }, [user]);

  // Save mutation
  const saveMut = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = { name, email, role, status };
      if (password) body.password = password;
      if (isNew) {
        await api.post('/v1/admin/users', body);
      } else {
        await api.put(`/v1/admin/users/${userId}`, body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      if (isNew) router.push('/admin/users');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      if (typeof msg === 'string') {
        setErrors({ _form: msg });
      }
    },
  });

  // Toggle course access
  const toggleCourseMut = useMutation({
    mutationFn: async ({ courseId, grant }: { courseId: number; grant: boolean }) => {
      if (grant) {
        await api.post(`/v1/admin/users/${userId}/courses`, { courseId });
      } else {
        await api.delete(`/v1/admin/users/${userId}/courses/${courseId}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId] });
    },
  });

  // Force logout
  const forceLogoutMut = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.delete(`/v1/admin/users/${userId}/sessions/${sessionId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', userId, 'sessions'] });
      setForceLogoutTarget(null);
    },
  });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nome e obrigatorio';
    if (!email.trim()) errs.email = 'E-mail e obrigatorio';
    if (isNew && !password) errs.password = 'Senha e obrigatoria para novos usuarios';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (validate()) saveMut.mutate();
  }

  const courseAccessIds = new Set(user?.courseAccess.map((c) => c.courseId) ?? []);

  if (!isNew && userLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {isNew ? 'Novo Usuario' : user?.name}
          </h1>
          {!isNew && (
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              Criado em {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!isNew && (
        <div className="flex gap-1 border-b border-[var(--color-border)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'text-[var(--color-primary-light)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="user-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Details tab / New user form */}
      {(activeTab === 'details' || isNew) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6"
        >
          {errors._form && (
            <div className="mb-4 rounded-lg bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
              {errors._form}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <FormInput
              id="name"
              label="Nome"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
            />
            <FormInput
              id="email"
              label="E-mail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
            <FormInput
              id="password"
              label={isNew ? 'Senha' : 'Nova Senha (deixe vazio para manter)'}
              type="password"
              required={isNew}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              helperText={!isNew ? 'Deixe em branco para nao alterar' : undefined}
            />
            <FormSelect
              id="role"
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'ADMIN', label: 'Admin' },
                { value: 'STUDENT', label: 'Aluno' },
              ]}
            />
            <FormSelect
              id="status"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'ACTIVE', label: 'Ativo' },
                { value: 'INACTIVE', label: 'Inativo' },
              ]}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saveMut.isPending}
              className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMut.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isNew ? 'Criar Usuario' : 'Salvar Alteracoes'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Courses tab */}
      {activeTab === 'courses' && !isNew && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6"
        >
          <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
            Acesso a Cursos
          </h3>
          <div className="space-y-2">
            {allCourses && allCourses.length > 0 ? (
              allCourses.map((course) => {
                const hasAccess = courseAccessIds.has(course.id);
                return (
                  <label
                    key={course.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-[var(--color-bg-elevated)]"
                  >
                    <input
                      type="checkbox"
                      checked={hasAccess}
                      onChange={() =>
                        toggleCourseMut.mutate({
                          courseId: course.id,
                          grant: !hasAccess,
                        })
                      }
                      className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      {course.title}
                    </span>
                    {hasAccess && (
                      <Badge variant="success">Acesso</Badge>
                    )}
                  </label>
                );
              })
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                Nenhum curso cadastrado
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Login logs tab */}
      {activeTab === 'logs' && !isNew && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Data/Hora</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">User Agent</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Status</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)]">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : loginLogs && loginLogs.length > 0 ? (
                  loginLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]/50">
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {new Date(log.timestamp).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">{log.ip}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-xs text-[var(--color-text-muted)]">{log.userAgent}</td>
                      <td className="px-4 py-3">
                        <Badge variant={log.success ? 'success' : 'error'}>
                          {log.success ? 'Sucesso' : 'Falha'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                      Nenhum log encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Sessions tab */}
      {activeTab === 'sessions' && !isNew && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Dispositivo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Inicio</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Ultima Atividade</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--color-text-muted)]">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {sessionsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)]">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : sessions && sessions.length > 0 ? (
                  sessions.map((session) => (
                    <tr key={session.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]/50">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-muted)]">{session.ip}</td>
                      <td className="max-w-xs truncate px-4 py-3 text-xs text-[var(--color-text-muted)]">{session.userAgent}</td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                        {new Date(session.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                        {new Date(session.lastActivity).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setForceLogoutTarget(session)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
                        >
                          <LogOut size={12} />
                          Forcar Logout
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                      Nenhuma sessao ativa
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Force logout dialog */}
      <ConfirmDialog
        open={!!forceLogoutTarget}
        onClose={() => setForceLogoutTarget(null)}
        onConfirm={() => forceLogoutTarget && forceLogoutMut.mutate(forceLogoutTarget.id)}
        isLoading={forceLogoutMut.isPending}
        destructive
        title="Forcar Logout"
        message="Deseja encerrar esta sessao? O usuario sera desconectado imediatamente."
        confirmLabel="Forcar Logout"
      />
    </div>
  );
}
