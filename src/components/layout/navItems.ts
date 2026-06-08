import { LayoutDashboard, GraduationCap, Users, BookOpen, ClipboardCheck, BarChart3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/attendance', labelKey: 'nav.attendance', icon: ClipboardCheck },
  { to: '/classes', labelKey: 'nav.classes', icon: BookOpen },
  { to: '/students', labelKey: 'nav.students', icon: Users },
  { to: '/teachers', labelKey: 'nav.teachers', icon: GraduationCap, adminOnly: true },
  { to: '/reports', labelKey: 'nav.reports', icon: BarChart3 },
];

export function visibleNavItems(isAdmin: boolean): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
}
