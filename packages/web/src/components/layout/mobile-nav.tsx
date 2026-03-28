'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, User } from 'lucide-react';

const items = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Cursos', href: '/home', icon: BookOpen },
  { label: 'Perfil', href: '/profile', icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)] lg:hidden">
      <div className="flex items-center justify-around py-2">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 px-4 py-1"
            >
              <Icon
                size={22}
                className={
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)]'
                }
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive
                    ? 'text-[var(--color-primary)]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 h-0.5 w-8 rounded-full bg-[var(--color-primary)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
