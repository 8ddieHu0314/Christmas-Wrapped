'use client';

import { useState, useEffect, Suspense } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Send, LogIn, UserPlus } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  code: string;
  description: string;
  prompt: string;
  display_order: number;
}

function VotePageContent({ calendarCode }: { calendarCode: string }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [calendarOwner, setCalendarOwner] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasAlreadyVoted, setHasAlreadyVoted] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get('invite');

  useEffect(() => {
    async function loadData() {
      try {
        // Check if user is authenticated
        const { data: { user: authUser } } = await supabase.auth.getUser();
        setCurrentUser(authUser);

        // Fetch calendar owner by code
        const { data: owner, error: ownerError } = await supabase
          .from('users')
          .select('id, name, voting_enabled')
          .eq('calendar_code', calendarCode)
          .single();

        if (ownerError || !owner) {
          setError('Calendar not found');
          setLoading(false);
          return;
        }

        // Prevent self-voting
        if (authUser && authUser.id === owner.id) {
          setError('You cannot vote on your own calendar!');
          setLoading(false);
          return;
        }

        setCalendarOwner(owner);

        // Check if already voted (if logged in)
        if (authUser) {
          const { data: existingVotes } = await supabase
            .from('votes')
            .select('id')
            .eq('calendar_owner_id', owner.id)
            .eq('voter_id', authUser.id)
            .limit(1);

          if (existingVotes && existingVotes.length > 0) {
            setHasAlreadyVoted(true);
            setLoading(false);
            return;
          }
        }

        // Fetch categories
        const { data: cats, error: catsError } = await supabase
          .from('categories')
          .select('*')
          .order('display_order');

        if (catsError) throw catsError;
        setCategories(cats || []);

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
      [categoryId]: value.substring(0, 500) // Max 500 chars
    }));
  };

  const handleSubmit = async () => {
    // Validate that all categories have answers
    const missingAnswers = categories.filter(c => !answers[c.id]?.trim());
    
    if (missingAnswers.length > 0) {
      alert(`Please fill in: ${missingAnswers.map(c => c.name).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/submit-vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calendarOwnerId: calendarOwner.id,
          answers,
          inviteToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit votes');
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Oops!</h1>
          <p className="text-gray-600">{error}</p>
          <Link 
            href="/"
            className="inline-block mt-6 bg-christmas-green text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (hasAlreadyVoted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-green-50 to-white">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-2xl shadow-xl border-4 border-christmas-green max-w-md"
        >
          <h1 className="text-3xl font-christmas font-bold text-christmas-green mb-4">
            You've Already Voted! 🎄
          </h1>
          <p className="text-xl text-gray-700">
            Thanks for voting on {calendarOwner.name}'s calendar.
          </p>
          <p className="text-gray-500 mt-4">
            Your answers have been saved.
          </p>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-red-50 to-white">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-10 rounded-2xl shadow-xl border-4 border-christmas-green max-w-md"
        >
          <h1 className="text-4xl font-christmas font-bold text-christmas-red mb-4">
            Thank you for voting! 🎅
          </h1>
          <p className="text-xl text-gray-700">
            Your answers have been sent to {calendarOwner.name}.
          </p>
          <p className="text-gray-500 mt-4">
            They'll reveal your answers during their advent countdown!
          </p>
        </motion.div>
      </div>
    );
  }

  // If not logged in, show auth prompt
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
        <div className="bg-christmas-red text-white py-8 px-4 text-center shadow-lg">
          <h1 className="text-3xl md:text-4xl font-christmas font-bold">
            Vote for {calendarOwner?.name}'s Calendar
          </h1>
          <p className="mt-2 opacity-90">Help build their Advent Calendar!</p>
        </div>

        <div className="max-w-md mx-auto p-6 mt-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-2xl shadow-xl border-2 border-gray-100"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Sign in to Vote
            </h2>
            <p className="text-gray-600 mb-6 text-center">
              Create an account or log in to submit your votes for {calendarOwner?.name}.
            </p>

            <div className="space-y-4">
              <Link
                href={`/signup?redirect=/vote/${calendarCode}${inviteToken ? `?invite=${inviteToken}` : ''}`}
                className="w-full bg-christmas-red text-white py-3 px-4 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                Create Account
              </Link>
              
              <Link
                href={`/login?redirect=/vote/${calendarCode}${inviteToken ? `?invite=${inviteToken}` : ''}`}
                className="w-full bg-white text-christmas-green border-2 border-christmas-green py-3 px-4 rounded-lg font-bold hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn size={20} />
                Log In
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!calendarOwner.voting_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-slate-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h1 className="text-2xl font-bold mb-2">Voting has ended</h1>
          <p className="text-gray-600">Sorry, this calendar is no longer accepting votes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-24">
      <div className="bg-christmas-red text-white py-8 px-4 text-center shadow-lg">
        <h1 className="text-3xl md:text-5xl font-christmas font-bold">
          Vote for {calendarOwner.name}
        </h1>
        <p className="mt-2 opacity-90">Tell them what you think represents them best!</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6 mt-8">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800"
        >
          <p className="text-sm">
            <strong>Voting as:</strong> {currentUser.email}
          </p>
        </motion.div>

        {categories.map((category, index) => (
          <motion.div 
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
          >
            <div className="bg-gradient-to-r from-christmas-green/10 to-transparent p-4 border-b border-christmas-green/20">
              <h2 className="text-xl font-bold text-christmas-green flex items-center">
                <span className="bg-christmas-green text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                  {index + 1}
                </span>
                {category.name}
              </h2>
              <p className="text-gray-600 mt-1 ml-11 text-sm">{category.description}</p>
            </div>

            <div className="p-5">
              <label className="block text-gray-700 font-medium mb-2">
                {category.prompt}
              </label>
              <div className="relative">
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-4 pr-16 focus:ring-2 focus:ring-christmas-green focus:border-transparent resize-none transition-shadow"
                  placeholder={category.code === 'personal_note' 
                    ? "Write your heartfelt message here..." 
                    : `Write your answer for ${calendarOwner.name}...`}
                  maxLength={500}
                  rows={category.code === 'personal_note' ? 5 : 3}
                  value={answers[category.id] || ''}
                  onChange={(e) => handleAnswerChange(category.id, e.target.value)}
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {(answers[category.id]?.length || 0)}/500
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="sticky bottom-6 z-20"
        >
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-christmas-red text-white py-4 rounded-xl font-bold text-xl shadow-xl hover:bg-red-700 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-3"
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    }>
      <VotePageContent calendarCode={params.code} />
    </Suspense>
  );
}
