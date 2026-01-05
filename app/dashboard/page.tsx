'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Copy, Check, Trash2, UserCheck, Clock, Send } from 'lucide-react';

interface Invitation {
  id: string;
  email: string;
  status: string;
  invite_token: string;
  created_at: string;
  hasVoted: boolean;
  calendar_code: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [calendarCode, setCalendarCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newEmails, setNewEmails] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  
  useEffect(() => {
    async function loadData() {
      // Get authenticated user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/');
        return;
      }
      
      // Fetch user data including calendar_code
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (userData) {
        setUser(userData);
        setCalendarCode(userData.calendar_code);
        
        // If calendar exists, fetch invitations
        if (userData.calendar_code) {
          await fetchInvitations();
        }
      }
    }
    
    loadData();
  }, []);
  
  async function fetchInvitations() {
    try {
      const response = await fetch('/api/invite-friends');
      const data = await response.json();
      if (data.success) {
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error('Failed to fetch invitations:', err);
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
      }
    } catch (err: any) {
      console.error('Generate calendar error:', err);
      setError(err.message || 'Something went wrong');
      alert('Error: ' + (err.message || 'Failed to generate calendar'));
    } finally {
      setLoading(false);
    }
  }

  async function handleInviteFriends() {
    if (!newEmails.trim()) return;

    setInviteLoading(true);
    try {
      // Parse emails (comma or newline separated)
      const emails = newEmails
        .split(/[,\n]/)
        .map(e => e.trim())
        .filter(e => e.length > 0);

      const response = await fetch('/api/invite-friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitations');
      }

      setNewEmails('');
      await fetchInvitations();
      
      if (data.invited > 0) {
        alert(`✉️ Created ${data.invited} invitation(s)! Share the links with your friends.`);
      } else {
        alert(data.message);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleDeleteInvitation(invitationId: string) {
    if (!confirm('Remove this invitation?')) return;

    try {
      const response = await fetch('/api/invite-friends', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });

      if (response.ok) {
        setInvitations(prev => prev.filter(i => i.id !== invitationId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  function copyInviteLink(invitation: Invitation) {
    const link = `${window.location.origin}/vote/${invitation.calendar_code}?invite=${invitation.invite_token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(invitation.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function getStatusBadge(invitation: Invitation) {
    if (invitation.hasVoted) {
      return (
        <span className="flex items-center gap-1 text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-medium">
          <Check size={12} /> Voted
        </span>
      );
    }
    if (invitation.status === 'accepted') {
      return (
        <span className="flex items-center gap-1 text-blue-700 bg-blue-100 px-2 py-1 rounded-full text-xs font-medium">
          <UserCheck size={12} /> Joined
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-1 rounded-full text-xs font-medium">
        <Clock size={12} /> Pending
      </span>
    );
  }
  
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  const voteCount = invitations.filter(i => i.hasVoted).length;
  
  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-christmas font-bold mb-6 text-christmas-red">
        Hello, {user.name}! 🎄
      </h1>
      
      {calendarCode ? (
        <>
          {/* Calendar Ready Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl mb-8 border-2 border-green-200 shadow-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-500 text-white p-2 rounded-full">
                <Check size={24} />
              </div>
              <div>
                <p className="font-bold text-lg text-green-800">Your Calendar is Ready!</p>
                <p className="text-green-600 text-sm">Calendar Code: <span className="font-mono font-bold">{calendarCode}</span></p>
              </div>
            </div>
          </motion.div>

          {/* Invite Friends Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center gap-2">
              <Mail className="text-christmas-red" /> Invite Friends to Vote
            </h2>
            <p className="text-gray-600 mb-4">
              Enter your friends' email addresses. They'll need to create an account to vote on your calendar.
            </p>
            
            <div className="flex flex-col md:flex-row gap-3">
              <textarea
                value={newEmails}
                onChange={(e) => setNewEmails(e.target.value)}
                placeholder="friend1@email.com, friend2@email.com..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-christmas-red focus:border-transparent resize-none"
                rows={2}
              />
              <button
                onClick={handleInviteFriends}
                disabled={inviteLoading || !newEmails.trim()}
                className="bg-christmas-red text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Send size={18} />
                {inviteLoading ? 'Sending...' : 'Send Invites'}
              </button>
            </div>
          </motion.div>

          {/* Invitations List */}
          {invitations.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Invited Friends ({invitations.length})
                </h2>
                <span className="text-sm text-gray-500">
                  {voteCount} of {invitations.length} voted
                </span>
              </div>
              
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div 
                    key={invitation.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-medium text-gray-800 truncate">{invitation.email}</span>
                      {getStatusBadge(invitation)}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyInviteLink(invitation)}
                        className="p-2 text-gray-500 hover:text-christmas-green hover:bg-green-50 rounded-lg transition-colors"
                        title="Copy invite link"
                      >
                        {copiedId === invitation.id ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                      </button>
                      <button
                        onClick={() => handleDeleteInvitation(invitation.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove invitation"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* View Calendar Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-xl shadow-md border-2 border-christmas-gold text-center"
          >
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Ready to Reveal?</h2>
            <p className="text-gray-600 mb-4">
              Starting December 16th, you can reveal one box each day!
            </p>
            <Link 
              href="/calendar"
              className="inline-block bg-christmas-gold text-yellow-900 px-8 py-3 rounded-lg font-bold hover:bg-yellow-400 transition-colors shadow-md"
            >
              🎁 View My Calendar
            </Link>
          </motion.div>
        </>
      ) : (
        /* Generate Calendar Section */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="bg-white p-10 rounded-2xl shadow-xl border-4 border-christmas-red max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome to Your Advent Calendar!</h2>
            <p className="text-gray-600 mb-8">
              Generate your calendar to start inviting friends. They'll vote on what represents you best!
            </p>
            <button
              onClick={handleGenerateCalendar}
              disabled={loading}
              className="bg-christmas-red text-white px-10 py-4 rounded-full font-bold text-xl hover:bg-red-700 disabled:opacity-50 shadow-lg transform hover:scale-105 transition-all"
            >
              {loading ? '⏳ Generating...' : '🎄 Generate My Calendar'}
            </button>
          </div>
        </motion.div>
      )}
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mt-4 border border-red-200">
          Error: {error}
        </div>
      )}
    </div>
  );
}
