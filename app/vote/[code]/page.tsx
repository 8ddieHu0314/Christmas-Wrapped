'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Send, LogIn, ArrowLeft } from 'lucide-react';
import { Sparkles } from '@/components/Sparkles';
import { isVotingOpen } from '@/lib/date-utils';
import {
  getVotePageCache,
  setVotePageCache,
  markVotePageAsVoted,
  type Category,
  type CalendarOwner,
} from '@/lib/vote-cache';

function VotePageContent({ calendarCode }: { calendarCode: string }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [calendarOwner, setCalendarOwner] = useState<CalendarOwner | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);
  const [hasInvitation, setHasInvitation] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        // Check if voting is still open
        if (!isVotingOpen()) {
          setError('Voting has closed (deadline was Dec 15)');
          setLoading(false);
          return;
        }

        // Check if user is authenticated
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setCurrentUser(null);
          // Still load calendar owner for display
          const { data: owner } = await supabase
            .from('users')
            .select('id, name, email, calendar_code')
            .eq('calendar_code', calendarCode)
            .single();
          setCalendarOwner(owner);
          setLoading(false);
          return;
        }
        
        setCurrentUser(authUser);

        // Check cache first
        const cached = getVotePageCache(authUser.id, calendarCode);
        if (cached) {
          if (cached.error) {
            setError(cached.error);
          } else {
            setCalendarOwner(cached.calendarOwner);
            setCategories(cached.categories);
            setHasAlreadyVoted(cached.hasAlreadyVoted);
            setHasInvitation(cached.hasInvitation);
          }
          setLoading(false);
          return;
        }

        // No cache - fetch from database
        const { data: currentUserData } = await supabase
          .from('users')
          .select('email')
          .eq('id', authUser.id)
          .single();

        // Fetch calendar owner by code
        const { data: owner, error: ownerError } = await supabase
          .from('users')
          .select('id, name, email, calendar_code')
          .eq('calendar_code', calendarCode)
          .single();

        if (ownerError || !owner) {
          const errorMsg = 'Calendar not found';
          setError(errorMsg);
          setVotePageCache(authUser.id, calendarCode, {
            calendarOwner: null as any,
            categories: [],
            hasAlreadyVoted: false,
            hasInvitation: false,
            error: errorMsg,
          });
          setLoading(false);
          return;
        }

        // Prevent self-voting
        if (authUser.id === owner.id) {
          const errorMsg = 'You cannot vote on your own calendar!';
          setError(errorMsg);
          setVotePageCache(authUser.id, calendarCode, {
            calendarOwner: owner,
            categories: [],
            hasAlreadyVoted: false,
            hasInvitation: false,
            error: errorMsg,
          });
          setLoading(false);
          return;
        }

        setCalendarOwner(owner);

        let userHasInvitation = false;
        let userHasAlreadyVoted = false;

        // Check if user has an invitation for this calendar
        if (currentUserData?.email) {
          const { data: invitation } = await supabase
            .from('invitations')
            .select('id, status')
            .eq('email', currentUserData.email)
            .eq('sender_id', owner.id)
            .single();

          if (invitation) {
            userHasInvitation = true;
            setHasInvitation(true);
            
            // Check if already voted
            if (invitation.status === 'voted') {
              userHasAlreadyVoted = true;
              setHasAlreadyVoted(true);
              setVotePageCache(authUser.id, calendarCode, {
                calendarOwner: owner,
                categories: [],
                hasAlreadyVoted: true,
                hasInvitation: true,
                error: null,
              });
              setLoading(false);
              return;
            }
          } else {
            // No invitation - user cannot vote
            const errorMsg = 'You need an invitation to vote on this calendar';
            setError(errorMsg);
            setVotePageCache(authUser.id, calendarCode, {
              calendarOwner: owner,
              categories: [],
              hasAlreadyVoted: false,
              hasInvitation: false,
              error: errorMsg,
            });
            setLoading(false);
            return;
          }
        }

        // Also check votes table directly
        const { data: existingVotes } = await supabase
          .from('votes')
          .select('id')
          .eq('calendar_owner_id', owner.id)
          .eq('voter_id', authUser.id)
          .limit(1);

        if (existingVotes && existingVotes.length > 0) {
          userHasAlreadyVoted = true;
          setHasAlreadyVoted(true);
          setVotePageCache(authUser.id, calendarCode, {
            calendarOwner: owner,
            categories: [],
            hasAlreadyVoted: true,
            hasInvitation: userHasInvitation,
            error: null,
          });
          setLoading(false);
          return;
        }

        // Fetch categories
        const { data: cats, error: catsError } = await supabase
          .from('categories')
          .select('*')
          .order('display_order');

        if (catsError) throw catsError;
        setCategories(cats || []);

        // Store in cache
        setVotePageCache(authUser.id, calendarCode, {
          calendarOwner: owner,
          categories: cats || [],
          hasAlreadyVoted: false,
          hasInvitation: userHasInvitation,
          error: null,
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [calendarCode]);

  const handleAnswerChange = (categoryId: number, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [categoryId]: value.substring(0, 500)
    }));
  };

  const handleSubmit = async () => {
    const missingAnswers = categories.filter(c => !answers[c.id]?.trim());
    
    if (missingAnswers.length > 0) {
      alert(`Please fill in: ${missingAnswers.map(c => c.name).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/submit-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarOwnerId: calendarOwner?.id,
          answers,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit votes');
      }

      // Update cache to mark as voted
      if (currentUser?.id) {
        markVotePageAsVoted(currentUser.id, calendarCode);
      }

      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center sparkle-bg">
        <div className="text-2xl animate-pulse text-primary">Loading... 🎁</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col sparkle-bg">
        <Sparkles />
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card/90 backdrop-blur-sm p-8 rounded-xl border border-red-500/30 text-center max-w-md"
          >
            <h1 className="text-2xl font-bold text-red-400 mb-4">Oops!</h1>
            <p className="text-foreground/80 mb-6">{error}</p>
            <Link 
              href="/vote"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary/90"
            >
              <ArrowLeft size={18} />
              Back to Invitations
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (hasAlreadyVoted) {
    return (
      <div className="min-h-screen flex flex-col sparkle-bg">
        <Sparkles />
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card/90 backdrop-blur-sm p-10 rounded-2xl border-2 border-green-500/30 max-w-md text-center"
          >
            <h1 className="text-3xl font-display font-bold text-green-400 mb-4">
              You've Already Voted! 🎄
            </h1>
            <p className="text-xl text-foreground/80">
              Thanks for voting on {calendarOwner?.name}'s calendar.
            </p>
            <p className="text-muted-foreground mt-4">
              Your answers have been saved.
            </p>
            <Link 
              href="/vote"
              className="inline-flex items-center gap-2 mt-6 text-primary hover:text-primary/80"
            >
              <ArrowLeft size={18} />
              Back to Invitations
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col sparkle-bg">
        <Sparkles />
        <div className="flex-1 flex items-center justify-center p-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card/90 backdrop-blur-sm p-10 rounded-2xl border-2 border-primary/30 max-w-md text-center"
          >
            <h1 className="text-4xl font-display font-bold text-primary mb-4">
              Thank you! 🎅
            </h1>
            <p className="text-xl text-foreground/80">
              Your votes have been sent to {calendarOwner?.name}.
            </p>
            <p className="text-muted-foreground mt-4">
              They'll reveal your answers during their advent countdown!
            </p>
            <Link 
              href="/vote"
              className="inline-flex items-center gap-2 mt-6 bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold hover:bg-primary/90"
            >
              <ArrowLeft size={18} />
              Back to Invitations
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col sparkle-bg">
        <Sparkles />
        <div className="bg-primary/90 text-primary-foreground py-8 px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold">
            Vote for {calendarOwner?.name}'s Calendar
          </h1>
          <p className="mt-2 opacity-90">Help build their Gift Calendar!</p>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/90 backdrop-blur-sm p-8 rounded-2xl border border-primary/30 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-foreground mb-4 text-center">
              Sign in to Vote
            </h2>
            <p className="text-muted-foreground mb-6 text-center">
              Create an account or log in to submit your votes for {calendarOwner?.name}.
            </p>

            <Link
              href={`/auth?redirect=/vote/${calendarCode}`}
              className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <LogIn size={20} />
              Sign In to Vote
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col sparkle-bg">
      <Sparkles />
      
      {/* Header */}
      <div className="bg-primary/90 text-primary-foreground py-8 px-4 text-center">
        <Link 
          href="/vote"
          className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 text-sm"
        >
          <ArrowLeft size={16} />
          Back to Invitations
        </Link>
        <h1 className="text-3xl md:text-4xl font-display font-bold">
          Vote for {calendarOwner?.name}
        </h1>
        <p className="mt-2 opacity-90">Tell them what you think represents them best!</p>
      </div>

      <div className="flex-1 container max-w-2xl mx-auto p-4 space-y-6 mt-6 pb-24">
        {/* Voting as info */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card/80 backdrop-blur-sm border border-primary/30 rounded-lg p-4"
        >
          <p className="text-sm text-foreground/80">
            <strong>Voting as:</strong> {currentUser.email}
          </p>
        </motion.div>

        {/* Category forms */}
        {categories.map((category, index) => (
          <motion.div 
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card/80 backdrop-blur-sm rounded-xl border border-border overflow-hidden"
          >
            <div className="bg-primary/10 p-4 border-b border-primary/20">
              <h2 className="text-xl font-bold text-primary flex items-center">
                <span className="bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                  {index + 1}
                </span>
                {category.name}
              </h2>
              <p className="text-muted-foreground mt-1 ml-11 text-sm">{category.description}</p>
            </div>

            <div className="p-5">
              <label className="block text-foreground font-medium mb-2">
                {category.prompt}
              </label>
              <div className="relative">
                <textarea
                  className="w-full bg-input border border-border rounded-lg p-4 pr-16 focus:ring-2 focus:ring-primary focus:border-transparent resize-none transition-shadow text-foreground placeholder:text-muted-foreground"
                  placeholder={category.code === 'personal_note' 
                    ? "Write your heartfelt message here..." 
                    : `Write your answer for ${calendarOwner?.name}...`}
                  maxLength={500}
                  rows={category.code === 'personal_note' ? 5 : 3}
                  value={answers[category.id] || ''}
                  onChange={(e) => handleAnswerChange(category.id, e.target.value)}
                />
                <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                  {(answers[category.id]?.length || 0)}/500
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Submit button */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="sticky bottom-6 z-20"
        >
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-xl shadow-xl hover:bg-primary/90 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-3"
          >
            {submitting ? (
              'Sending Votes...'
            ) : (
              <>
                <Send size={24} />
                Submit All Answers
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default function VotePage({ params }: { params: { code: string } }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center sparkle-bg">
        <div className="text-2xl animate-pulse text-primary">Loading... 🎁</div>
      </div>
    }>
      <VotePageContent calendarCode={params.code} />
    </Suspense>
  );
}
