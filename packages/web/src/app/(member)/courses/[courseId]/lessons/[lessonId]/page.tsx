'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  Loader2,
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
  ChevronDown,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import { VideoPlayer } from '@/components/player/video-player';
import { useLessonProgress } from '@/hooks/use-progress';
import { api } from '@/lib/api';

// ---- Types ----

interface Material {
  id: string;
  title: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
}

interface LessonNavItem {
  id: string;
  title: string;
  sortOrder: number;
  duration?: number;
  completed: boolean;
}

interface ModuleSidebar {
  id: string;
  title: string;
  sortOrder: number;
  lessons: LessonNavItem[];
}

interface LessonDetail {
  id: string;
  title: string;
  description?: string;
  youtubeId: string;
  duration?: number;
  moduleId: string;
  moduleTitle: string;
  materials: Material[];
  previousLessonId: string | null;
  nextLessonId: string | null;
  modules: ModuleSidebar[];
}

// ---- API ----

async function fetchLesson(
  courseId: string,
  lessonId: string,
): Promise<LessonDetail> {
  const { data } = await api.get(
    `/v1/courses/${courseId}/lessons/${lessonId}`,
  );
  return data.data;
}

// ---- Helpers ----

function formatDuration(seconds?: number): string {
  if (!seconds) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---- Skeleton ----

function LessonSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)]">
      {/* Video skeleton */}
      <div className="w-full aspect-video bg-[var(--color-bg-surface)] animate-pulse" />

      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Title skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-[var(--color-bg-elevated)] animate-pulse" />
          <div className="h-8 w-3/4 rounded bg-[var(--color-bg-elevated)] animate-pulse" />
          <div className="h-4 w-full rounded bg-[var(--color-bg-elevated)] animate-pulse" />
          <div className="h-4 w-2/3 rounded bg-[var(--color-bg-elevated)] animate-pulse" />
        </div>

        {/* Button skeleton */}
        <div className="h-12 w-48 rounded-lg bg-[var(--color-bg-elevated)] animate-pulse" />

        {/* Materials skeleton */}
        <div className="space-y-3">
          <div className="h-6 w-40 rounded bg-[var(--color-bg-elevated)] animate-pulse" />
          <div className="h-14 w-full rounded-lg bg-[var(--color-bg-elevated)] animate-pulse" />
          <div className="h-14 w-full rounded-lg bg-[var(--color-bg-elevated)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// ---- Sidebar ----

