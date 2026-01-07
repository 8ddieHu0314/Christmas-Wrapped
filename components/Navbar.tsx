'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Gift, Users, LogOut, Vote } from 'lucide-react';

export default function Navbar() {
  const [userName, setUserName] = useState<string | null>(null);
  const [pendingInvites, setPendingInvites] = useState(0);
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get display name from metadata or fetch from users table
        const displayName = user.user_metadata?.display_name || user.user_metadata?.name;
        if (displayName) {
          setUserName(displayName);
        } else {
          // Fetch from users table
          const { data: userData } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', user.id)
            .single();
          setUserName(userData?.name || user.email?.split('@')[0] || 'Friend');

          // Count pending invitations
          if (userData?.email) {
            const { count } = await supabase
              .from('invitations')
              .select('*', { count: 'exact', head: true })
              .eq('email', userData.email)
              .in('status', ['pending', 'accepted']);
            
            setPendingInvites(count || 0);
          }
        }
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
    router.refresh();
  };

  // Hide navbar on auth page and vote form page (but show on /vote list)
  if (pathname === '/' || pathname === '/auth' || (pathname.startsWith('/vote/') && pathname !== '/vote')) {
    return null;
  }

  return (
    <nav className="bg-card/80 backdrop-blur-sm border-b border-primary/20 px-4 py-3 flex justify-between items-center relative z-20">
      {/* Logo */}
      <Link href="/calendar" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
        <span className="text-2xl">🎁</span>
        <span>Friend Gifts</span>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        <Link 
          href="/calendar" 
          className={`flex items-center gap-2 font-medium transition-colors ${
            pathname === '/calendar' 
              ? 'text-primary' 
              : 'text-foreground/70 hover:text-primary'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>My Gifts</span>
        </Link>
        
        <Link 
          href="/invite" 
          className={`flex items-center gap-2 font-medium transition-colors ${
            pathname === '/invite' 
              ? 'text-primary' 
              : 'text-foreground/70 hover:text-primary'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Invite Friends</span>
        </Link>

        <Link 
          href="/vote" 
          className={`flex items-center gap-2 font-medium transition-colors relative ${
            pathname === '/vote' 
              ? 'text-primary' 
              : 'text-foreground/70 hover:text-primary'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>Vote</span>
          {pendingInvites > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {pendingInvites}
            </span>
          )}
        </Link>

        {/* User greeting and logout */}
        <div className="flex items-center gap-4 pl-4 border-l border-primary/20">
          {userName && (
            <span className="text-foreground/80 text-sm">
              Hi, {userName}!
            </span>
          )}
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
