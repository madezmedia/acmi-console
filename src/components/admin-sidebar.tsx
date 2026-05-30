'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/admin'
      ? pathname === '/admin'
      : pathname.startsWith(href + '/') || pathname === href;

  const navContent = (
    <>
      <div className="mb-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Fleet Management
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
              isActive(item.href)
                ? 'bg-primary/10 font-medium text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button — positioned below the global nav */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-3 top-[70px] z-50 rounded-md border bg-background p-2 text-foreground shadow-sm md:hidden"
        aria-label="Toggle sidebar"
      >
        <span className="text-lg">{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Desktop sidebar — always visible */}
      <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:bg-muted/30 md:p-4">
        {navContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile drawer — slides in from the left */}
      <aside
        className={`fixed left-0 top-[57px] z-40 h-[calc(100vh-57px)] w-56 border-r bg-background p-4 shadow-lg transition-transform md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
