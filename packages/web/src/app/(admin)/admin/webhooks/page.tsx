'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Webhook,
  ScrollText,
  Loader2,
  X,
  Check,
  XCircle,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { FormInput } from '@/components/admin/form-field';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface WebhookConfig {
  id: number;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: string;
}

interface WebhookLog {
  id: number;
  direction: 'IN' | 'OUT';
  event: string;
  statusCode: number;
  timestamp: string;
  payload: string;
  response: string;
}

const AVAILABLE_EVENTS = [
  'user.created',
  'user.updated',
  'user.deleted',
  'course.access.granted',
  'course.access.revoked',
  'lesson.completed',
  'login.success',
  'login.failed',
  'payment.confirmed',
  'payment.refunded',
];

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

type Tab = 'configs' | 'logs';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminWebhooksPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<Tab>('configs');
  const [editing, setEditing] = useState<{
    id: number | null;
    url: string;
    events: string[];
    secret: string;
    active: boolean;
  } | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebhookConfig | null>(null);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  // Fetch configs
  const { data: configs, isLoading: configsLoading } = useQuery<WebhookConfig[]>({
    queryKey: ['admin', 'webhooks'],
    queryFn: async () => {
      const res = await api.get('/v1/admin/webhooks');
      return res.data;
    },
  });

  // Fetch logs
  const { data: logs, isLoading: logsLoading } = useQuery<WebhookLog[]>({
    queryKey: ['admin', 'webhook-logs'],
    queryFn: async () => {
      const res = await api.get('/v1/admin/webhooks/logs');
      return res.data;
    },
    enabled: activeTab === 'logs',
  });

  // Save webhook
  const saveMut = useMutation({
    mutationFn: async (data: typeof editing) => {
      if (!data) return;
      const body = { url: data.url, events: data.events, secret: data.secret, active: data.active };
      if (data.id) {
        await api.patch(`/v1/admin/webhooks/${data.id}`, body);
      } else {
        await api.post('/v1/admin/webhooks', body);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'webhooks'] });
      setEditing(null);
    },
  });

  // Delete webhook
  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/v1/admin/webhooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'webhooks'] });
      setDeleteTarget(null);
    },
  });

  function toggleEvent(event: string) {
    if (!editing) return;
    const has = editing.events.includes(event);
    setEditing({
      ...editing,
      events: has
        ? editing.events.filter((e) => e !== event)
        : [...editing.events, event],
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Webhooks
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Configure integracoes e visualize logs de webhooks
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--color-border)]">
        {[
          { key: 'configs' as Tab, label: 'Configuracoes', icon: Webhook },
          { key: 'logs' as Tab, label: 'Logs', icon: ScrollText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-[var(--color-primary-light)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <Icon size={16} />
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="webhook-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--color-primary)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Configs tab */}
      {activeTab === 'configs' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() =>
                setEditing({ id: null, url: '', events: [], secret: '', active: true })
              }
              className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              <Plus size={16} />
              Novo Webhook
            </button>
          </div>

          {/* Edit form */}
          <AnimatePresence>
            {editing && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-bg-card)] p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {editing.id ? 'Editar Webhook' : 'Novo Webhook'}
                  </h3>
                  <button
                    onClick={() => setEditing(null)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="space-y-4">
                  <FormInput
                    id="webhook-url"
                    label="URL"
                    type="url"
                    value={editing.url}
                    onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                    placeholder="https://example.com/webhook"
                    required
                  />
                  <div className="relative">
                    <FormInput
                      id="webhook-secret"
                      label="Secret"
                      type={showSecret ? 'text' : 'password'}
                      value={editing.secret}
                      onChange={(e) => setEditing({ ...editing, secret: e.target.value })}
                      placeholder="whsec_..."
                      helperText="Chave secreta para assinatura HMAC das requisicoes"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-3 top-9 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                    >
                      {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Events */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                      Eventos
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {AVAILABLE_EVENTS.map((event) => (
                        <label
                          key={event}
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-bg-elevated)]"
                        >
                          <input
                            type="checkbox"
                            checked={editing.events.includes(event)}
                            onChange={() => toggleEvent(event)}
                            className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                          />
                          <span className="text-xs font-mono text-[var(--color-text-secondary)]">
                            {event}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Active toggle */}
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={editing.active}
                      onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                      className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary)]"
                    />
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Webhook ativo
                    </span>
                  </label>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setEditing(null)}
                      className="rounded-[var(--radius-button)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)]"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => saveMut.mutate(editing)}
                      disabled={!editing.url.trim() || editing.events.length === 0 || saveMut.isPending}
                      className="rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                    >
                      {saveMut.isPending ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Configs list */}
          <div className="space-y-3">
            {configsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]" />
              ))
            ) : configs && configs.length > 0 ? (
              configs.map((cfg) => (
                <div
                  key={cfg.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <code className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                          {cfg.url}
                        </code>
                        <Badge variant={cfg.active ? 'success' : 'error'}>
                          {cfg.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {cfg.events.map((event) => (
                          <span
                            key={event}
                            className="inline-flex rounded bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[10px] font-mono text-[var(--color-text-muted)]"
                          >
                            {event}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          setEditing({
                            id: cfg.id,
                            url: cfg.url,
                            events: cfg.events,
                            secret: cfg.secret,
                            active: cfg.active,
                          })
                        }
                        className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(cfg)}
                        className="rounded-lg p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-error)]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] p-12 text-center text-sm text-[var(--color-text-muted)]">
                Nenhum webhook configurado
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs tab */}
      {activeTab === 'logs' && (
        <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                  <th className="w-8 px-4 py-3"></th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Direcao</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Evento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--color-text-muted)]">Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {logsLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)]">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-bg-elevated)]" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : logs && logs.length > 0 ? (
                  logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="cursor-pointer border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-bg-elevated)]/50"
                      >
                        <td className="px-4 py-3 text-[var(--color-text-muted)]">
                          {expandedLog === log.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs font-medium">
                            {log.direction === 'IN' ? (
                              <>
                                <ArrowDownRight size={12} className="text-[var(--color-success)]" />
                                <span className="text-[var(--color-success)]">Entrada</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight size={12} className="text-[var(--color-primary-light)]" />
                                <span className="text-[var(--color-primary-light)]">Saida</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[var(--color-text-secondary)]">
                          {log.event}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              log.statusCode >= 200 && log.statusCode < 300
                                ? 'success'
                                : log.statusCode >= 400
                                  ? 'error'
                                  : 'warning'
                            }
                          >
                            {log.statusCode}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-text-muted)]">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                      </tr>
                      {/* Expanded payload */}
                      {expandedLog === log.id && (
                        <tr key={`${log.id}-detail`} className="border-b border-[var(--color-border)]">
                          <td colSpan={5} className="bg-[var(--color-bg-surface)] p-4">
                            <div className="grid gap-4 lg:grid-cols-2">
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                                  Payload
                                </p>
                                <pre className="max-h-48 overflow-auto rounded-lg bg-[var(--color-bg-dark)] p-3 text-xs text-[var(--color-text-secondary)]">
                                  {log.payload ? JSON.stringify(JSON.parse(log.payload), null, 2) : '—'}
                                </pre>
                              </div>
                              <div>
                                <p className="mb-1 text-xs font-semibold uppercase text-[var(--color-text-muted)]">
                                  Resposta
                                </p>
                                <pre className="max-h-48 overflow-auto rounded-lg bg-[var(--color-bg-dark)] p-3 text-xs text-[var(--color-text-secondary)]">
                                  {log.response ? JSON.stringify(JSON.parse(log.response), null, 2) : '—'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                      Nenhum log de webhook encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
        isLoading={deleteMut.isPending}
        destructive
        title="Excluir webhook"
        message={`Deseja excluir o webhook para "${deleteTarget?.url}"?`}
        confirmLabel="Excluir"
      />
    </div>
  );
}
