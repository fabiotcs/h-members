'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseCard } from './course-card';

interface Course {
  id: number;
  title: string;
  description?: string;
  coverUrl: string;
  progress?: number;
  isLocked?: boolean;
  isNew?: boolean;
  price?: number;
}

interface CourseRowProps {
  title: string;
  courses: Course[];
  viewAllHref?: string;
}

export function CourseRow({ title, courses, viewAllHref }: CourseRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState);
    window.addEventListener('resize', updateScrollState);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
    };
  }, [courses]);

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  }

  if (courses.length === 0) return null;

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          {title}
        </h2>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-sm text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-primary)]"
          >
            Ver todos
            <ChevronRight size={16} />
          </Link>
        )}
      </div>

      {/* Scrollable row */}
      <div className="group relative">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute -left-2 top-1/2 z-10 hidden h-full -translate-y-1/2 items-center px-2 lg:flex"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80">
              <ChevronLeft size={22} />
            </div>
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute -right-2 top-1/2 z-10 hidden h-full -translate-y-1/2 items-center px-2 lg:flex"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 hover:bg-black/80">
              <ChevronRight size={22} />
            </div>
          </button>
        )}

        <div
          ref={scrollRef}
          className="hide-scrollbar flex gap-3 overflow-x-auto scroll-smooth pb-2"
        >
          {courses.map((course) => (
            <div key={course.id} className="w-[240px] shrink-0 sm:w-[280px]">
              <CourseCard {...course} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
