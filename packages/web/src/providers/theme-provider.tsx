'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface ThemeConfig {
  platformName: string;
  primaryColor: string;
  logoUrl: string;
  faviconUrl: string;
}

const defaultTheme: ThemeConfig = {
  platformName: process.env.NEXT_PUBLIC_PLATFORM_NAME || 'H-Members',
  primaryColor: '#6366F1',
  logoUrl: '',
  faviconUrl: '',
};

const ThemeContext = createContext<ThemeConfig>(defaultTheme);

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme?: Partial<ThemeConfig>;
}) {
  const [theme, setTheme] = useState<ThemeConfig>({
    ...defaultTheme,
    ...initialTheme,
  });

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--color-primary',
      theme.primaryColor,
    );
    document.title = theme.platformName;
  }, [theme]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
