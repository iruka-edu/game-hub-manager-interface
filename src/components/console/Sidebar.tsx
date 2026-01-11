'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User, Role } from '@/models/User';

interface SidebarProps {
  user: User;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  badge?: number;
}

const roleLabels: Record<Role, string> = {
  dev: 'Developer',
  qc: 'QC Tester',
  cto: 'CTO',
  ceo: 'CEO',
  admin: 'Administrator',
};

function getMenuItems(user: User): MenuItem[] {
  const hasRole = (role: Role) => user.roles?.includes(role) ?? false;
  const isAdmin = hasRole('admin');
  const isDev = hasRole('dev');
  const isQC = hasRole('qc');
  const isCTO = hasRole('cto');
  const isCEO = hasRole('ceo');
  const canApprove = isCTO || isCEO || isAdmin;
  const canPublish = isAdmin;

  const items: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', href: '/console' },
  ];

  if (isDev || isAdmin) {
    items.push({ id: 'my-games', label: 'Game của tôi', icon: 'folder', href: '/console/my-games' });
  }

  if (isQC || isAdmin) {
    items.push({ id: 'qc-inbox', label: 'QC Inbox', icon: 'inbox', href: '/console/qc-inbox' });
  }

  if (canApprove) {
    items.push({ id: 'approval', label: 'Chờ duyệt', icon: 'check-circle', href: '/console/approval' });
  }

  if (canPublish) {
    items.push({ id: 'publish', label: 'Xuất bản', icon: 'globe', href: '/console/publish' });
  }

  items.push({ id: 'library', label: 'Thư viện Game', icon: 'grid', href: '/console/library' });

  if (isAdmin || isCTO) {
    items.push({ id: 'audit-logs', label: 'Audit Logs', icon: 'clipboard-list', href: '/console/audit-logs' });
    items.push({ id: 'users', label: 'Quản lý User', icon: 'users', href: '/console/users' });
  }

  return items;
}

function MenuIcon({ name }: { name: string }) {
  const iconClass = "w-5 h-5 flex-shrink-0";
  
  switch (name) {
    case 'home':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    case 'folder':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      );
    case 'inbox':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      );
    case 'check-circle':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'globe':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      );
    case 'grid':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'clipboard-list':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      );
    case 'users':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const menuItems = getMenuItems(user);
  const userRoleDisplay = user.roles?.map(r => roleLabels[r] || r).join(', ') || '';

  const getActiveMenu = () => {
    if (pathname === '/console') return 'dashboard';
    const match = menuItems.find(item => 
      item.href !== '/console' && pathname.startsWith(item.href)
    );
    return match?.id || 'dashboard';
  };

  const activeMenu = getActiveMenu();

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-slate-900 text-white z-40 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-slate-700 flex items-center gap-3">
        <Link href="/console" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-bold text-lg whitespace-nowrap">Game Console</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map(item => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  activeMenu === item.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <MenuIcon name={item.icon} />
                <span className="font-medium whitespace-nowrap">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Info */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-semibold">
            {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.name || user.email}</p>
            <p className="text-xs text-slate-400 truncate">{userRoleDisplay}</p>
          </div>
          <a
            href="/api/auth/logout"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            title="Đăng xuất"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}
