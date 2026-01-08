'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Sparkles } from '@/components/Sparkles';
import CountdownTimer from '@/components/CountdownTimer';
import GiftBox from '@/components/GiftBox';
import RevealModal from '@/components/RevealModal';
import confetti from 'canvas-confetti';
import { CATEGORIES } from '@/lib/constants';

interface FriendStats {
  total: number
  voted: number;
}

function CalendarPageContent() {
  const [user, setUser] = useState<any>(null);
  const [reveals, setReveals] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalData, setModalData] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealingDay, setRevealingDay] = useState<number | null>(null);
  const [friendStats, setFriendStats] = useState<FriendStats>({ total: 0, voted: 0 });
  
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testMode = searchParams.get('testMode') === 'true';

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth');
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

      // Fetch friend voting stats
      await fetchFriendStats();
      
      setLoading(false);
    }
    loadData();
  }, []);

  async function fetchFriendStats() {
    try {
      const response = await fetch('/api/invite-friends');
      const data = await response.json();
      if (data.success && data.invitations) {
        const total = data.invitations.length;
        const voted = data.invitations.filter((i: any) => i.hasVoted).length;
        setFriendStats({ total, voted });
      }
    } catch (err) {
      console.error('Failed to fetch friend stats:', err);
    }
  }

  const handleReveal = async (day: number) => {
    if (revealingDay !== null) return;
    
    setRevealingDay(day);
    try {
      const response = await fetch('/api/reveal-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, testMode }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });

        setReveals(prev => [...prev, day]);
        setModalData(data);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Reveal error', error);
    } finally {
      setRevealingDay(null);
    }
  };

  const handleBoxClick = async (day: number, isRevealed: boolean) => {
    if (isRevealed) {
      // Re-fetch and show modal
      try {
        const response = await fetch('/api/reveal-day', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day, testMode }),
        });
        const data = await response.json();
        if (data.success) {
          setModalData(data);
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error('Fetch error', error);
      }
    } else {
      handleReveal(day);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center sparkle-bg">
        <div className="text-2xl animate-pulse text-primary">Loading your gifts... 🎁</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative sparkle-bg">
      <Sparkles />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Your Gift Calendar 🎁
          </h1>
          <p className="text-muted-foreground">
            Open a new box each day to discover what your friends think of you!
          </p>
        </div>

        {/* Countdown */}
        <CountdownTimer />

        {/* Friends status */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-full border border-border">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm text-foreground">
              {friendStats.voted} of {friendStats.total} friends have voted
            </span>
            <Link
              href="/invite"
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              Invite more
            </Link>
          </div>
        </div>

        {/* Gift Grid */}
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-4">
            {CATEGORIES.map((category) => (
              <GiftBox
                key={category.id}
                category={category}
                day={category.id}
                isRevealed={reveals.includes(category.id)}
                testMode={testMode}
                onReveal={() => handleBoxClick(category.id, reveals.includes(category.id))}
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gift-red border border-primary/50" />
            <span>Locked / Ready to open</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-revealed border border-primary/50" />
            <span>Opened</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground text-sm">
        <p>🎄 Made with love for the holiday season 🎄</p>
      </footer>

      {/* Reveal Modal */}
      {isModalOpen && modalData && (
        <RevealModal 
          data={modalData} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center sparkle-bg">
        <div className="text-2xl animate-pulse text-primary">Loading... 🎁</div>
      </div>
    }>
      <CalendarPageContent />
    </Suspense>
  );
}
