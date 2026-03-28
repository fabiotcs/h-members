'use client';

import { useState, useEffect, FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2,
  Eye,
  EyeOff,
  User,
  Lock,
  Monitor,
  LogOut,
  Check,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Session {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  current: boolean;
}

/* ------------------------------------------------------------------ */
/*  Shared styles                                                      */
/* ------------------------------------------------------------------ */

const inputClass =
  'w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]';

const labelClass =
  'mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]';

const cardClass =
  'rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-lg';

const buttonPrimary =
  'flex items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-60 disabled:cursor-not-allowed';

const buttonDanger =
  'flex items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-5 py-2.5 text-sm font-semibold text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/20 disabled:opacity-60 disabled:cursor-not-allowed';

/* ------------------------------------------------------------------ */
/*  Feedback banner                                                    */
/* ------------------------------------------------------------------ */

function FeedbackBanner({
  type,
  message,
}: {
  type: 'success' | 'error';
  message: string;
}) {
  const isSuccess = type === 'success';
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`mb-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
        isSuccess
          ? 'bg-emerald-500/10 text-emerald-400'
          : 'bg-[var(--color-error)]/10 text-[var(--color-error)]'
      }`}
    >
      {isSuccess ? <Check size={16} /> : <AlertCircle size={16} />}
      {message}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: parse user-agent into a friendly browser string            */
/* ------------------------------------------------------------------ */

function parseBrowser(ua: string): string {
  if (!ua) return 'Navegador desconhecido';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Microsoft Edge';
  if (ua.includes('Chrome')) return 'Google Chrome';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  return ua.slice(0, 40);
}

/* ------------------------------------------------------------------ */
/*  Section 1 — Personal Info                                          */
/* ------------------------------------------------------------------ */

function PersonalInfoSection() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);

  const [name, setName] = useState(user?.name ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (!name.trim()) {
      setFeedback({ type: 'error', message: 'O nome não pode ficar vazio.' });
      return;
    }

    setIsSaving(true);
    try {
      await api.patch('/v1/users/me', { name: name.trim() });
      await fetchMe();
      setFeedback({ type: 'success', message: 'Nome atualizado com sucesso!' });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Erro ao atualizar o nome.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={cardClass}
    >
      <div className="mb-5 flex items-center gap-2 text-[var(--color-text-primary)]">
        <User size={20} />
        <h2 className="text-lg font-semibold">Informacoes Pessoais</h2>
      </div>

      {feedback && (
        <FeedbackBanner type={feedback.type} message={feedback.message} />
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="profile-name" className={labelClass}>
            Nome
          </label>
          <input
            id="profile-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Seu nome"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label htmlFor="profile-email" className={labelClass}>
            Email
          </label>
          <input
            id="profile-email"
            type="email"
            value={user?.email ?? ''}
            readOnly
            className={`${inputClass} cursor-not-allowed opacity-60`}
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className={buttonPrimary}>
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section 2 — Change Password                                        */
/* ------------------------------------------------------------------ */

function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 6) {
      setFeedback({
        type: 'error',
        message: 'A nova senha deve ter pelo menos 6 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({
        type: 'error',
        message: 'A nova senha e a confirmacao nao coincidem.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/v1/auth/change-password', {
        currentPassword,
        newPassword,
      });
      setFeedback({ type: 'success', message: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Erro ao alterar a senha.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSaving(false);
    }
  }

  function PasswordToggle({
    show,
    onToggle,
  }: {
    show: boolean;
    onToggle: () => void;
  }) {
    return (
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className={cardClass}
    >
      <div className="mb-5 flex items-center gap-2 text-[var(--color-text-primary)]">
        <Lock size={20} />
        <h2 className="text-lg font-semibold">Alterar Senha</h2>
      </div>

      {feedback && (
        <FeedbackBanner type={feedback.type} message={feedback.message} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current password */}
        <div>
          <label htmlFor="current-password" className={labelClass}>
            Senha atual
          </label>
          <div className="relative">
            <input
              id="current-password"
              type={showCurrent ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="********"
              className={`${inputClass} pr-11`}
            />
            <PasswordToggle
              show={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
            />
          </div>
        </div>

        {/* New password */}
        <div>
          <label htmlFor="new-password" className={labelClass}>
            Nova senha
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={showNew ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="********"
              className={`${inputClass} pr-11`}
            />
            <PasswordToggle
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
            />
          </div>
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm-password" className={labelClass}>
            Confirmar nova senha
          </label>
          <div className="relative">
            <input
              id="confirm-password"
              type={showConfirm ? 'text' : 'password'}
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              className={`${inputClass} pr-11`}
            />
            <PasswordToggle
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={isSaving} className={buttonPrimary}>
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Alterando...
              </>
            ) : (
              'Alterar senha'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section 3 — Active Sessions                                        */
/* ------------------------------------------------------------------ */

function ActiveSessionsSection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    setIsLoading(true);
    try {
      const { data } = await api.get('/v1/auth/sessions');
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRevokeAll() {
    setFeedback(null);
    setIsRevoking(true);
    try {
      await api.post('/v1/auth/sessions/revoke-all');
      setFeedback({
        type: 'success',
        message: 'Todas as sessoes foram encerradas. Voce sera redirecionado.',
      });
      // Give user a moment to read, then redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Erro ao encerrar as sessoes.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsRevoking(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className={cardClass}
    >
      <div className="mb-5 flex items-center gap-2 text-[var(--color-text-primary)]">
        <Monitor size={20} />
        <h2 className="text-lg font-semibold">Sessoes Ativas</h2>
      </div>

      {feedback && (
        <FeedbackBanner type={feedback.type} message={feedback.message} />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2
            size={24}
            className="animate-spin text-[var(--color-text-muted)]"
          />
        </div>
      ) : sessions.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
          Nenhuma sessao encontrada.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                  {parseBrowser(session.userAgent)}
                  {session.current && (
                    <span className="ml-2 inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400">
                      atual
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  IP: {session.ip} &middot;{' '}
                  {new Date(session.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {sessions.length > 0 && (
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={handleRevokeAll}
            disabled={isRevoking}
            className={buttonDanger}
          >
            {isRevoking ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Encerrando...
              </>
            ) : (
              <>
                <LogOut size={16} />
                Sair de todos os dispositivos
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)]">
      {/* Background gradient */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[var(--color-primary)]/5 via-transparent to-transparent" />

      <div className="relative mx-auto max-w-2xl px-4 py-12">
        <motion.h1
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-3xl font-bold text-[var(--color-text-primary)]"
        >
          Meu Perfil
        </motion.h1>

        <div className="space-y-6">
          <PersonalInfoSection />
          <ChangePasswordSection />
          <ActiveSessionsSection />
        </div>
      </div>
    </div>
  );
}
