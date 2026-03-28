'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function PaymentCancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get('courseId');

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 text-center shadow-xl"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 12 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-error)]/15"
        >
          <XCircle size={48} className="text-[var(--color-error)]" />
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="text-2xl font-bold text-[var(--color-text-primary)]"
        >
          Pagamento cancelado
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="mt-2 text-sm text-[var(--color-text-secondary)]"
        >
          Voce pode tentar novamente a qualquer momento.
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="mt-8 space-y-3"
        >
          <button
            onClick={() =>
              router.push(courseId ? `/courses/${courseId}` : '/')
            }
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] hover:shadow-lg hover:shadow-[var(--color-primary)]/20"
          >
            <ArrowLeft size={16} />
            {courseId ? 'Voltar para o Curso' : 'Voltar para Home'}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
