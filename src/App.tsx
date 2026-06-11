import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useActiveMadrassa } from '@/context/ActiveMadrassaContext';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { AttendancePage } from '@/features/attendance/AttendancePage';
import { ClassesPage } from '@/features/classes/ClassesPage';
import { StudentsPage } from '@/features/students/StudentsPage';
import { TeachersPage } from '@/features/teachers/TeachersPage';
import { ReportsPage } from '@/features/reports/ReportsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SuperAdminDashboard } from '@/features/admin/SuperAdminDashboard';
import { MadrassasPage } from '@/features/madrassas/MadrassasPage';
import { UsersPage } from '@/features/users/UsersPage';

/** Sends users to the right home: super-admin → management, others → dashboard. */
function HomeRedirect() {
  const { isSuperAdmin } = useAuth();
  const { activeMadrassaId } = useActiveMadrassa();
  if (isSuperAdmin && !activeMadrassaId) return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomeRedirect />} />

          {/* Super-admin management */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireSuperAdmin>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/madrassas"
            element={
              <ProtectedRoute requireSuperAdmin>
                <MadrassasPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requireSuperAdmin>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          {/* Per-madrassa app (requires a madrassa context) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireMadrassa>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute requireMadrassa>
                <AttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute requireMadrassa>
                <ClassesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students"
            element={
              <ProtectedRoute requireMadrassa>
                <StudentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <ProtectedRoute requireMadrassa adminOnly>
                <TeachersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requireMadrassa>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
