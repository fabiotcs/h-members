'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CheckCircle, Home } from 'lucide-react';
import { api } from '@/lib/api';

async function fetchCourseName(courseId: string): Promise<string> {
  const { data } = await api.get(`/v1/courses/${courseId}`);
  return data.data?.title ?? '';
}

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId');

  const { data: courseName } = useQuery({
    queryKey: ['course-name', courseId],
    queryFn: () => fetchCourseName(courseId!),
    enabled: !!courseId,
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center shadow-xl"
      >
        {/* Animated checkmark */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-success)]/15"
        >
          <CheckCircle size={48} className="text-[var(--color-success)]" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="text-2xl font-bold text-[var(--color-text-primary)]"
        >
          Parabens!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="mt-2 text-sm text-[var(--color-text-secondary)]"
        >
          Seu pagamento foi confirmado.
        </motion.p>

        {/* Course name */}
        {courseName && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.3 }}
            className="mt-4 rounded-lg bg-[var(--color-bg-elevated)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)]"
          >
            {courseName}
          </motion.p>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.3 }}
          className="mt-8 space-y-3"
        >
          {courseId && (
            <button
              onClick={() => router.push(`/courses/${courseId}`)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] hover:shadow-lg hover:shadow-[var(--color-primary)]/20"
            >
              Acessar Curso
            </button>
          )}

          <button
            onClick={() => router.push('/')}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--color-border)] px-6 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
          >
            <Home size={16} />
            Voltar para Home
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
