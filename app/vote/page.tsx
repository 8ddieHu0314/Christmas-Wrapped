'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Gift, Check, Clock, ChevronRight } from 'lucide-react';
import { Sparkles } from '@/components/Sparkles';
import {
  getVoteListCache,
  setVoteListCache,
  type VoteListInvitation,
} from '@/lib/vote-cache';

export default function VoteListPage() {
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<VoteListInvitation[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadInvitations() {
      // Check if user is authenticated
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/auth?redirect=/vote');
        return;
      }
      
      setCurrentUser(authUser);

      // Check cache first
      const cached = getVoteListCache(authUser.id);
      if (cached) {
        setInvitations(cached.invitations);
        setLoading(false);
        return;
      }

      // No cache - fetch from database
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', authUser.id)
        .single();

      if (!userData?.email) {
        setLoading(false);
        return;
      }

      // Fetch all invitations sent to this user's email
      const { data: invites, error } = await supabase
        .from('invitations')
        .select(`
          id,
          status,
          created_at,
          sender_id
        `)
        .eq('email', userData.email)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching invitations:', error);
        setLoading(false);
        return;
      }

      // Fetch sender details for each invitation
      let fetchedInvitations: VoteListInvitation[] = [];
      if (invites && invites.length > 0) {
        const senderIds = Array.from(new Set(invites.map(i => i.sender_id)));
        
        const { data: senders } = await supabase
          .from('users')
          .select('id, name, email, calendar_code')
          .in('id', senderIds);

        const senderMap = new Map(senders?.map(s => [s.id, s]) || []);

        fetchedInvitations = invites
          .map(inv => ({
            ...inv,
            sender: senderMap.get(inv.sender_id)
          }))
          .filter(inv => inv.sender && inv.sender.calendar_code) as VoteListInvitation[];

        setInvitations(fetchedInvitations);
      }

      // Store in cache
      setVoteListCache(authUser.id, fetchedInvitations);
      setLoading(false);
    }

    loadInvitations();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'voted') {
      return (
        <span className="flex items-center gap-1 text-green-400 bg-green-900/30 px-2 py-1 rounded-full text-xs font-medium">
          <Check size={12} /> Voted
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-amber-400 bg-amber-900/30 px-2 py-1 rounded-full text-xs font-medium">
        <Clock size={12} /> Pending
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center sparkle-bg">
        <div className="text-2xl animate-pulse text-primary">Loading invitations... 🎁</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative sparkle-bg">
      <Sparkles />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
            Vote on Calendars 🗳️
          </h1>
          <p className="text-muted-foreground">
            Your friends have invited you to vote on their gift calendars!
          </p>
        </div>

        {invitations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/80 backdrop-blur-sm p-8 rounded-xl border border-primary/30 text-center"
          >
            <Gift className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-foreground mb-2">No Invitations Yet</h2>
            <p className="text-muted-foreground">
              When friends invite you to vote on their calendars, they'll appear here.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation, index) => (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {invitation.status === 'voted' ? (
                  // Already voted - show as disabled card
                  <div className="bg-card/50 backdrop-blur-sm p-5 rounded-xl border border-border opacity-70">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-900/30 flex items-center justify-center">
                          <Check className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">
                            {invitation.sender.name || invitation.sender.email}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            You've already voted on this calendar
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(invitation.status)}
                    </div>
                  </div>
                ) : (
                  // Pending - clickable card
                  <Link href={`/vote/${invitation.sender.calendar_code}`}>
                    <div className="bg-card/80 backdrop-blur-sm p-5 rounded-xl border border-primary/30 hover:border-primary/60 hover:bg-card transition-all cursor-pointer group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                            <Gift className="w-6 h-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">
                              {invitation.sender.name || invitation.sender.email}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Invited you to vote on their calendar
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(invitation.status)}
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>💡 Click on a pending invitation to vote</p>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-muted-foreground text-sm">
        <p>🎄 Made with love for the holiday season 🎄</p>
      </footer>
    </div>
  );
}
