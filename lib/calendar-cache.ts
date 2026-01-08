// =============================================
// Calendar Data Cache (Module-level)
// =============================================
// Uses module-level variables to persist data across
// client-side navigation. Clears on page refresh.

interface Vote {
  id?: string;
  answer: string;
  voteCount: number;
  voters: string[];
}

interface CategoryData {
  category: {
    name: string;
    description: string;
    code: string;
  };
  type: 'answers' | 'notes';
  answers: Vote[];
  winner?: Vote;
  totalVotes: number;
}

interface FriendStats {
  total: number;
  voted: number;
}

interface CalendarCacheData {
  reveals: number[];
  categoryDataMap: Record<number, CategoryData>;
  friendStats: FriendStats;
  userId: string;
}

// Module-level cache - persists across navigation, clears on refresh
let cache: CalendarCacheData | null = null;

export function getCalendarCache(userId: string): CalendarCacheData | null {
  // Ensure cache belongs to current user
  if (cache && cache.userId !== userId) {
    cache = null;
    return null;
  }
  return cache;
}

export function setCalendarCache(
  userId: string,
  reveals: number[],
  categoryDataMap: Record<number, CategoryData>,
  friendStats: FriendStats
): void {
  cache = {
    reveals,
    categoryDataMap,
    friendStats,
    userId,
  };
}

export function updateCacheReveals(userId: string, reveals: number[]): void {
  if (cache && cache.userId === userId) {
    cache.reveals = reveals;
  }
}

export function clearCalendarCache(): void {
  cache = null;
}

export type { Vote, CategoryData, FriendStats, CalendarCacheData };
