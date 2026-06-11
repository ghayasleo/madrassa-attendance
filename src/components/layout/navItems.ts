import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  BarChart3,
  Building2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

/** The per-madrassa app navigation (admins, teachers, impersonating super-admin). */
export const APP_NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/attendance', labelKey: 'nav.attendance', icon: ClipboardCheck },
  { to: '/classes', labelKey: 'nav.classes', icon: BookOpen },
  { to: '/students', labelKey: 'nav.students', icon: Users },
  { to: '/teachers', labelKey: 'nav.teachers', icon: GraduationCap, adminOnly: true },
  { to: '/reports', labelKey: 'nav.reports', icon: BarChart3 },
];

/** The super-admin management navigation (no madrassa selected). */
export const SUPER_NAV_ITEMS: NavItem[] = [
  { to: '/admin', labelKey: 'nav.overview', icon: LayoutDashboard },
  { to: '/admin/madrassas', labelKey: 'nav.madrassas', icon: Building2 },
  { to: '/admin/users', labelKey: 'nav.users', icon: Users },
];

export type NavContext = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isImpersonating: boolean;
};

export function visibleNavItems({ isAdmin, isSuperAdmin, isImpersonating }: NavContext): NavItem[] {
  if (isSuperAdmin && !isImpersonating) return SUPER_NAV_ITEMS;
  // Admin/teacher, or a super-admin browsing inside a madrassa.
  return APP_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin || isImpersonating);
}
