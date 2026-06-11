import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/context/AuthContext';
import { ActiveMadrassaProvider } from '@/context/ActiveMadrassaContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { ToastProvider } from '@/context/ToastContext';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <ActiveMadrassaProvider>
            <ToastProvider>{children}</ToastProvider>
          </ActiveMadrassaProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}
