'use client';

import { usePathname } from 'next/navigation';
import Snowfall from '@/components/Snowfall';
import Navbar from '@/components/Navbar';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/auth' || pathname === '/';

  return (
    <>
      {!isAuthPage && <Snowfall />}
      {!isAuthPage && <Navbar />}
      <main className="relative z-10">
        {children}
      </main>
    </>
  );
}

