import { ClerkProvider } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import './globals.css';
import { GlobalNav } from '@/components/global-nav';

export const metadata: Metadata = { title: 'ACMI Console' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {isSignedIn && <GlobalNav />}
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
