'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { Sparkles } from '@/components/Sparkles';
import CountdownTimer from '@/components/CountdownTimer';
import GiftBox from '@/components/GiftBox';
import RevealModal from '@/components/RevealModal';
import confetti from 'canvas-confetti';
import { CATEGORIES } from '@/lib/constants';
import {
  getCalendarCache,
  setCalendarCache,
  updateCacheReveals,
  type CategoryData,
  type Vote,
} from '@/lib/calendar-cache';

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
  const [friendStats, setFriendStats] = useState<FriendStats>({ total: 0, voted: 0 });
  const [categoryDataMap, setCategoryDataMap] = useState<Record<number, CategoryData>>({});
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth');
        return;
      }
      setUser(authUser);

      // Check cache first - use cached data without refetching
      const cached = getCalendarCache(authUser.id);
      if (cached) {
        setReveals(cached.reveals);
        setCategoryDataMap(cached.categoryDataMap);
        setFriendStats(cached.friendStats);
        setLoading(false);
        return;
      }

      // No cache - fetch ALL data upfront
      await fetchAllData(authUser.id);
      setLoading(false);
    }

    async function fetchAllData(userId: string) {
      // Fetch reveals
      const { data: revealsData } = await supabase
        .from('reveals')
        .select('category_id')
        .eq('user_id', userId);
      
      const revealedIds = revealsData?.map(r => r.category_id) || [];
      setReveals(revealedIds);

      // Fetch ALL category answers for ALL categories (not just revealed ones)
      const { data: allAnswers } = await supabase
        .from('category_answers')
        .select('id, category_id, answer, vote_count')
        .eq('calendar_owner_id', userId)
        .order('vote_count', { ascending: false });

      // Fetch ALL votes with voter info
      const answerIds = allAnswers?.map(a => a.id) || [];
      const { data: allVotes } = answerIds.length > 0 
        ? await supabase
            .from('votes')
            .select(`
              answer_id,
              voter_id,
              users!votes_voter_id_fkey (name, email)
            `)
            .in('answer_id', answerIds)
        : { data: [] };

      // Build voters map: answer_id -> voter names
      const votersMap: Record<string, string[]> = {};
      allVotes?.forEach((vote: any) => {
        const answerId = vote.answer_id;
        const voterName = vote.users?.name || vote.users?.email?.split('@')[0] || 'Anonymous';
        if (!votersMap[answerId]) votersMap[answerId] = [];
        votersMap[answerId].push(voterName);
      });

      // Build category data map for all categories
      const newCategoryDataMap: Record<number, CategoryData> = {};
      
      for (const category of CATEGORIES) {
        const categoryAnswers = allAnswers?.filter(a => a.category_id === category.id) || [];
        const answersWithVoters: Vote[] = categoryAnswers.map(a => ({
          id: a.id,
          answer: a.answer,
          voteCount: a.vote_count,
          voters: votersMap[a.id] || [],
        }));
        
        const totalVotes = answersWithVoters.reduce((sum, a) => sum + a.voteCount, 0);
        const winner = answersWithVoters.length > 0 ? answersWithVoters[0] : undefined;
        
        newCategoryDataMap[category.id] = {
          category: {
            name: category.name,
            description: '',
            code: category.id === 9 ? 'personal_note' : category.name.toLowerCase(),
          },
          type: category.id === 9 ? 'notes' : 'answers',
          answers: answersWithVoters,
          winner,
          totalVotes,
        };
      }
      
      setCategoryDataMap(newCategoryDataMap);

      // Fetch friend voting stats
      const newFriendStats = await fetchFriendStatsData();
      
      // Store in cache for subsequent navigation
      setCalendarCache(userId, revealedIds, newCategoryDataMap, newFriendStats);
    }

    loadData();
  }, []);

  async function fetchFriendStatsData(): Promise<FriendStats> {
    try {
      const response = await fetch('/api/invite-friends');
      const data = await response.json();
      if (data.success && data.invitations) {
        const total = data.invitations.length;
        const voted = data.invitations.filter((i: any) => i.hasVoted).length;
        const stats = { total, voted };
        setFriendStats(stats);
        return stats;
      }
    } catch (err) {
      console.error('Failed to fetch friend stats:', err);
    }
    return { total: 0, voted: 0 };
  }

  const handleBoxClick = (day: number, isRevealed: boolean) => {
    const categoryData = categoryDataMap[day];
    if (!categoryData) return;

    // Show modal immediately from cached data
    setModalData({
      success: true,
      ...categoryData,
    });
    setIsModalOpen(true);

    if (!isRevealed) {
      // Trigger confetti for new reveals
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Update reveals state and cache
      const newReveals = [...reveals, day];
      setReveals(newReveals);
      if (user) {
        updateCacheReveals(user.id, newReveals);
      }

      // Fire-and-forget API call to record reveal in database
      fetch('/api/reveal-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day }),
      }).catch(err => console.error('Failed to record reveal:', err));
    }
  };

  // Build votesMap from categoryDataMap for GiftBox component
  const votesMap: Record<number, Vote[]> = {};
  Object.entries(categoryDataMap).forEach(([id, data]) => {
    votesMap[Number(id)] = data.answers;
  });

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
                votes={votesMap[category.id] || []}
                isRevealed={reveals.includes(category.id)}
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
