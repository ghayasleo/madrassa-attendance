import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useActiveMadrassa } from '@/context/ActiveMadrassaContext';
import { PageLoader } from '@/components/ui/Spinner';

export function ProtectedRoute({
  children,
  adminOnly,
  requireSuperAdmin,
  requireMadrassa,
}: {
  children: ReactNode;
  /** Page is for madrassa admins (and a super-admin browsing inside a madrassa). */
  adminOnly?: boolean;
  /** Page is for the super-admin management area only. */
  requireSuperAdmin?: boolean;
  /** Page needs a madrassa context (super-admin without a selection → /admin). */
  requireMadrassa?: boolean;
}) {
  const { session, loading, isAdmin, isSuperAdmin } = useAuth();
  const { activeMadrassaId, isImpersonating } = useActiveMadrassa();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  if (requireSuperAdmin && !isSuperAdmin) return <Navigate to="/dashboard" replace />;

  if (requireMadrassa && !activeMadrassaId) {
    return <Navigate to={isSuperAdmin ? '/admin' : '/login'} replace />;
  }

  if (adminOnly && !(isAdmin || (isSuperAdmin && isImpersonating))) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