function ModuleSidebarPanel({
  modules,
  currentLessonId,
  courseId,
  onNavigate,
}: {
  modules: ModuleSidebar[];
  currentLessonId: string;
  courseId: string;
  onNavigate: (lessonId: string) => void;
}) {
  // Find the module containing the current lesson and expand it by default
  const currentModuleId = modules.find((m) =>
    m.lessons.some((l) => l.id === currentLessonId),
  )?.id;

  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(currentModuleId ? [currentModuleId] : []),
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {modules.map((mod) => {
        const isExpanded = expandedModules.has(mod.id);
        const completedCount = mod.lessons.filter((l) => l.completed).length;
        const totalCount = mod.lessons.length;

        return (
          <div
            key={mod.id}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden"
          >
            {/* Module header */}
            <button
              onClick={() => toggleModule(mod.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-[var(--color-bg-elevated)]"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {mod.title}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {completedCount}/{totalCount} aulas
                </p>
              </div>
              <ChevronDown
                size={16}
                className={`ml-2 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Lessons list */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[var(--color-border)]">
                    {mod.lessons.map((lesson) => {
                      const isCurrent = lesson.id === currentLessonId;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => onNavigate(lesson.id)}
                          className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                            isCurrent
                              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle2
                              size={16}
                              className="shrink-0 text-[var(--color-success)]"
                            />
                          ) : (
                            <Circle
                              size={16}
                              className="shrink-0 text-[var(--color-text-muted)]"
                            />
                          )}
                          <span className="min-w-0 flex-1 truncate">
                            {lesson.title}
                          </span>
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
          </div>
        );
      })}
    </div>
  );
}

// ---- Page ----

export default function LessonPage() {
  const params = useParams<{ courseId: string; lessonId: string }>();
  const router = useRouter();
  const courseId = params.courseId;
  const lessonId = params.lessonId;

  const {
    data: lesson,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['lesson', courseId, lessonId],
    queryFn: () => fetchLesson(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });

  const {
    isCompleted,
    toggleComplete,
    isTogglingComplete,
    savePosition,
    markComplete,
    initialPosition,
    isLoading: isProgressLoading,
  } = useLessonProgress(courseId, lessonId);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigateToLesson = useCallback(
    (targetLessonId: string) => {
      router.push(`/courses/${courseId}/lessons/${targetLessonId}`);
    },
    [router, courseId],
  );

  if (isLoading || isProgressLoading) {
    return <LessonSkeleton />;
  }

  if (error || !lesson) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)]">
        <div className="text-center">
          <p className="text-lg text-[var(--color-text-secondary)]">
            Aula nao encontrada
          </p>
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="mt-4 rounded-lg bg-[var(--color-primary)] px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
          >
            Voltar ao curso
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-dark)]">
      {/* Video Player — full width */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        <VideoPlayer
          youtubeId={lesson.youtubeId}
          title={lesson.title}
          onProgress={savePosition}
          onComplete={markComplete}
          initialPosition={initialPosition}
        />
      </motion.div>

      {/* Content area: main + sidebar */}
      <div className="mx-auto max-w-7xl px-4 py-6 lg:flex lg:gap-8">
        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex-1 min-w-0"
        >
          {/* Module breadcrumb */}
          <p className="text-sm text-[var(--color-text-muted)]">
            {lesson.moduleTitle}
          </p>

          {/* Lesson title */}
          <h1 className="mt-1 text-2xl font-bold text-[var(--color-text-primary)] lg:text-3xl">
            {lesson.title}
          </h1>

          {/* Duration */}
          {lesson.duration && (
            <div className="mt-2 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
              <Clock size={14} />
              <span>{formatDuration(lesson.duration)}</span>
            </div>
          )}

          {/* Description */}
          {lesson.description && (
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {lesson.description}
            </p>
          )}

          {/* Mark as complete */}
          <div className="mt-6">
            <button
              onClick={toggleComplete}
              disabled={isTogglingComplete}
              className={`flex items-center gap-2.5 rounded-lg px-5 py-3 text-sm font-medium transition-all ${
                isCompleted
                  ? 'bg-[var(--color-success)]/15 text-[var(--color-success)] border border-[var(--color-success)]/30'
                  : 'bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
              }`}
            >
              {isTogglingComplete ? (
                <Loader2 size={18} className="animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 size={18} />
              ) : (
                <Circle size={18} />
              )}
              {isCompleted ? 'Aula concluida' : 'Marcar como concluida'}
            </button>
          </div>

          {/* Materials */}
          {lesson.materials.length > 0 && (
            <div className="mt-8">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text-primary)]">
                <FileText size={18} />
                Materiais de apoio
              </h2>
              <div className="mt-3 space-y-2">
                {lesson.materials.map((material) => (
                  <a
                    key={material.id}
                    href={material.fileUrl}
                    download
                    className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 transition-colors hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-bg-elevated)]"
                  >
                    <Download
                      size={16}
                      className="shrink-0 text-[var(--color-primary-light)]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {material.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {material.fileType.toUpperCase()} &middot;{' '}
                        {formatFileSize(material.fileSize)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Prev / Next navigation */}
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6">
            {lesson.previousLessonId ? (
              <button
                onClick={() => navigateToLesson(lesson.previousLessonId!)}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
              >
                <ChevronLeft size={16} />
                Anterior
              </button>
            ) : (
              <div />
            )}

            {lesson.nextLessonId ? (
              <button
                onClick={() => navigateToLesson(lesson.nextLessonId!)}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                Proxima
                <ChevronRight size={16} />
              </button>
            ) : (
              <div />
            )}
          </div>
        </motion.div>

        {/* Sidebar — module list (desktop: always visible, mobile: collapsible) */}
        <div className="mt-8 lg:mt-0 lg:w-80 lg:shrink-0">
          {/* Mobile toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] lg:hidden"
          >
            <span className="flex items-center gap-2">
              <BookOpen size={16} />
              Conteudo do curso
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${
                sidebarOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Desktop: always show, Mobile: collapsible */}
          <div className={`mt-3 lg:mt-0 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
            <h3 className="mb-3 hidden text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wider lg:block">
              Conteudo do curso
            </h3>
            <ModuleSidebarPanel
              modules={lesson.modules}
              currentLessonId={lessonId}
              courseId={courseId}
              onNavigate={navigateToLesson}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
