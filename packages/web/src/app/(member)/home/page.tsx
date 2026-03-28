'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { api } from '@/lib/api';
import { HeroBanner } from '@/components/ui/hero-banner';
import { CourseRow } from '@/components/ui/course-row';
import { SkeletonBanner, SkeletonRow } from '@/components/ui/skeleton';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StorefrontCourse {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  salesUrl: string;
  category: { id: number; name: string; slug: string } | null;
  hasAccess: boolean;
  progress: {
    percentage: number;
    completedLessons: number;
    totalLessons: number;
  } | null;
  isNew: boolean;
  nextLesson?: { lessonId: number; title: string } | null;
}

interface CategoryGroup {
  key: string;
  title: string;
  courses: MappedCourse[];
}

interface MappedCourse {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  progress?: number;
  isLocked: boolean;
  isNew: boolean;
  href?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mapCourse(c: StorefrontCourse): MappedCourse {
  const isLocked = !c.hasAccess;

  return {
    id: c.id,
    title: c.title,
    description: c.description,
    coverUrl: c.coverImage,
    progress: c.progress?.percentage,
    isLocked,
    isNew: c.isNew,
    // Locked courses open sales URL in new tab; accessible ones go to detail
    href: isLocked ? undefined : `/courses/${c.id}`,
  };
}

function groupByCategory(courses: StorefrontCourse[]): CategoryGroup[] {
  const groups = new Map<string, CategoryGroup>();

  for (const c of courses) {
    const key = c.category?.slug ?? '_uncategorized';
    const title = c.category?.name ?? 'Outros';

    if (!groups.has(key)) {
      groups.set(key, { key, title, courses: [] });
    }
    groups.get(key)!.courses.push(mapCourse(c));
  }

  return Array.from(groups.values());
}

/* ------------------------------------------------------------------ */
/*  Container animation                                                */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const router = useRouter();

  const { data: courses, isLoading } = useQuery<StorefrontCourse[]>({
    queryKey: ['storefront'],
    queryFn: async () => {
      const { data } = await api.get('/v1/storefront');
      return data;
    },
  });

  /* ---- derived data ---- */

  const featured = useMemo(() => {
    if (!courses) return [];
    // First 3 courses with access (prefer those with cover images)
    return courses
      .filter((c) => c.hasAccess && c.coverImage)
      .slice(0, 3)
      .map((c) => ({
        id: c.id,
        title: c.title,
        description: c.description,
        coverUrl: c.coverImage,
        href: `/courses/${c.id}`,
      }));
  }, [courses]);

  const continueWatching = useMemo(() => {
    if (!courses) return [];
    return courses
      .filter(
        (c) =>
          c.hasAccess &&
          c.progress &&
          c.progress.percentage > 0 &&
          c.progress.percentage < 100,
      )
      .sort((a, b) => (b.progress?.percentage ?? 0) - (a.progress?.percentage ?? 0))
      .map(mapCourse);
  }, [courses]);

  const newCourses = useMemo(() => {
    if (!courses) return [];
    return courses.filter((c) => c.isNew).map(mapCourse);
  }, [courses]);

  const categoryGroups = useMemo(() => {
    if (!courses) return [];
    return groupByCategory(courses);
  }, [courses]);

  /* ---- Handle locked course clicks ---- */
  // CourseCard uses Link; for locked courses without href, we intercept globally
  function handleLockedClick(salesUrl: string) {
    window.open(salesUrl, '_blank', 'noopener,noreferrer');
  }

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-10 px-4 py-6 md:px-8">
        <SkeletonBanner />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  /* ---- Empty state ---- */
  if (!courses || courses.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-bg-elevated)]">
          <BookOpen size={36} className="text-[var(--color-text-muted)]" />
        </div>
        <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
          Nenhum curso disponivel ainda
        </h2>
        <p className="max-w-md text-sm text-[var(--color-text-secondary)]">
          Em breve novos cursos estarao disponiveis na plataforma. Fique de olho!
        </p>
      </div>
    );
  }

  /* ---- Main render ---- */
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mx-auto max-w-[1400px] space-y-10 px-4 py-6 md:px-8"
    >
      {/* Hero Banner */}
      {featured.length > 0 && (
        <motion.div variants={itemVariants}>
          <HeroBanner courses={featured} />
        </motion.div>
      )}

      {/* Continue watching */}
      {continueWatching.length > 0 && (
        <motion.div variants={itemVariants}>
          <CourseRow title="Continuar Assistindo" courses={continueWatching} />
        </motion.div>
      )}

      {/* New courses */}
      {newCourses.length > 0 && (
        <motion.div variants={itemVariants}>
          <CourseRow title="Novos" courses={newCourses} />
        </motion.div>
      )}

      {/* Category rows */}
      {categoryGroups.map((group) => (
        <motion.div key={group.key} variants={itemVariants}>
          <CourseRow title={group.title} courses={group.courses} />
        </motion.div>
      ))}
    </motion.div>
  );
}
