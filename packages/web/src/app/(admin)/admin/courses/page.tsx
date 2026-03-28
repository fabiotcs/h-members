'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable, Column, SortState } from '@/components/admin/data-table';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Badge } from '@/components/ui/badge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminCourse {
  id: number;
  title: string;
  categoryName: string;
  status: 'ACTIVE' | 'DRAFT' | 'INACTIVE';
  modulesCount: number;
  studentsCount: number;
  sortOrder: number;
}

interface CoursesResponse {
  data: AdminCourse[];
  total: number;
  page: number;
  pageSize: number;
}

interface Category {
  id: number;
  name: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminCoursesPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ column: 'sortOrder', direction: 'asc' });
  const pageSize = 15;

  const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null);

  // Fetch courses
  const { data, isLoading } = useQuery<CoursesResponse>({
    queryKey: ['admin', 'courses', { search, categoryFilter, statusFilter, page, sort }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sortBy', sort.column);
      params.set('sortDir', sort.direction);
      if (search) params.set('search', search);
      if (categoryFilter) params.set('categoryId', categoryFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/v1/courses?${params.toString()}`);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });

  // Fetch categories for filter
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['admin', 'categories-list'],
    queryFn: async () => {
      const res = await api.get('/v1/categories');
      return res.data;
    },
  });

  // Delete course
  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/v1/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
      setDeleteTarget(null);
    },
  });

  // Duplicate course
  const duplicateMut = useMutation({
    mutationFn: async (id: number) => {
      await api.post(`/v1/courses/${id}/duplicate`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
  });

  // Reorder
  const reorderMut = useMutation({
    mutationFn: async ({ id, direction }: { id: number; direction: 'up' | 'down' }) => {
      await api.patch('/v1/courses/reorder', { courseIds: [id], direction });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'courses'] });
    },
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="success">Ativo</Badge>;
      case 'DRAFT':
        return <Badge variant="warning">Rascunho</Badge>;
      case 'INACTIVE':
        return <Badge variant="error">Inativo</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const columns: Column<AdminCourse>[] = [
    {
      key: 'title',
      label: 'Titulo',
      sortable: true,
      render: (c) => (
        <span className="font-medium text-[var(--color-text-primary)]">{c.title}</span>
      ),
    },
    {
      key: 'categoryName',
      label: 'Categoria',
      sortable: true,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (c) => statusBadge(c.status),
    },
    {
      key: 'modulesCount',
      label: 'Modulos',
      sortable: true,
      className: 'text-center',
      render: (c) => <span className="block text-center">{c.modulesCount}</span>,
    },
    {
      key: 'studentsCount',
      label: 'Alunos',
      sortable: true,
      className: 'text-center',
      render: (c) => <span className="block text-center">{c.studentsCount}</span>,
    },
    {
      key: 'sortOrder',
      label: 'Ordem',
      sortable: true,
      className: 'text-center',
      render: (c) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              reorderMut.mutate({ id: c.id, direction: 'up' });
            }}
            className="rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            <ArrowUp size={14} />
          </button>
          <span className="w-6 text-center text-xs">{c.sortOrder}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              reorderMut.mutate({ id: c.id, direction: 'down' });
            }}
            className="rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
          >
            <ArrowDown size={14} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Cursos
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Gerencie cursos, modulos e aulas
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <Plus size={16} />
          Novo Curso
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-secondary)] outline-none transition-colors focus:border-[var(--color-primary)]"
        >
          <option value="">Todas as categorias</option>
          {categories?.map((cat) => (
            <option key={cat.id} value={String(cat.id)}>
              {cat.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-secondary)] outline-none transition-colors focus:border-[var(--color-primary)]"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="DRAFT">Rascunho</option>
          <option value="INACTIVE">Inativo</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        keyExtractor={(c) => c.id}
        isLoading={isLoading}
        sort={sort}
        onSort={setSort}
        page={page}
        pageSize={pageSize}
        total={data?.total ?? 0}
        onPageChange={setPage}
        emptyMessage="Nenhum curso encontrado."
        actions={(course) => (
          <>
            <Link
              href={`/admin/courses/${course.id}`}
              className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
              title="Editar"
            >
              <Pencil size={15} />
            </Link>
            <button
              onClick={() => duplicateMut.mutate(course.id)}
              className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
              title="Duplicar"
            >
              <Copy size={15} />
            </button>
            <button
              onClick={() => setDeleteTarget(course)}
              className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-error)]"
              title="Excluir"
            >
              <Trash2 size={15} />
            </button>
          </>
        )}
      />

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        isLoading={deleteMut.isPending}
        destructive
        title="Excluir curso"
        message={`Deseja excluir o curso "${deleteTarget?.title}"? Esta acao nao pode ser desfeita.`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
