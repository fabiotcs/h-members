'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FolderTree,
  Webhook,
  Settings,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useAuthStore } from '@/store/auth-store';

interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const adminNavItems: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Usuarios', href: '/admin/users', icon: Users },
  { label: 'Cursos', href: '/admin/courses', icon: BookOpen },
  { label: 'Categorias', href: '/admin/categories', icon: FolderTree },
  { label: 'Webhooks', href: '/admin/webhooks', icon: Webhook },
  { label: 'Configuracoes', href: '/admin/settings', icon: Settings },
  { label: 'Logs', href: '/admin/logs', icon: ScrollText },
];

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { platformName } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function NavContent({ isMobile = false }: { isMobile?: boolean }) {
    return (
      <>
        {/* Header */}
        <div className="flex h-16 items-center gap-3 border-b border-[var(--color-border)] px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-sm font-bold text-white">
            <ShieldCheck size={18} />
          </div>
          <AnimatePresence>
            {(!collapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <p className="whitespace-nowrap text-sm font-semibold text-[var(--color-text-primary)]">
                  {platformName}
                </p>
                <p className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-[var(--color-primary-light)]">
                  Admin
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {adminNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon size={20} className="shrink-0" />
                <AnimatePresence>
                  {(!collapsed || isMobile) && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Back to member area + user */}
        <div className="border-t border-[var(--color-border)] p-3 space-y-2">
          <Link
            href="/"
            onClick={() => isMobile && setMobileOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
          >
            <ChevronLeft size={18} className="shrink-0" />
            <AnimatePresence>
              {(!collapsed || isMobile) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Area do Aluno
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          {user && (
            <div className="flex items-center gap-3 rounded-lg px-3 py-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-xs font-semibold text-[var(--color-text-primary)]">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <AnimatePresence>
                {(!collapsed || isMobile) && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex-1 overflow-hidden"
                  >
                    <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-[var(--color-text-muted)]">
                      {user.email}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <AnimatePresence>
                {(!collapsed || isMobile) && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => logout()}
                    className="shrink-0 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-error)]"
                    title="Sair"
                  >
                    <LogOut size={16} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Collapse toggle (desktop only) */}
          {!isMobile && (
            <button
              onClick={() => setCollapsed((v) => !v)}
              className="flex w-full items-center justify-center rounded-lg py-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-secondary)]"
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 z-50 flex h-screen w-[280px] flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-surface)] lg:hidden"
            >
              <NavContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.2 }}
        className="fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-surface)] lg:flex"
      >
        <NavContent />
      </motion.aside>
    </>
  );
}
