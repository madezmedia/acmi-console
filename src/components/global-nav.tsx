import { UserButton, OrganizationSwitcher } from '@clerk/nextjs';
import Link from 'next/link';

export function GlobalNav() {
  return (
    <nav className="flex items-center justify-between border-b px-3 py-2 md:px-6 md:py-3">
      <div className="flex items-center gap-2 md:gap-4">
        <Link href="/" className="text-base font-bold md:text-lg">
          ACMI Console
        </Link>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <OrganizationSwitcher />
        <UserButton />
      </div>
    </nav>
  );
}
