'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.replace('/calendar');
      } else {
        router.replace('/auth');
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center sparkle-bg">
        <div className="text-4xl animate-float">🎁</div>
      </div>
    );
  }

  return null;
}
