'use client';

import { ThemeProvider } from 'next-themes';
import { SettingsProvider } from '@/context/SettingsContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SettingsProvider>{children}</SettingsProvider>
    </ThemeProvider>
  );
}
