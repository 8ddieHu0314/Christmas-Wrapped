// =============================================
// Vote Pages Data Cache (Module-level)
// =============================================
// Uses module-level variables to persist data across
// client-side navigation. Clears on page refresh.

// =============================================
// Vote List Page Cache (/vote)
// =============================================

interface VoteListInvitation {
  id: string;
  status: string;
  created_at: string;
  sender: {
    id: string;
    name: string;
    email: string;
    calendar_code: string;
  };
}

interface VoteListCacheData {
  invitations: VoteListInvitation[];
  userId: string;
}

let voteListCache: VoteListCacheData | null = null;

export function getVoteListCache(userId: string): VoteListCacheData | null {
  if (voteListCache && voteListCache.userId !== userId) {
    voteListCache = null;
    return null;
  }
  return voteListCache;
}

export function setVoteListCache(userId: string, invitations: VoteListInvitation[]): void {
  voteListCache = { invitations, userId };
}

export function updateVoteListInvitationStatus(userId: string, calendarCode: string, status: string): void {
  if (voteListCache && voteListCache.userId === userId) {
    voteListCache.invitations = voteListCache.invitations.map(inv => 
      inv.sender.calendar_code === calendarCode ? { ...inv, status } : inv
    );
  }
}

// =============================================
// Individual Vote Page Cache (/vote/[code])
// =============================================

interface VotePageCategory {
  id: number;
  name: string;
  code: string;
  description: string;
  prompt: string;
  display_order: number;
}

interface CalendarOwner {
  id: string;
  name: string;
  email: string;
  calendar_code: string;
}

interface VotePageCacheData {
  calendarOwner: CalendarOwner;
  categories: VotePageCategory[];
  hasAlreadyVoted: boolean;
  hasInvitation: boolean;
  error: string | null;
}

interface VotePageCacheMap {
  userId: string;
  pages: Record<string, VotePageCacheData>; // keyed by calendar code
}

let votePageCache: VotePageCacheMap | null = null;

export function getVotePageCache(userId: string, calendarCode: string): VotePageCacheData | null {
  if (votePageCache && votePageCache.userId !== userId) {
    votePageCache = null;
    return null;
  }
  return votePageCache?.pages[calendarCode] || null;
}

export function setVotePageCache(
  userId: string,
  calendarCode: string,
  data: VotePageCacheData
): void {
  if (!votePageCache || votePageCache.userId !== userId) {
    votePageCache = { userId, pages: {} };
  }
  votePageCache.pages[calendarCode] = data;
}

export function markVotePageAsVoted(userId: string, calendarCode: string): void {
  if (votePageCache && votePageCache.userId === userId && votePageCache.pages[calendarCode]) {
    votePageCache.pages[calendarCode].hasAlreadyVoted = true;
  }
  // Also update the vote list cache
  updateVoteListInvitationStatus(userId, calendarCode, 'voted');
}

export type { VoteListInvitation, VotePageCategory, CalendarOwner, VotePageCacheData };

