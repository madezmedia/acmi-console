'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '⊞' },
  { href: '/admin/agents', label: 'Agents', icon: '●' },
  { href: '/admin/work', label: 'Work Items', icon: '☰' },
  { href: '/admin/timeline', label: 'Timeline', icon: '≡' },
  { href: '/admin/coordination', label: 'Coordination', icon: '⬡' },
  { href: '/admin/hitl', label: 'HITL Queue', icon: '⚑' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 flex-col border-r bg-muted/30 p-4">
      <div className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Fleet Management
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
