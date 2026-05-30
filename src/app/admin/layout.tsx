import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AcmiProvider } from '@/lib/acmi/acmi-context';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  return (
    <AcmiProvider>
      <div className="flex min-h-[calc(100vh-57px)]">
        <AdminSidebar />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </AcmiProvider>
  );
}
