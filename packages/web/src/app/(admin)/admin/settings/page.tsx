'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Save,
  Loader2,
  Upload,
  Palette,
  Type,
  Image as ImageIcon,
  Monitor,
} from 'lucide-react';
import { api } from '@/lib/api';
import { FormInput } from '@/components/admin/form-field';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface PlatformSettings {
  platform_name: string;
  primary_color: string;
  logo_url: string;
  favicon_url: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  const [platformName, setPlatformName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6366F1');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery<PlatformSettings>({
    queryKey: ['admin', 'settings'],
    queryFn: async () => {
      const res = await api.get('/v1/settings');
      return res.data;
    },
  });

  // Populate form
  useEffect(() => {
    if (settings) {
      setPlatformName(settings.platform_name || '');
      setPrimaryColor(settings.primary_color || '#6366F1');
      setLogoPreview(settings.logo_url || '');
      setFaviconPreview(settings.favicon_url || '');
    }
  }, [settings]);

  // File previews
  useEffect(() => {
    if (logoFile) {
      const url = URL.createObjectURL(logoFile);
      setLogoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [logoFile]);

  useEffect(() => {
    if (faviconFile) {
      const url = URL.createObjectURL(faviconFile);
      setFaviconPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [faviconFile]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('platformName', platformName);
      formData.append('primaryColor', primaryColor);
      if (logoFile) formData.append('logo', logoFile);
      if (faviconFile) formData.append('favicon', faviconFile);
      // Upload logo separately if provided
      if (logoFile) {
        const logoData = new FormData();
        logoData.append('file', logoFile);
        await api.post('/v1/upload/logo', logoData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      // Save settings via bulk update
      const settingsPayload = {
        settings: [
          { key: 'platform_name', value: platformName },
          { key: 'primary_color', value: primaryColor },
        ],
      };
      if (faviconFile) {
        // Favicon upload would need a separate endpoint; for now include in settings
        const favData = new FormData();
        favData.append('file', faviconFile);
        await api.post('/v1/upload/logo', favData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      await api.put('/v1/admin/settings/bulk', settingsPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'settings'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  // Predefined color palette
  const colorPresets = [
    '#6366F1', // indigo
    '#8B5CF6', // violet
    '#EC4899', // pink
    '#EF4444', // red
    '#F59E0B', // amber
    '#22C55E', // green
    '#06B6D4', // cyan
    '#3B82F6', // blue
    '#F97316', // orange
    '#14B8A6', // teal
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Configuracoes
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Personalize a identidade visual da plataforma (White Label)
        </p>
      </div>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* Settings form */}
        <div className="space-y-6 xl:col-span-2">
          {/* Platform name */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Type size={18} className="text-[var(--color-primary-light)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Nome da Plataforma
              </h2>
            </div>
            <FormInput
              id="platformName"
              label="Nome"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              required
              helperText="Exibido no cabecalho, login e titulo da pagina"
            />
          </motion.div>

          {/* Primary color */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <Palette size={18} className="text-[var(--color-primary-light)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Cor Primaria
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-12 cursor-pointer rounded-lg border border-[var(--color-border)] bg-transparent"
                  />
                </div>
                <FormInput
                  id="primaryColor"
                  label="HEX"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="!w-32"
                />
              </div>
              <div>
                <p className="mb-2 text-xs text-[var(--color-text-muted)]">Presets</p>
                <div className="flex flex-wrap gap-2">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      onClick={() => setPrimaryColor(color)}
                      className={`h-8 w-8 rounded-lg border-2 transition-transform hover:scale-110 ${
                        primaryColor === color
                          ? 'border-white shadow-lg'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6"
          >
            <div className="mb-4 flex items-center gap-2">
              <ImageIcon size={18} className="text-[var(--color-primary-light)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Logo & Favicon
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Logo */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Logo</p>
                <div className="flex items-center gap-4">
                  {logoPreview ? (
                    <div className="flex h-16 w-40 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-2">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-40 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                      <ImageIcon size={20} className="text-[var(--color-text-muted)]" />
                    </div>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]">
                    <Upload size={14} />
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Recomendado: PNG transparente, 200x50px
                </p>
              </div>

              {/* Favicon */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">Favicon</p>
                <div className="flex items-center gap-4">
                  {faviconPreview ? (
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-2">
                      <img
                        src={faviconPreview}
                        alt="Favicon"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                      <ImageIcon size={20} className="text-[var(--color-text-muted)]" />
                    </div>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]">
                    <Upload size={14} />
                    Upload
                    <input
                      type="file"
                      accept="image/*,.ico"
                      className="hidden"
                      onChange={(e) => setFaviconFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Recomendado: ICO ou PNG, 32x32px
                </p>
              </div>
            </div>
          </motion.div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => saveMut.mutate()}
              disabled={saveMut.isPending || !platformName.trim()}
              className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveMut.isPending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Salvar Configuracoes
            </button>
            {saved && (
              <motion.span
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium text-[var(--color-success)]"
              >
                Salvo com sucesso!
              </motion.span>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="xl:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="sticky top-8 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Monitor size={18} className="text-[var(--color-primary-light)]" />
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Preview
              </h2>
            </div>

            {/* Preview card */}
            <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-dark)]">
              {/* Mock header */}
              <div
                className="flex h-10 items-center gap-2 border-b px-4"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-bg-surface)',
                }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="" className="h-5 object-contain" />
                ) : (
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {platformName.charAt(0) || 'H'}
                  </div>
                )}
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  {platformName || 'Platform'}
                </span>
              </div>

              {/* Mock content */}
              <div className="p-4 space-y-3">
                <div className="h-2.5 w-3/4 rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-2.5 w-1/2 rounded bg-[var(--color-bg-elevated)]" />

                {/* Mock button */}
                <button
                  className="mt-2 rounded-md px-3 py-1.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  Botao Primario
                </button>

                {/* Mock progress bar */}
                <div className="mt-3">
                  <div className="h-1.5 w-full rounded-full bg-[var(--color-bg-elevated)]">
                    <div
                      className="h-full w-3/5 rounded-full transition-all"
                      style={{ backgroundColor: primaryColor }}
                    />
                  </div>
                </div>

                {/* Mock cards */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-2">
                    <div className="mb-1.5 h-10 rounded bg-[var(--color-bg-elevated)]" />
                    <div className="h-2 w-3/4 rounded bg-[var(--color-bg-elevated)]" />
                  </div>
                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-2">
                    <div className="mb-1.5 h-10 rounded bg-[var(--color-bg-elevated)]" />
                    <div className="h-2 w-3/4 rounded bg-[var(--color-bg-elevated)]" />
                  </div>
                </div>
              </div>

              {/* Mock tab bar */}
              <div className="flex border-t border-[var(--color-border)] bg-[var(--color-bg-surface)]">
                {['Home', 'Cursos', 'Perfil'].map((label, i) => (
                  <div
                    key={label}
                    className="flex-1 py-2 text-center text-[8px]"
                    style={{
                      color: i === 0 ? primaryColor : 'var(--color-text-muted)',
                      borderTop: i === 0 ? `2px solid ${primaryColor}` : '2px solid transparent',
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">
              Visualizacao aproximada. As alteracoes serao aplicadas apos salvar.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
