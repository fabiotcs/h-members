'use client';

import { useState, FormEvent, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/providers/theme-provider';

/* ------------------------------------------------------------------ */
/*  Password strength helpers                                          */
/* ------------------------------------------------------------------ */

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'Pelo menos 8 caracteres', test: (pw) => pw.length >= 8 },
  { label: 'Pelo menos 1 letra maiuscula', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'Pelo menos 1 numero', test: (pw) => /\d/.test(pw) },
];

function usePasswordStrength(password: string) {
  return useMemo(() => {
    const results = PASSWORD_RULES.map((rule) => ({
      ...rule,
      passed: rule.test(password),
    }));
    const allPassed = results.every((r) => r.passed);
    return { results, allPassed };
  }, [password]);
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const { platformName } = useTheme();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { results: strengthResults, allPassed } = usePasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allPassed && passwordsMatch && !isSubmitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token de redefinicao nao encontrado. Solicite um novo link.');
      return;
    }

    if (!allPassed) {
      setError('A senha nao atende aos requisitos minimos.');
      return;
    }

    if (!passwordsMatch) {
      setError('As senhas nao coincidem.');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/v1/auth/reset-password', {
        token,
        newPassword: password,
      });
      setIsSuccess(true);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        'Nao foi possivel redefinir sua senha. O link pode ter expirado.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ---- No token state ---- */
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)] px-4">
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[var(--color-primary)]/5 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-md"
        >
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-warning)]/15">
              <AlertTriangle size={28} className="text-[var(--color-warning)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Link invalido
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              O link de redefinicao de senha e invalido ou esta faltando o token.
              Solicite um novo link na pagina de login.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              Voltar ao login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---- Success state ---- */
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)] px-4">
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[var(--color-primary)]/5 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="relative w-full max-w-md"
        >
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center shadow-2xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success)]/15"
            >
              <ShieldCheck size={28} className="text-[var(--color-success)]" />
            </motion.div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Senha redefinida!
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Sua senha foi alterada com sucesso. Agora voce pode fazer login com
              sua nova senha.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              Ir para o login
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ---- Form state ---- */
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)] px-4">
      {/* Background gradient effect */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-b from-[var(--color-primary)]/5 via-transparent to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 shadow-2xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
              {platformName}
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Crie uma nova senha para sua conta
            </p>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 rounded-lg bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 pr-11 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Strength indicators */}
              {password.length > 0 && (
                <motion.ul
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-1.5"
                >
                  {strengthResults.map((rule) => (
                    <li
                      key={rule.label}
                      className="flex items-center gap-2 text-xs"
                    >
                      {rule.passed ? (
                        <CheckCircle2
                          size={14}
                          className="shrink-0 text-[var(--color-success)]"
                        />
                      ) : (
                        <XCircle
                          size={14}
                          className="shrink-0 text-[var(--color-text-muted)]"
                        />
                      )}
                      <span
                        className={
                          rule.passed
                            ? 'text-[var(--color-success)]'
                            : 'text-[var(--color-text-muted)]'
                        }
                      >
                        {rule.label}
                      </span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]"
              >
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
                  className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 pr-11 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Match indicator */}
              {confirmPassword.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 flex items-center gap-2 text-xs"
                >
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2
                        size={14}
                        className="text-[var(--color-success)]"
                      />
                      <span className="text-[var(--color-success)]">
                        As senhas coincidem
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle
                        size={14}
                        className="text-[var(--color-error)]"
                      />
                      <span className="text-[var(--color-error)]">
                        As senhas nao coincidem
                      </span>
                    </>
                  )}
                </motion.div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Redefinindo...
                </>
              ) : (
                'Redefinir senha'
              )}
            </button>
          </form>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-primary)]"
            >
              Voltar ao login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
