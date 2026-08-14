import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  MapPin,
  ClipboardList,
  CalendarClock,
  AlertTriangle,
  History,
  FileCheck2,
  BarChart3,
  ScrollText,
  Settings as SettingsIcon,
  Camera,
  type LucideIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: string[]; // roles allowed to see this link
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'hr', 'supervisor', 'employee'] }],
  },
  {
    label: 'My Work',
    items: [
      { to: '/attendance/live', label: 'Live Attendance', icon: Camera, roles: ['employee'] },
      { to: '/leaves/mine', label: 'Leave Requests', icon: CalendarClock, roles: ['employee'] },
      { to: '/reports/mine', label: 'My Reports', icon: BarChart3, roles: ['employee'] },
    ],
  },
  {
    label: 'Attendance',
    items: [
      { to: '/attendance', label: 'Live Attendance', icon: ClipboardList, roles: ['admin', 'hr', 'supervisor'] },
      { to: '/attendance/daily', label: 'Daily by Site', icon: CalendarClock, roles: ['admin', 'hr', 'supervisor'] },
      { to: '/attendance/pending', label: 'Pending Approvals', icon: FileCheck2, roles: ['admin', 'hr', 'supervisor'] },
      { to: '/attendance/alerts', label: 'Attendance Alerts', icon: AlertTriangle, roles: ['admin', 'hr', 'supervisor'] },
    ],
  },
  {
    label: 'People',
    items: [
      { to: '/employees', label: 'Employees', icon: Users, roles: ['admin', 'hr'] },
      { to: '/registrations/pending', label: 'Pending Registrations', icon: UserPlus, roles: ['admin', 'hr'] },
      { to: '/sites', label: 'Sites', icon: MapPin, roles: ['admin', 'hr'] },
    ],
  },
  {
    label: 'Leave',
    items: [{ to: '/leaves', label: 'Leave Approvals', icon: History, roles: ['admin', 'hr', 'supervisor'] }],
  },
  {
    label: 'Insights',
    items: [
      { to: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'hr', 'supervisor'] },
      { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: ['admin'] },
      { to: '/settings', label: 'Settings', icon: SettingsIcon, roles: ['admin'] },
    ],
  },
];

const Sidebar: React.FC = () => {
  const role = useAuthStore((state) => state.user?.role);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-600 text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white'
    }`;

  return (
    <nav className="flex flex-col gap-5">
      {NAV_GROUPS.map((group) => {
        const visibleItems = group.items.filter((item) => !role || item.roles.includes(role));
        if (visibleItems.length === 0) return null;
        return (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-xs font-semibold uppercase tracking-wider text-ink-500">{group.label}</p>
            <div className="space-y-0.5">
              {visibleItems.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} end className={linkClass}>
                  <Icon size={17} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

export default Sidebar;
