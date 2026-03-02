// src/components/dashboard/dashboard-nav.tsx
// Purpose: Header tab navigation between Dashboard and Settings
// Dependencies: next/navigation

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const defaultTabs = [
  { label: 'Dashboard', href: '/dashboard' },
  { label: 'Settings', href: '/dashboard/settings' },
];

export function DashboardNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  const tabs = isAdmin
    ? [...defaultTabs, { label: 'Admin', href: '/dashboard/admin' }]
    : defaultTabs;

  return (
    <nav className="flex items-center gap-1" aria-label="Dashboard navigation">
      {tabs.map((tab) => {
        const isActive = tab.href === '/dashboard'
          ? pathname === '/dashboard'
          : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                ? 'text-[#1B365D] bg-gray-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
