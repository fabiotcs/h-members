'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Save,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Play,
  Upload,
  Users,
  UserPlus,
  UserMinus,
  Image as ImageIcon,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { FormInput, FormSelect, FormTextarea } from '@/components/admin/form-field';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Lesson {
  id: number;
  title: string;
  youtubeUrl: string;
  sortOrder: number;
  durationSeconds: number;
}

interface Module {
  id: number;
  title: string;
  sortOrder: number;
  lessons: Lesson[];
}

interface CourseDetail {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  salesUrl: string;
  categoryId: number;
  status: 'ACTIVE' | 'DRAFT' | 'INACTIVE';
  modules: Module[];
  students: { id: number; name: string; email: string; grantedAt: string }[];
}

interface Category {
  id: number;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

type Tab = 'basic' | 'modules' | 'students';

const tabsDef: { key: Tab; label: string }[] = [
  { key: 'basic', label: 'Dados Basicos' },
  { key: 'modules', label: 'Modulos & Aulas' },
  { key: 'students', label: 'Alunos' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminCourseEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.id as string;
  const isNew = courseId === 'new';

  const [activeTab, setActiveTab] = useState<Tab>('basic');

  // Basic form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [salesUrl, setSalesUrl] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [status, setStatus] = useState<string>('DRAFT');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Module/Lesson editing
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [editingModule, setEditingModule] = useState<{ id: number | null; title: string } | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ moduleId: number; id: number | null; title: string; youtubeUrl: string } | null>(null);
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<Module | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<{ moduleId: number; lesson: Lesson } | null>(null);

  // Student management
  const [studentEmail, setStudentEmail] = useState('');

  // Fetch course
  const { data: course, isLoading: courseLoading } = useQuery<CourseDetail>({
    queryKey: ['admin', 'course', courseId],
    queryFn: async () => {
      const res = await api.get(`/v1/admin/courses/${courseId}`);
      return res.data;
    },
    enabled: !isNew,
  });

  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['admin', 'categories-list'],
    queryFn: async () => {
      const res = await api.get('/v1/admin/categories');
      return res.data;
    },
  });

  // Populate form
  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description);
      setSalesUrl(course.salesUrl);
      setCategoryId(String(course.categoryId));
      setStatus(course.status);
      setCoverPreview(course.coverUrl);
    }
  }, [course]);

  // Handle cover upload preview
  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [coverFile]);

  // Save course
  const saveMut = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('salesUrl', salesUrl);
      formData.append('categoryId', categoryId);
      formData.append('status', status);
      if (coverFile) formData.append('cover', coverFile);

      if (isNew) {
        await api.post('/v1/admin/courses', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.put(`/v1/admin/courses/${courseId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      if (isNew) router.push('/admin/courses');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      if (typeof msg === 'string') setErrors({ _form: msg });
    },
  });

  // Save module
  const saveModuleMut = useMutation({
    mutationFn: async ({ id, title: t }: { id: number | null; title: string }) => {
      if (id) {
        await api.put(`/v1/admin/courses/${courseId}/modules/${id}`, { title: t });
      } else {
        await api.post(`/v1/admin/courses/${courseId}/modules`, { title: t });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      setEditingModule(null);
    },
  });

  // Delete module
  const deleteModuleMut = useMutation({
    mutationFn: async (moduleId: number) => {
      await api.delete(`/v1/admin/courses/${courseId}/modules/${moduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      setDeleteModuleTarget(null);
    },
  });

  // Save lesson
  const saveLessonMut = useMutation({
    mutationFn: async (data: { moduleId: number; id: number | null; title: string; youtubeUrl: string }) => {
      if (data.id) {
        await api.put(`/v1/admin/courses/${courseId}/modules/${data.moduleId}/lessons/${data.id}`, {
          title: data.title,
          youtubeUrl: data.youtubeUrl,
        });
      } else {
        await api.post(`/v1/admin/courses/${courseId}/modules/${data.moduleId}/lessons`, {
          title: data.title,
          youtubeUrl: data.youtubeUrl,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      setEditingLesson(null);
    },
  });

  // Delete lesson
  const deleteLessonMut = useMutation({
    mutationFn: async ({ moduleId, lessonId }: { moduleId: number; lessonId: number }) => {
      await api.delete(`/v1/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      setDeleteLessonTarget(null);
    },
  });

  // Grant/revoke student access
  const grantAccessMut = useMutation({
    mutationFn: async (email: string) => {
      await api.post(`/v1/admin/courses/${courseId}/students`, { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      setStudentEmail('');
    },
  });

  const revokeAccessMut = useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/v1/admin/courses/${courseId}/students/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
    },
  });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Titulo e obrigatorio';
    if (!categoryId) errs.categoryId = 'Categoria e obrigatoria';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (validate()) saveMut.mutate();
  }

  // YouTube video ID extractor for preview
  function extractYouTubeId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    return match?.[1] ?? null;
  }

  if (!isNew && courseLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/courses"
          className="rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {isNew ? 'Novo Curso' : course?.title}
          </h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            {isNew ? 'Preencha os dados do curso' : 'Editar curso'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {tabsDef.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            disabled={isNew && tab.key !== 'basic'}
            className={`relative px-4 py-3 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === tab.key
                ? 'text-[var(--color-primary-light)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <motion.div
                layoutId="course-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Basic tab */}
      {activeTab === 'basic' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6"
        >
          {errors._form && (
            <div className="mb-4 rounded-lg bg-[var(--color-error)]/10 px-4 py-3 text-sm text-[var(--color-error)]">
              {errors._form}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-5 lg:col-span-2">
              <FormInput
                id="title"
                label="Titulo"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                error={errors.title}
              />
            </div>
            <div className="lg:col-span-2">
              <FormTextarea
                id="description"
                label="Descricao"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <FormInput
              id="salesUrl"
              label="URL de Vendas"
              type="url"
              value={salesUrl}
              onChange={(e) => setSalesUrl(e.target.value)}
              placeholder="https://..."
              helperText="Link para a pagina de vendas do curso"
            />
            <FormSelect
              id="categoryId"
              label="Categoria"
              required
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              options={
                categories?.map((c) => ({ value: String(c.id), label: c.name })) ?? []
              }
              placeholder="Selecione uma categoria"
              error={errors.categoryId}
            />
            <FormSelect
              id="status"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'DRAFT', label: 'Rascunho' },
                { value: 'ACTIVE', label: 'Ativo' },
                { value: 'INACTIVE', label: 'Inativo' },
              ]}
            />

            {/* Cover image */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Imagem de Capa
              </label>
              <div className="flex items-start gap-4">
                {coverPreview ? (
                  <div className="relative h-24 w-40 overflow-hidden rounded-lg border border-[var(--color-border)]">
                    <img
                      src={coverPreview}
                      alt="Cover"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-40 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                    <ImageIcon size={24} className="text-[var(--color-text-muted)]" />
                  </div>
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]">
                  <Upload size={14} />
                  Alterar
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saveMut.isPending}
              className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMut.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isNew ? 'Criar Curso' : 'Salvar'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Modules & Lessons tab */}
      {activeTab === 'modules' && !isNew && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Add module button */}
          <div className="flex justify-end">
            <button
              onClick={() => setEditingModule({ id: null, title: '' })}
              className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              <Plus size={16} />
              Novo Modulo
            </button>
          </div>

          {/* Module editing inline form */}
          <AnimatePresence>
            {editingModule && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-bg-card)] p-4"
              >
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <FormInput
                      id="module-title"
                      label={editingModule.id ? 'Editar Modulo' : 'Novo Modulo'}
                      value={editingModule.title}
                      onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                      placeholder="Nome do modulo"
                    />
                  </div>
                  <button
                    onClick={() =>
                      saveModuleMut.mutate({ id: editingModule.id, title: editingModule.title })
                    }
                    disabled={!editingModule.title.trim() || saveModuleMut.isPending}
                    className="rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  >
                    {saveModuleMut.isPending ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => setEditingModule(null)}
                    className="rounded-[var(--radius-button)] px-4 py-2.5 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)]"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Modules accordion */}
          {course?.modules && course.modules.length > 0 ? (
            course.modules
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((mod) => (
                <div
                  key={mod.id}
                  className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]"
                >
                  {/* Module header */}
                  <button
                    onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                    className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-[var(--color-bg-elevated)]/50"
                  >
                    <GripVertical size={16} className="text-[var(--color-text-muted)]" />
                    {expandedModule === mod.id ? (
                      <ChevronDown size={16} className="text-[var(--color-text-muted)]" />
                    ) : (
                      <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
                    )}
                    <span className="flex-1 text-sm font-semibold text-[var(--color-text-primary)]">
                      {mod.title}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {mod.lessons.length} aula{mod.lessons.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingModule({ id: mod.id, title: mod.title });
                      }}
                      className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteModuleTarget(mod);
                      }}
                      className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-error)]"
                    >
                      <Trash2 size={14} />
                    </button>
                  </button>

                  {/* Lessons list */}
                  <AnimatePresence>
                    {expandedModule === mod.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-t border-[var(--color-border)]"
                      >
                        <div className="divide-y divide-[var(--color-border)]">
                          {mod.lessons
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((lesson) => {
                              const ytId = extractYouTubeId(lesson.youtubeUrl);
                              return (
                                <div
                                  key={lesson.id}
                                  className="flex items-center gap-3 px-5 py-3 pl-12 transition-colors hover:bg-[var(--color-bg-elevated)]/30"
                                >
                                  <Play size={14} className="shrink-0 text-[var(--color-primary-light)]" />
                                  <span className="flex-1 text-sm text-[var(--color-text-secondary)]">
                                    {lesson.title}
                                  </span>
                                  {ytId && (
                                    <img
                                      src={`https://img.youtube.com/vi/${ytId}/default.jpg`}
                                      alt=""
                                      className="h-8 w-14 rounded object-cover"
                                    />
                                  )}
                                  <span className="text-xs text-[var(--color-text-muted)]">
                                    {lesson.durationSeconds > 0
                                      ? `${Math.floor(lesson.durationSeconds / 60)}min`
                                      : '—'}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setEditingLesson({
                                        moduleId: mod.id,
                                        id: lesson.id,
                                        title: lesson.title,
                                        youtubeUrl: lesson.youtubeUrl,
                                      })
                                    }
                                    className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setDeleteLessonTarget({ moduleId: mod.id, lesson })
                                    }
                                    className="rounded p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-error)]"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              );
                            })}

                          {/* Add lesson */}
                          <div className="px-5 py-3 pl-12">
                            <button
                              onClick={() =>
                                setEditingLesson({
                                  moduleId: mod.id,
                                  id: null,
                                  title: '',
                                  youtubeUrl: '',
                                })
                              }
                              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary-light)] transition-colors hover:text-[var(--color-primary)]"
                            >
                              <Plus size={14} />
                              Adicionar aula
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-muted)]">
              Nenhum modulo criado. Clique em "Novo Modulo" para comecar.
            </div>
          )}

          {/* Lesson editing modal */}
          <AnimatePresence>
            {editingLesson && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setEditingLesson(null)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-2xl"
                >
                  <h3 className="mb-4 text-base font-semibold text-[var(--color-text-primary)]">
                    {editingLesson.id ? 'Editar Aula' : 'Nova Aula'}
                  </h3>
                  <div className="space-y-4">
                    <FormInput
                      id="lesson-title"
                      label="Titulo da Aula"
                      value={editingLesson.title}
                      onChange={(e) =>
                        setEditingLesson({ ...editingLesson, title: e.target.value })
                      }
                      required
                    />
                    <FormInput
                      id="lesson-url"
                      label="URL do YouTube"
                      type="url"
                      value={editingLesson.youtubeUrl}
                      onChange={(e) =>
                        setEditingLesson({ ...editingLesson, youtubeUrl: e.target.value })
                      }
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                    {/* YouTube preview */}
                    {editingLesson.youtubeUrl && extractYouTubeId(editingLesson.youtubeUrl) && (
                      <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
                        <img
                          src={`https://img.youtube.com/vi/${extractYouTubeId(editingLesson.youtubeUrl)}/hqdefault.jpg`}
                          alt="Preview"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      onClick={() => setEditingLesson(null)}
                      className="rounded-[var(--radius-button)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => editingLesson && saveLessonMut.mutate(editingLesson)}
                      disabled={
                        !editingLesson.title.trim() ||
                        !editingLesson.youtubeUrl.trim() ||
                        saveLessonMut.isPending
                      }
                      className="rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                    >
                      {saveLessonMut.isPending ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Students tab */}
      {activeTab === 'students' && !isNew && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          {/* Grant access form */}
          <div className="flex gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4">
            <div className="relative flex-1">
              <UserPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="email"
                placeholder="E-mail do aluno..."
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]"
              />
            </div>
            <button
              onClick={() => studentEmail && grantAccessMut.mutate(studentEmail)}
              disabled={!studentEmail.trim() || grantAccessMut.isPending}
              className="rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
            >
              Conceder Acesso
            </button>
          </div>

          {/* Students list */}
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Nome</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">E-mail</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Acesso desde</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--color-text-muted)]">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {course?.students && course.students.length > 0 ? (
                    course.students.map((s) => (
                      <tr key={s.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]/50">
                        <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">{s.name}</td>
                        <td className="px-4 py-3 text-[var(--color-text-secondary)]">{s.email}</td>
                        <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                          {new Date(s.grantedAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => revokeAccessMut.mutate(s.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-[var(--color-error)] transition-colors hover:bg-[var(--color-error)]/10"
                          >
                            <UserMinus size={12} />
                            Revogar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[var(--color-text-muted)]">
                        Nenhum aluno com acesso a este curso
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* Delete module dialog */}
      <ConfirmDialog
        open={!!deleteModuleTarget}
        onClose={() => setDeleteModuleTarget(null)}
        onConfirm={() => deleteModuleTarget && deleteModuleMut.mutate(deleteModuleTarget.id)}
        isLoading={deleteModuleMut.isPending}
        destructive
        title="Excluir modulo"
        message={`Deseja excluir o modulo "${deleteModuleTarget?.title}" e todas as suas aulas?`}
        confirmLabel="Excluir"
      />

      {/* Delete lesson dialog */}
      <ConfirmDialog
        open={!!deleteLessonTarget}
        onClose={() => setDeleteLessonTarget(null)}
        onConfirm={() =>
          deleteLessonTarget &&
          deleteLessonMut.mutate({
            moduleId: deleteLessonTarget.moduleId,
            lessonId: deleteLessonTarget.lesson.id,
          })
        }
        isLoading={deleteLessonMut.isPending}
        destructive
        title="Excluir aula"
        message={`Deseja excluir a aula "${deleteLessonTarget?.lesson.title}"?`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
