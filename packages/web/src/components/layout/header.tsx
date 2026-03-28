'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LogOut, User, Menu, X } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useAuthStore } from '@/store/auth-store';

export function Header() {
  const { platformName } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/80 px-4 backdrop-blur-md lg:px-6">
      {/* Left: Logo (visible on mobile, hidden on desktop where sidebar shows it) */}
      <div className="flex items-center gap-3 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-xs font-bold text-white">
            {platformName.charAt(0)}
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            {platformName}
          </span>
        </Link>
      </div>

      {/* Center: Search */}
      <div className="hidden flex-1 justify-center px-8 md:flex">
        <div className="relative w-full max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            type="text"
            placeholder="Buscar cursos..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-dark)] py-2 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Mobile search toggle */}
      <button
        onClick={() => setSearchOpen((v) => !v)}
        className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] md:hidden"
      >
        {searchOpen ? <X size={20} /> : <Search size={20} />}
      </button>

      {/* Right: User dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[var(--color-bg-elevated)]"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-xs font-semibold text-[var(--color-text-primary)]">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="hidden text-sm font-medium text-[var(--color-text-primary)] lg:block">
            {user?.name || 'Usuario'}
          </span>
        </button>

        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-xl"
            >
              <div className="border-b border-[var(--color-border)] px-4 py-3">
                <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-[var(--color-text-muted)]">
                  {user?.email}
                </p>
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
                >
                  <User size={16} />
                  Perfil
                </Link>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-error)]"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile search bar (expanded) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="absolute left-0 right-0 top-full border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] px-4 py-3 md:hidden"
          >
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
              />
              <input
                type="text"
                placeholder="Buscar cursos..."
                autoFocus
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-dark)] py-2 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none transition-colors focus:border-[var(--color-primary)]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
