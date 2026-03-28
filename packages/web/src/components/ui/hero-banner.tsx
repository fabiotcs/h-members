'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

interface FeaturedCourse {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  href?: string;
}

interface HeroBannerProps {
  courses: FeaturedCourse[];
  autoRotateMs?: number;
}

export function HeroBanner({ courses, autoRotateMs = 6000 }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % courses.length);
  }, [courses.length]);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + courses.length) % courses.length);
  }, [courses.length]);

  useEffect(() => {
    if (courses.length <= 1) return;
    const interval = setInterval(next, autoRotateMs);
    return () => clearInterval(interval);
  }, [courses.length, autoRotateMs, next]);

  if (courses.length === 0) return null;

  const course = courses[current];

  return (
    <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: '21/9' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={course.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {course.coverUrl ? (
            <Image
              src={course.coverUrl}
              alt={course.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)]">
              <span className="text-6xl font-bold text-[var(--color-text-muted)] opacity-20">{course.title.charAt(0)}</span>
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-dark)] via-[var(--color-bg-dark)]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg-dark)]/80 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 flex max-w-2xl flex-col gap-4 p-6 md:p-10">
            <h2 className="text-2xl font-bold text-white md:text-4xl">
              {course.title}
            </h2>
            <p className="text-sm text-gray-300 md:text-base line-clamp-2">
              {course.description}
            </p>
            <Link
              href={course.href || `/courses/${course.id}`}
              className="inline-flex w-fit items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              <Play size={18} fill="white" />
              Assistir agora
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation arrows */}
      {courses.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
          >
            <ChevronRight size={22} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 right-6 flex gap-1.5 md:right-10">
            {courses.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === current
                    ? 'w-6 bg-[var(--color-primary)]'
                    : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
