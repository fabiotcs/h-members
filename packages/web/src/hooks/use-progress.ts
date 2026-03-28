'use client';

import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ---- Types ----

interface LessonProgress {
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
  videoPosition: number;
}

interface CourseProgress {
  courseId: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lessons: LessonProgress[];
  nextLessonId: string | null;
}

// ---- API calls ----

async function fetchCourseProgress(courseId: string): Promise<CourseProgress> {
  const { data } = await api.get(`/v1/progress/course/${courseId}`);
  return data.data ?? data;
}

async function fetchLessonProgress(
  _courseId: string,
  lessonId: string,
): Promise<LessonProgress> {
  // Fetch course-level lesson progress and find the specific lesson
  const { data } = await api.get(
    `/v1/progress/course/${_courseId}/lessons`,
  );
  const lessons = data.data ?? data;
  const lesson = Array.isArray(lessons)
    ? lessons.find((l: LessonProgress) => l.lessonId === lessonId)
    : null;
  return lesson ?? { lessonId, completed: false, completedAt: null, videoPosition: 0 };
}

async function saveVideoPosition(
  _courseId: string,
  lessonId: string,
  position: number,
): Promise<void> {
  await api.put(`/v1/progress/lesson/${lessonId}/position`, {
    position,
  });
}

async function markLessonComplete(
  _courseId: string,
  lessonId: string,
): Promise<void> {
  await api.post(`/v1/progress/lesson/${lessonId}/complete`);
}

async function markLessonIncomplete(
  _courseId: string,
  lessonId: string,
): Promise<void> {
  await api.delete(`/v1/progress/lesson/${lessonId}/complete`);
}

// ---- Hooks ----

/**
 * Hook for managing course-level progress.
 * FR-041: Calculate and display percentage progress per course.
 * FR-044: "Continue watching" links to next uncompleted lesson.
 */
export function useCourseProgress(courseId: string) {
  return useQuery({
    queryKey: ['course-progress', courseId],
    queryFn: () => fetchCourseProgress(courseId),
    enabled: !!courseId,
  });
}

/**
 * Hook for managing lesson-level progress including video position
 * and completion state.
 *
 * FR-029: Resume playback from saved position.
 * FR-039: Track which lessons each student completed.
 * FR-040: Allow manual mark-as-complete via checkbox.
 */
export function useLessonProgress(courseId: string, lessonId: string) {
  const queryClient = useQueryClient();
  const lastSavedPositionRef = useRef(0);

  const progressQuery = useQuery({
    queryKey: ['lesson-progress', courseId, lessonId],
    queryFn: () => fetchLessonProgress(courseId, lessonId),
    enabled: !!courseId && !!lessonId,
  });

  // Debounced video position save — only saves if position changed
  // significantly since last save (called by player every 10s already)
  const savePositionMutation = useMutation({
    mutationFn: (position: number) =>
      saveVideoPosition(courseId, lessonId, position),
    onSuccess: (_data, position) => {
      lastSavedPositionRef.current = position;
    },
  });

  const handleSavePosition = useCallback(
    (position: number) => {
      // Only save if moved at least 5 seconds from last save
      if (Math.abs(position - lastSavedPositionRef.current) >= 5) {
        savePositionMutation.mutate(position);
      }
    },
    [savePositionMutation],
  );

  const completeMutation = useMutation({
    mutationFn: () => markLessonComplete(courseId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['lesson-progress', courseId, lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ['course-progress', courseId],
      });
    },
  });

  const incompleteMutation = useMutation({
    mutationFn: () => markLessonIncomplete(courseId, lessonId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['lesson-progress', courseId, lessonId],
      });
      queryClient.invalidateQueries({
        queryKey: ['course-progress', courseId],
      });
    },
  });

  const toggleComplete = useCallback(() => {
    if (progressQuery.data?.completed) {
      incompleteMutation.mutate();
    } else {
      completeMutation.mutate();
    }
  }, [progressQuery.data?.completed, completeMutation, incompleteMutation]);

  return {
    progress: progressQuery.data,
    isLoading: progressQuery.isLoading,
    savePosition: handleSavePosition,
    markComplete: () => completeMutation.mutate(),
    toggleComplete,
    isCompleted: progressQuery.data?.completed ?? false,
    initialPosition: progressQuery.data?.videoPosition ?? 0,
    isTogglingComplete:
      completeMutation.isPending || incompleteMutation.isPending,
  };
}
