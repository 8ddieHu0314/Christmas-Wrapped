'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function VotePage({ params }: { params: { code: string } }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [calendarOwner, setCalendarOwner] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [votes, setVotes] = useState<Record<number, number>>({});
  const [personalNote, setPersonalNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch user by code
        const { data: owner, error: ownerError } = await supabase
          .from('users')
          .select('id, name, voting_enabled')
          .eq('calendar_code', params.code)
          .single();

        if (ownerError || !owner) {
          setError('Calendar not found');
          setLoading(false);
          return;
        }

        setCalendarOwner(owner);

        // Fetch categories and options
        const { data: cats, error: catsError } = await supabase
          .from('categories')
          .select(`
            *,
            options (*)
          `)
          .order('display_order');

        if (catsError) throw catsError;

        // Sort options by display_order
        const sortedCats = cats.map(cat => ({
          ...cat,
          options: cat.options.sort((a: any, b: any) => a.display_order - b.display_order)
        }));

        setCategories(sortedCats);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [params.code]);

  const handleOptionSelect = (categoryId: number, optionId: number) => {
    setVotes(prev => ({
      ...prev,
      [categoryId]: optionId
    }));
  };

  const handleSubmit = async () => {
    // Validate
    const requiredCategories = categories.filter(c => c.code !== 'personal_note');
    const missingVotes = requiredCategories.filter(c => !votes[c.id]);
    
    if (missingVotes.length > 0) {
      alert(`Please select an option for: ${missingVotes.map(c => c.name).join(', ')}`);
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
          votes,
          personalNote,
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

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (success) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-christmas-cream">
      <motion.div 
        initial={{ "scale": 0.8, "opacity": 0 }}
        animate={{ "scale": 1, "opacity": 1 }}
        className="bg-white p-10 rounded-2xl shadow-xl border-4 border-christmas-green"
      >
        <h1 className="text-4xl font-christmas font-bold text-christmas-red mb-4">Thank you for voting! 🎅</h1>
        <p className="text-xl text-gray-700">Your choices have been sent to {calendarOwner.name}.</p>
      </motion.div>
    </div>
  );

  if (!calendarOwner.voting_enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-2">Voting has ended</h1>
          <p>Sorry, this calendar is no longer accepting votes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-christmas-red text-white py-8 px-4 text-center shadow-lg">
        <h1 className="text-3xl md:text-5xl font-christmas font-bold">Vote for {calendarOwner.name}'s Calendar</h1>
        <p className="mt-2 opacity-90">Help build their Advent Calendar!</p>
      </div>

      <div className="max-w-3xl mx-auto p-4 space-y-8 mt-8">
        {categories.map((category, index) => (
          <motion.div 
            key={category.id}
            initial={{ "opacity": 0, "y": 20 }}
            animate={{ "opacity": 1, "y": 0 }}
            transition={{ "delay": index * 0.1 }}
            className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100"
          >
            <div className="bg-christmas-green/10 p-4 border-b border-christmas-green/20">
              <h2 className="text-xl font-bold text-christmas-green flex items-center">
                <span className="bg-christmas-green text-white w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                  {index + 1}
                </span>
                {category.name}
              </h2>
              <p className="text-gray-600 mt-1 ml-11 text-sm">{category.description}</p>
            </div>

            <div className="p-6">
              {category.code === 'personal_note' ? (
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-christmas-green focus:border-transparent h-32"
                  placeholder="Write a warm Christmas message... (max 500 chars)"
                  maxLength={500}
                  value={personalNote}
                  onChange={(e) => setPersonalNote(e.target.value)}
                />
              ) : (
                <div className="space-y-3">
                  {category.options.map((option: any) => (
                    <label 
                      key={option.id} 
                      className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                        votes[category.id] === option.id 
                          ? 'border-christmas-red bg-red-50 ring-1 ring-christmas-red' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`category-${category.id}`}
                        value={option.id}
                        checked={votes[category.id] === option.id}
                        onChange={() => handleOptionSelect(category.id, option.id)}
                        className="mt-1 mr-3 text-christmas-red focus:ring-christmas-red"
                      />
                      <div>
                        <span className="font-bold block text-gray-800">{option.title}</span>
                        <span className="text-sm text-gray-600">{option.description}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))}

        <div className="sticky bottom-6 z-20">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-christmas-red text-white py-4 rounded-xl font-bold text-xl shadow-xl hover:bg-red-700 transition-transform transform hover:scale-[1.02] disabled:opacity-70 disabled:scale-100"
          >
            {submitting ? 'Sending Votes...' : '🎄 Submit All Votes 🎄'}
          </button>
        </div>
      </div>
    </div>
  );
}