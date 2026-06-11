import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'active_madrassa_id';

type ActiveMadrassaContextValue = {
  /**
   * The madrassa the app is currently operating on:
   *  - admin/teacher → their own madrassa (fixed)
   *  - super_admin   → the madrassa they "opened" (or null on the management view)
   */
  activeMadrassaId: string | null;
  /** True when a super_admin is browsing inside a specific madrassa. */
  isImpersonating: boolean;
  setActiveMadrassaId: (id: string) => void;
  clearActiveMadrassa: () => void;
};

const ActiveMadrassaContext = createContext<ActiveMadrassaContextValue | null>(null);

export function ActiveMadrassaProvider({ children }: { children: ReactNode }) {
  const { isSuperAdmin, madrassaId } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<string | null>(() => {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  // Non-super users are always locked to their own madrassa.
  const activeMadrassaId = isSuperAdmin ? selected : madrassaId;
  const isImpersonating = isSuperAdmin && !!selected;

  const setActiveMadrassaId = useCallback(
    (id: string) => {
      localStorage.setItem(STORAGE_KEY, id);
      setSelected(id);
      // Data is tenant-scoped; drop cached results from the previous madrassa.
      void qc.invalidateQueries();
    },
    [qc],
  );

  const clearActiveMadrassa = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSelected(null);
    void qc.invalidateQueries();
  }, [qc]);

  // If a non-super user signs in, clear any leftover selection.
  useEffect(() => {
    if (!isSuperAdmin && selected) {
      localStorage.removeItem(STORAGE_KEY);
      setSelected(null);
    }
  }, [isSuperAdmin, selected]);

  const value = useMemo<ActiveMadrassaContextValue>(
    () => ({ activeMadrassaId, isImpersonating, setActiveMadrassaId, clearActiveMadrassa }),
    [activeMadrassaId, isImpersonating, setActiveMadrassaId, clearActiveMadrassa],
  );

  return <ActiveMadrassaContext.Provider value={value}>{children}</ActiveMadrassaContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActiveMadrassa(): ActiveMadrassaContextValue {
  const ctx = useContext(ActiveMadrassaContext);
  if (!ctx) throw new Error('useActiveMadrassa must be used within ActiveMadrassaProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useActiveMadrassaId(): string | null {
  return useActiveMadrassa().activeMadrassaId;
}
