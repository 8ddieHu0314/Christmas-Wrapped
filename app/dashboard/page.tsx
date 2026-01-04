'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [calendarCode, setCalendarCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voteStats, setVoteStats] = useState<any[]>([]);
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  useEffect(() => {
    async function loadData() {
      // Get authenticated user
      const { "data": { "user": authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/');
        return;
      }
      
      // Fetch user data including calendar_code
      const { "data": userData, "error": userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (userData) {
        setUser(userData);
        setCalendarCode(userData.calendar_code);
        
        // If calendar exists, fetch vote statistics
        if (userData.calendar_code) {
          await fetchVoteStats(authUser.id);
        }
      }
    }
    
    loadData();
  }, []);
  
  async function fetchVoteStats(userId: string) {
    const { "data": votes } = await supabase
      .from('votes')
      .select('category_id, categories(name)')
      .eq('calendar_owner_id', userId);
    
    if (votes) {
      // Group by category and count
      const stats = votes.reduce((acc: any, "vote": any) => {
        const categoryName = vote.categories?.name || 'Unknown';
        acc[categoryName] = (acc[categoryName] || 0) + 1;
        return acc;
      }, {});
      
      setVoteStats(Object.entries(stats).map(([name, count]) => ({ name, count })));
    }
  }
  
  async function handleGenerateCalendar() {
    if (calendarCode) {
      alert('Your calendar is already ready!');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate calendar');
      }
      
      if (data.success && data.calendar_code) {
        setCalendarCode(data.calendar_code);
        alert('🎄 ' + data.message);
        
        // Refresh vote stats
        const { "data": { "user": authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await fetchVoteStats(authUser.id);
        }
      }
    } catch (err: any) {
      console.error('Generate calendar error:', err);
      setError(err.message || 'Something went wrong');
      alert('Error: ' + (err.message || 'Failed to generate calendar'));
    } finally {
      setLoading(false);
    }
  }
  
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  const shareUrl = calendarCode 
    ? `${window.location.origin}/vote/${calendarCode}`
    : null;
  
  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-christmas font-bold mb-4 text-christmas-red">
        Hello, {user.name}! 🎄 Your Christmas Advent Calendar
      </h1>
      
      {calendarCode ? (
        <div className="bg-green-100 p-6 rounded-lg mb-8 border-2 border-green-200 shadow-md">
          <p className="font-bold text-lg text-green-800">Your Calendar Code: <span className="font-mono text-2xl">{calendarCode}</span></p>
          <p className="mt-4 text-green-700">Share this link with friends to get votes:</p>
          <div className="flex gap-2 mt-2">
            <input 
              type="text" 
              readOnly 
              value={shareUrl || ''} 
              className="w-full p-3 border rounded-md bg-white text-gray-700"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button 
              onClick={() => {navigator.clipboard.writeText(shareUrl || ''); alert('Copied!');}}
              className="bg-green-600 text-white px-4 rounded-md hover:bg-green-700"
            >
              Copy
            </button>
          </div>
        </div>
      ) : (
        <div className="my-8 text-center">
          <p className="mb-4 text-lg">You haven't generated your calendar yet!</p>
          <button
            onClick={handleGenerateCalendar}
            disabled={loading}
            className="bg-red-600 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-red-700 disabled:opacity-50 shadow-lg transform hover:scale-105 transition-all"
          >
            {loading ? '⏳ Generating...' : '🎄 Generate My Calendar'}
          </button>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mt-4 border border-red-200">
          Error: {error}
        </div>
      )}
      
      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Vote Statistics</h2>
          {voteStats.length > 0 ? (
            <div className="space-y-2">
              {voteStats.map((stat) => (
                <div key={stat.name} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="font-medium">{stat.name}</span>
                  <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-bold">{stat.count} votes</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No votes received yet. Share your link!</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-center items-center text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Calendar</h2>
          <p className="mb-6 text-gray-600">View your calendar to see what your friends have chosen for you!</p>
          <Link 
            href="/calendar"
            className="bg-christmas-gold text-yellow-900 px-6 py-3 rounded-lg font-bold hover:bg-yellow-400 inline-block w-full"
          >
            🎁 View My Calendar
          </Link>
        </div>
      </div>
    </div>
  );
}