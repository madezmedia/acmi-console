import { UserButton, OrganizationSwitcher } from '@clerk/nextjs';
import Link from 'next/link';

export function GlobalNav() {
  return (
    <nav className="flex items-center justify-between border-b px-6 py-3">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-lg font-bold">
          ACMI Console
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <OrganizationSwitcher />
        <UserButton />
      </div>
    </nav>
  );
}
