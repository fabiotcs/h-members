'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Loader2,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import { FormInput } from '@/components/admin/form-field';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Category {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  coursesCount: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState<{ id: number | null; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ['admin', 'categories'],
    queryFn: async () => {
      const res = await api.get('/v1/admin/categories');
      return res.data;
    },
  });

  const saveMut = useMutation({
    mutationFn: async ({ id, name }: { id: number | null; name: string }) => {
      if (id) {
        await api.put(`/v1/admin/categories/${id}`, { name });
      } else {
        await api.post('/v1/admin/categories', { name });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setEditing(null);
    },
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/v1/admin/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      setDeleteTarget(null);
    },
  });

  const reorderMut = useMutation({
    mutationFn: async ({ id, direction }: { id: number; direction: 'up' | 'down' }) => {
      await api.patch(`/v1/admin/categories/${id}/reorder`, { direction });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    },
  });

  const sorted = categories?.sort((a, b) => a.sortOrder - b.sortOrder) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Categorias
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Organize seus cursos em categorias
          </p>
        </div>
        <button
          onClick={() => setEditing({ id: null, name: '' })}
          className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <Plus size={16} />
          Nova Categoria
        </button>
      </div>

      {/* Inline form */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-bg-card)] p-4"
          >
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <FormInput
                  id="cat-name"
                  label={editing.id ? 'Editar Categoria' : 'Nova Categoria'}
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Nome da categoria"
                />
              </div>
              <button
                onClick={() => saveMut.mutate({ id: editing.id, name: editing.name })}
                disabled={!editing.name.trim() || saveMut.isPending}
                className="rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
              >
                {saveMut.isPending ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="rounded-[var(--radius-button)] p-2.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)]"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Categories list */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        {isLoading ? (
          <div className="divide-y divide-[var(--color-border)]">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-5 w-5 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-5 w-48 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
              </div>
            ))}
          </div>
        ) : sorted.length > 0 ? (
          <div className="divide-y divide-[var(--color-border)]">
            {sorted.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--color-bg-elevated)]/50"
              >
                <GripVertical size={16} className="text-[var(--color-text-muted)]" />

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => reorderMut.mutate({ id: cat.id, direction: 'up' })}
                    disabled={idx === 0}
                    className="rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => reorderMut.mutate({ id: cat.id, direction: 'down' })}
                    disabled={idx === sorted.length - 1}
                    className="rounded p-0.5 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">
                  {cat.name}
                </span>

                <span className="text-xs text-[var(--color-text-muted)]">
                  {cat.coursesCount} curso{cat.coursesCount !== 1 ? 's' : ''}
                </span>

                <button
                  onClick={() => setEditing({ id: cat.id, name: cat.name })}
                  className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(cat)}
                  className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-error)]"
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center text-sm text-[var(--color-text-muted)]">
            Nenhuma categoria criada
          </div>
        )}
      </div>

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        isLoading={deleteMut.isPending}
        destructive
        title="Excluir categoria"
        message={
          deleteTarget?.coursesCount
            ? `A categoria "${deleteTarget?.name}" possui ${deleteTarget?.coursesCount} curso(s). Deseja excluir mesmo assim?`
            : `Deseja excluir a categoria "${deleteTarget?.name}"?`
        }
        confirmLabel="Excluir"
      />
    </div>
  );
}
