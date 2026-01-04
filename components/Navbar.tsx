'use client';

import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, usePathname } from 'next/navigation';

export default function Navbar() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (pathname === '/' || pathname === '/signup' || pathname.startsWith('/vote')) return null;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center relative z-20">
      <Link href="/dashboard" className="font-christmas text-2xl font-bold text-christmas-red">
        Advent Calendar
      </Link>
      <div className="flex gap-4">
        <Link href="/dashboard" className="text-gray-600 hover:text-christmas-green font-medium">
          Dashboard
        </Link>
        <Link href="/calendar" className="text-gray-600 hover:text-christmas-green font-medium">
          Calendar
        </Link>
        <button 
          onClick={handleLogout}
          className="text-red-600 hover:text-red-800 font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}