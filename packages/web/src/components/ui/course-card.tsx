'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, Play } from 'lucide-react';
import { ProgressBar } from './progress-bar';
import { Badge } from './badge';

interface CourseCardProps {
  id: number;
  title: string;
  description?: string;
  coverUrl: string;
  progress?: number;
  isLocked?: boolean;
  isNew?: boolean;
  href?: string;
}

export function CourseCard({
  id,
  title,
  description,
  coverUrl,
  progress,
  isLocked = false,
  isNew = false,
  href,
}: CourseCardProps) {
  const link = href || `/courses/${id}`;

  return (
    <Link href={link} className="group block">
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-card)]"
      >
        {/* Cover image */}
        <Image
          src={coverUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <Lock size={24} className="text-[var(--color-text-muted)]" />
            </div>
          </div>
        )}

        {/* Play icon on hover (not locked) */}
        {!isLocked && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)] shadow-lg">
              <Play size={22} className="ml-0.5 text-white" fill="white" />
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex gap-1.5">
          {isNew && <Badge variant="default">Novo</Badge>}
          {isLocked && <Badge variant="lock">Adquirir</Badge>}
        </div>

        {/* Title and description at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-semibold text-white line-clamp-1">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-gray-300 opacity-0 transition-opacity duration-200 group-hover:opacity-100 line-clamp-2">
              {description}
            </p>
          )}

          {/* Progress bar */}
          {typeof progress === 'number' && progress > 0 && !isLocked && (
            <div className="mt-2">
              <ProgressBar percentage={progress} size="sm" />
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
