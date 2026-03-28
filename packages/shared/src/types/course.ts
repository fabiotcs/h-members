export enum CourseStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface Course {
  id: string;
  title: string;
  description: string;
  slug: string;
  thumbnailUrl?: string;
  status: CourseStatus;
  categoryId?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  modules?: CourseModule[];
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  sortOrder: number;
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
}
