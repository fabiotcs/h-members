'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { MobileNav } from '@/components/layout/mobile-nav';

/**
 * Protected layout for the member area.
 * Wraps all member pages with auth check, navigation, QueryProvider, and ThemeProvider.
 */
export default function MemberLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-dark)]">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
          style={{
            borderColor: 'var(--color-border)',
            borderTopColor: 'var(--color-primary)',
          }}
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemeProvider>
      <QueryProvider>
        <div className="flex min-h-screen bg-[var(--color-bg-dark)]">
          {/* Sidebar — hidden on mobile */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Main content */}
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4 lg:px-8 lg:pb-8">
              {children}
            </main>
          </div>

          {/* Mobile bottom nav — visible only on mobile */}
          <div className="lg:hidden">
            <MobileNav />
          </div>
        </div>
      </QueryProvider>
    </ThemeProvider>
  );
}
