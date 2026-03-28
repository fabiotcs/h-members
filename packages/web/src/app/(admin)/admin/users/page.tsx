'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Pencil,
  UserCheck,
  UserX,
  BookOpen,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DataTable, Column, SortState } from '@/components/admin/data-table';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Badge } from '@/components/ui/badge';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'STUDENT';
  status: 'ACTIVE' | 'INACTIVE';
  coursesCount: number;
  lastLoginAt: string | null;
}

interface UsersResponse {
  data: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortState>({ column: 'name', direction: 'asc' });
  const pageSize = 15;

  // Toggle status dialog
  const [toggleTarget, setToggleTarget] = useState<AdminUser | null>(null);

  const { data, isLoading } = useQuery<UsersResponse>({
    queryKey: ['admin', 'users', { search, roleFilter, statusFilter, page, sort }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      params.set('sortBy', sort.column);
      params.set('sortDir', sort.direction);
      if (search) params.set('search', search);
      if (roleFilter) params.set('role', roleFilter);
      if (statusFilter) params.set('status', statusFilter);
      const res = await api.get(`/v1/admin/users?${params.toString()}`);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });

  const toggleStatusMut = useMutation({
    mutationFn: async (user: AdminUser) => {
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.patch(`/v1/admin/users/${user.id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setToggleTarget(null);
    },
  });

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      label: 'Nome',
      sortable: true,
      render: (u) => (
        <div>
          <p className="font-medium text-[var(--color-text-primary)]">{u.name}</p>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'E-mail',
      sortable: true,
      render: (u) => <span className="text-[var(--color-text-secondary)]">{u.email}</span>,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (u) => (
        <Badge variant={u.role === 'ADMIN' ? 'default' : 'warning'}>
          {u.role === 'ADMIN' ? 'Admin' : 'Aluno'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (u) => (
        <Badge variant={u.status === 'ACTIVE' ? 'success' : 'error'}>
          {u.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
    {
      key: 'coursesCount',
      label: 'Cursos',
      sortable: true,
      className: 'text-center',
      render: (u) => <span className="text-center block">{u.coursesCount}</span>,
    },
    {
      key: 'lastLoginAt',
      label: 'Ultimo Login',
      sortable: true,
      render: (u) => (
        <span className="text-xs text-[var(--color-text-muted)]">
          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('pt-BR') : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Usuarios
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Gerencie os usuarios da plataforma
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <Plus size={16} />
          Novo Usuario
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]"
          />
        </div>

        {/* Role filter */}
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2.5 text-sm text-[var(--color-text-secondary)] outline-none transition-colors focus:border-[var(--color-primary)]"
        >
          <option value="">Todos os roles</option>
          <option value="ADMIN">Admin</option>
          <option value="STUDENT">Aluno</option>
        </select>

        {/* Status filter */}
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
          <option value="INACTIVE">Inativo</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        keyExtractor={(u) => u.id}
        isLoading={isLoading}
        sort={sort}
        onSort={setSort}
        page={page}
        pageSize={pageSize}
        total={data?.total ?? 0}
        onPageChange={setPage}
        emptyMessage="Nenhum usuario encontrado."
        actions={(user) => (
          <>
            <Link
              href={`/admin/users/${user.id}`}
              className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
              title="Editar"
            >
              <Pencil size={15} />
            </Link>
            <button
              onClick={() => setToggleTarget(user)}
              className={`rounded-lg p-1.5 transition-colors hover:bg-[var(--color-bg-elevated)] ${
                user.status === 'ACTIVE'
                  ? 'text-[var(--color-text-muted)] hover:text-[var(--color-error)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-success)]'
              }`}
              title={user.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
            >
              {user.status === 'ACTIVE' ? <UserX size={15} /> : <UserCheck size={15} />}
            </button>
          </>
        )}
      />

      {/* Toggle status dialog */}
      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleTarget && toggleStatusMut.mutate(toggleTarget)}
        isLoading={toggleStatusMut.isPending}
        destructive={toggleTarget?.status === 'ACTIVE'}
        title={
          toggleTarget?.status === 'ACTIVE'
            ? 'Desativar usuario'
            : 'Ativar usuario'
        }
        message={
          toggleTarget?.status === 'ACTIVE'
            ? `Deseja desativar o usuario "${toggleTarget?.name}"? Ele perdera o acesso a plataforma.`
            : `Deseja reativar o usuario "${toggleTarget?.name}"?`
        }
        confirmLabel={toggleTarget?.status === 'ACTIVE' ? 'Desativar' : 'Ativar'}
      />
    </div>
  );
}
