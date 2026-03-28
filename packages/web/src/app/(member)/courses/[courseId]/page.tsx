'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  Lock,
  ExternalLink,
  ArrowLeft,
  ShoppingCart,
  Loader2,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useCourseProgress } from '@/hooks/use-progress';
import { api } from '@/lib/api';

// ---- Types ----

interface CourseLessonItem {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  sortOrder: number;
}

interface CourseModuleItem {
  id: string;
  title: string;
  description?: string;
  sortOrder: number;
  lessons: CourseLessonItem[];
}

interface CourseDetail {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  salesUrl?: string;
  priceInCents?: number;
  status: string;
  modules: CourseModuleItem[];
  hasAccess: boolean;
}

interface PaymentConfig {
  activeGateway: string;
}

interface CheckoutResponse {
  checkoutUrl: string;
}

// ---- API ----

async function fetchCourse(courseId: string): Promise<CourseDetail> {
  const { data } = await api.get(`/v1/courses/${courseId}`);
  return data.data;
}

async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const { data } = await api.get('/v1/payments/config');
  return data;
}

async function createCheckout(courseId: string): Promise<CheckoutResponse> {
  const { data } = await api.post(`/v1/payments/checkout/${courseId}`);
  return data;
}

function formatPriceBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

// ---- Helpers ----

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function totalCourseDuration(modules: CourseModuleItem[]): number {
  return modules.reduce(
    (acc, mod) =>
      acc + mod.lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0),
    0,
  );
}

function totalLessonCount(modules: CourseModuleItem[]): number {
  return modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
}

// ---- Skeleton ----

function CourseDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)]">
      {/* Hero skeleton */}
      <div className="relative h-64 w-full bg-[var(--color-bg-surface)] animate-pulse sm:h-80 lg:h-96" />

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="h-10 w-3/4 rounded bg-[var(--color-bg-elevated)] animate-pulse" />
        <div className="h-4 w-full rounded bg-[var(--color-bg-elevated)] animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-[var(--color-bg-elevated)] animate-pulse" />
        <div className="h-12 w-52 rounded-lg bg-[var(--color-bg-elevated)] animate-pulse" />

        {/* Module skeletons */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 w-full rounded-lg bg-[var(--color-bg-elevated)] animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

// ---- Progress bar ----

function ProgressBar({
  percentage,
  size = 'md',
}: {
  percentage: number;
  size?: 'sm' | 'md';
}) {
  const height = size === 'sm' ? 'h-1.5' : 'h-2.5';
  return (
    <div
      className={`${height} w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]`}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(percentage, 100)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={`${height} rounded-full bg-[var(--color-primary)]`}
      />
    </div>
  );
}

// ---- Module accordion ----

function ModuleAccordion({
  module,
  index,
  courseId,
  hasAccess,
  completedLessonIds,
  onLessonClick,
}: {
  module: CourseModuleItem;
  index: number;
  courseId: string;
  hasAccess: boolean;
  completedLessonIds: Set<string>;
  onLessonClick: (lessonId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(index === 0);
  const completedInModule = module.lessons.filter((l) =>
    completedLessonIds.has(l.id),
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)]"
    >
      {/* Module header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-4 text-left transition-colors hover:bg-[var(--color-bg-elevated)] sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--color-text-muted)]">
              Modulo {index + 1}
            </span>
            {hasAccess && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {completedInModule}/{module.lessons.length}
              </span>
            )}
          </div>
          <h3 className="mt-0.5 text-base font-semibold text-[var(--color-text-primary)] truncate">
            {module.title}
          </h3>
          {module.description && (
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)] truncate">
              {module.description}
            </p>
          )}
        </div>
        <div className="ml-3 flex items-center gap-3">
          <span className="hidden text-xs text-[var(--color-text-muted)] sm:block">
            {module.lessons.length} aula{module.lessons.length !== 1 ? 's' : ''}
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Lessons */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--color-border)]">
              {module.lessons.map((lesson) => {
                const isCompleted = completedLessonIds.has(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    onClick={() => onLessonClick(lesson.id)}
                    disabled={!hasAccess}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors sm:px-5 ${
                      hasAccess
                        ? 'hover:bg-[var(--color-bg-elevated)] cursor-pointer'
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Completion indicator */}
                    {hasAccess ? (
                      isCompleted ? (
                        <CheckCircle2
                          size={18}
                          className="shrink-0 text-[var(--color-success)]"
                        />
                      ) : (
                        <Circle
                          size={18}
                          className="shrink-0 text-[var(--color-text-muted)]"
                        />
                      )
                    ) : (
                      <Lock
                        size={16}
                        className="shrink-0 text-[var(--color-text-muted)]"
                      />
                    )}

                    {/* Lesson info */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate ${
                          isCompleted
                            ? 'text-[var(--color-text-muted)]'
                            : 'text-[var(--color-text-primary)]'
                        }`}
                      >
                        {lesson.title}
                      </p>
                    </div>

                    {/* Duration */}
                    {lesson.duration && (
                      <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                        {formatDuration(lesson.duration)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---- Page ----

export default function CourseDetailPage() {
  const params = useParams<{ courseId: string }>();
  const router = useRouter();
  const courseId = params.courseId;

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourse(courseId),
    enabled: !!courseId,
  });

  const { data: progress, isLoading: isProgressLoading } =
    useCourseProgress(courseId);

  const { data: paymentConfig } = useQuery({
    queryKey: ['payment-config'],
    queryFn: fetchPaymentConfig,
    staleTime: 5 * 60 * 1000, // cache for 5 min
  });

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Build set of completed lesson IDs for quick lookup
  const completedLessonIds = useMemo(() => {
    if (!progress?.lessons) return new Set<string>();
    return new Set(
      progress.lessons.filter((l) => l.completed).map((l) => l.lessonId),
    );
  }, [progress]);

  const handleLessonClick = (lessonId: string) => {
    router.push(`/courses/${courseId}/lessons/${lessonId}`);
  };

  const handleContinueWatching = () => {
    if (progress?.nextLessonId) {
      router.push(`/courses/${courseId}/lessons/${progress.nextLessonId}`);
    } else if (course?.modules?.[0]?.lessons?.[0]) {
      // If no progress yet, start from first lesson
      router.push(
        `/courses/${courseId}/lessons/${course.modules[0].lessons[0].id}`,
      );
    }
  };

  const handleSalesRedirect = () => {
    if (course?.salesUrl) {
      window.open(course.salesUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBuy = async () => {
    if (!course) return;
    setIsCheckoutLoading(true);
    try {
      const { checkoutUrl } = await createCheckout(course.id);
      window.location.href = checkoutUrl;
    } catch {
      // Fallback to sales URL if checkout fails
      if (course.salesUrl) {
        window.open(course.salesUrl, '_blank', 'noopener,noreferrer');
      }
      setIsCheckoutLoading(false);
    }
  };

  const useIntegratedCheckout =
    paymentConfig?.activeGateway &&
    paymentConfig.activeGateway !== 'none' &&
    course?.priceInCents != null &&
    course.priceInCents > 0;

  if (isLoading || isProgressLoading) {
    return <CourseDetailSkeleton />;
  }

  if (error || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)]">
        <div className="text-center">
          <p className="text-lg text-[var(--color-text-secondary)]">
            Curso nao encontrado
          </p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Voltar para a vitrine
          </button>
        </div>
      </div>
    );
  }

  const lessonCount = totalLessonCount(course.modules);
  const durationSeconds = totalCourseDuration(course.modules);
  const durationMinutes = Math.floor(durationSeconds / 60);
  const durationHours = Math.floor(durationMinutes / 60);
  const remainingMinutes = durationMinutes % 60;

  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)]">
      {/* Hero — course cover image */}
      <div className="relative h-64 w-full overflow-hidden sm:h-80 lg:h-96">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[var(--color-primary)]/30 to-[var(--color-bg-surface)]" />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-dark)] via-[var(--color-bg-dark)]/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => router.push('/')}
          className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-lg bg-black/40 px-3 py-2 text-sm text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <ArrowLeft size={16} />
          Voltar
        </button>

        {/* No-access lock overlay */}
        {!course.hasAccess && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Lock size={48} className="text-white/60" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 -mt-16 relative z-10 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Title + description */}
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl lg:text-4xl">
            {course.title}
          </h1>

          {/* Meta info */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--color-text-muted)]">
            <span>{course.modules.length} modulos</span>
            <span>{lessonCount} aulas</span>
            {durationSeconds > 0 && (
              <span className="flex items-center gap-1">
                <Clock size={14} />
                {durationHours > 0
                  ? `${durationHours}h ${remainingMinutes}min`
                  : `${durationMinutes}min`}
              </span>
            )}
            {!course.hasAccess && course.priceInCents != null && course.priceInCents > 0 && (
              <span className="font-semibold text-[var(--color-success)]">
                {formatPriceBRL(course.priceInCents)}
              </span>
            )}
          </div>

          {course.description && (
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {course.description}
            </p>
          )}

          {/* Progress bar (only if has access and started) */}
          {course.hasAccess && progress && progress.percentage > 0 && (
            <div className="mt-5 max-w-md">
              <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                <span>Seu progresso</span>
                <span>{Math.round(progress.percentage)}% concluido</span>
              </div>
              <ProgressBar percentage={progress.percentage} />
            </div>
          )}

          {/* CTA button */}
          <div className="mt-6">
            {course.hasAccess ? (
              <button
                onClick={handleContinueWatching}
                className="flex items-center gap-2.5 rounded-lg bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[var(--color-primary-hover)] hover:shadow-lg hover:shadow-[var(--color-primary)]/20"
              >
                <Play size={18} fill="white" />
                {progress && progress.percentage > 0
                  ? 'Continuar assistindo'
                  : 'Comecar a assistir'}
              </button>
            ) : useIntegratedCheckout ? (
              <button
                onClick={handleBuy}
                disabled={isCheckoutLoading}
                className="flex items-center gap-2.5 rounded-lg bg-[var(--color-success)] px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
              >
                {isCheckoutLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ShoppingCart size={18} />
                )}
                {isCheckoutLoading
                  ? 'Redirecionando...'
                  : `Comprar por ${formatPriceBRL(course!.priceInCents!)}`}
              </button>
            ) : (
              <button
                onClick={handleSalesRedirect}
                className="flex items-center gap-2.5 rounded-lg bg-[var(--color-warning)] px-6 py-3 text-sm font-semibold text-black transition-all hover:brightness-110"
              >
                <ExternalLink size={18} />
                Adquirir acesso
              </button>
            )}
          </div>

          {/* Module accordion list */}
          <div className="mt-10 space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Conteudo do curso
            </h2>
            {course.modules
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((mod, index) => (
                <ModuleAccordion
                  key={mod.id}
                  module={mod}
                  index={index}
                  courseId={courseId}
                  hasAccess={course.hasAccess}
                  completedLessonIds={completedLessonIds}
                  onLessonClick={handleLessonClick}
                />
              ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
