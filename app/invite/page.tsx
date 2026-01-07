'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Copy, Check, Trash2, UserCheck, Clock, Send, Gift, ArrowLeft } from 'lucide-react';
import { Sparkles } from '@/components/Sparkles';

interface Invitation {
  id: string;
  email: string;
  status: string;
  invite_token: string;
  created_at: string;
  hasVoted: boolean;
  calendar_code: string;
}

export default function InvitePage() {
  const [user, setUser] = useState<any>(null);
  const [calendarCode, setCalendarCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [newEmails, setNewEmails] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatingCalendar, setGeneratingCalendar] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/auth');
        return;
      }

      // Fetch user data including calendar_code
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (userData) {
        setUser(userData);
        setCalendarCode(userData.calendar_code);

        if (userData.calendar_code) {
          await fetchInvitations();
        }
      }
      
      setLoading(false);
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
    setGeneratingCalendar(true);
    try {
      const response = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (data.success && data.calendar_code) {
        setCalendarCode(data.calendar_code);
      }
    } catch (err) {
      console.error('Generate calendar error:', err);
    } finally {
      setGeneratingCalendar(false);
    }
  }

  async function handleInviteFriends() {
    if (!newEmails.trim()) return;

    setInviteLoading(true);
    try {
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
    } catch (err: any) {
      console.error('Invite error:', err);
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleDeleteInvitation(invitationId: string) {
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
        <span className="flex items-center gap-1 text-green-300 bg-green-900/50 px-2 py-1 rounded-full text-xs font-medium">
          <Check size={12} /> Voted
        </span>
      );
    }
    if (invitation.status === 'accepted') {
      return (
        <span className="flex items-center gap-1 text-blue-300 bg-blue-900/50 px-2 py-1 rounded-full text-xs font-medium">
          <UserCheck size={12} /> Joined
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-amber-300 bg-amber-900/50 px-2 py-1 rounded-full text-xs font-medium">
        <Clock size={12} /> Pending
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center sparkle-bg">
        <div className="text-2xl animate-pulse text-primary">Loading... 🎁</div>
      </div>
    );
  }

  const voteCount = invitations.filter(i => i.hasVoted).length;

  return (
    <div className="min-h-screen flex flex-col relative sparkle-bg">
      <Sparkles />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-3xl">
        {/* Back to Calendar */}
        <Link 
          href="/calendar"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Calendar
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Invite Friends ✉️
          </h1>
          <p className="text-muted-foreground">
            Invite your friends to vote on what represents you best!
          </p>
        </div>

        {!calendarCode ? (
          /* Generate Calendar First */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="bg-card/80 backdrop-blur-sm p-10 rounded-2xl border-2 border-primary/30 max-w-md mx-auto">
              <Gift className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4 text-foreground">Generate Your Calendar First</h2>
              <p className="text-muted-foreground mb-8">
                Before inviting friends, you need to create your gift calendar.
              </p>
              <button
                onClick={handleGenerateCalendar}
                disabled={generatingCalendar}
                className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg hover:bg-primary/90 disabled:opacity-50 shadow-lg transform hover:scale-105 transition-all"
              >
                {generatingCalendar ? '⏳ Generating...' : '🎄 Generate My Calendar'}
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Calendar Code */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card/80 backdrop-blur-sm p-4 rounded-xl mb-6 border border-primary/30 text-center"
            >
              <p className="text-sm text-muted-foreground">Your Calendar Code</p>
              <p className="text-2xl font-mono font-bold text-primary">{calendarCode}</p>
            </motion.div>

            {/* Invite Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-primary/30 mb-6"
            >
              <h2 className="text-xl font-bold mb-4 text-foreground flex items-center gap-2">
                <Mail className="text-primary" /> Send Invitations
              </h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Enter email addresses separated by commas or new lines.
              </p>

              <div className="flex flex-col gap-3">
                <textarea
                  value={newEmails}
                  onChange={(e) => setNewEmails(e.target.value)}
                  placeholder="friend1@email.com, friend2@email.com..."
                  className="w-full p-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none text-foreground placeholder:text-muted-foreground"
                  rows={3}
                />
                <button
                  onClick={handleInviteFriends}
                  disabled={inviteLoading || !newEmails.trim()}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                className="bg-card/80 backdrop-blur-sm p-6 rounded-xl border border-primary/30"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-foreground">
                    Invited Friends ({invitations.length})
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {voteCount} of {invitations.length} voted
                  </span>
                </div>

                <div className="space-y-3">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="font-medium text-foreground truncate">{invitation.email}</span>
                        {getStatusBadge(invitation)}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyInviteLink(invitation)}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Copy invite link"
                        >
                          {copiedId === invitation.id ? (
                            <Check size={18} className="text-green-400" />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteInvitation(invitation.id)}
                          className="p-2 text-muted-foreground hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
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
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground text-sm">
        <p>🎄 Made with love for the holiday season 🎄</p>
      </footer>
    </div>
  );
}

