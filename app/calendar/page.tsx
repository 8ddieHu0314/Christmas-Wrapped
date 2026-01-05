'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import CalendarGrid from '@/components/CalendarGrid';
import ProgressSidebar from '@/components/ProgressSidebar';
import AdminPanel from '@/components/AdminPanel';

function CalendarPageContent() {
  const [user, setUser] = useState<any>(null);
  const [reveals, setReveals] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testMode = searchParams.get('testMode') === 'true';

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/');
        return;
      }
      setUser(authUser);

      // Fetch reveals
      const { data: revealsData } = await supabase
        .from('reveals')
        .select('category_id')
        .eq('user_id', authUser.id);
      
      if (revealsData) {
        setReveals(revealsData.map(r => r.category_id));
      }
      
      setLoading(false);
    }
    loadData();
  }, []);

  const handleReveal = async (day: number) => {
    // Optimistic update
    setReveals(prev => [...prev, day]);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto">
      <div className="flex-1">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-christmas font-bold text-christmas-red">
            My Advent Calendar
          </h1>
        </div>
        
        <CalendarGrid 
          revealedDays={reveals} 
          onReveal={handleReveal} 
          testMode={testMode}
        />
      </div>
      
      <div className="md:w-80 space-y-6">
        <ProgressSidebar revealedCount={reveals.length} totalDays={9} />
        {testMode && <AdminPanel />}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CalendarPageContent />
    </Suspense>
  );
}
