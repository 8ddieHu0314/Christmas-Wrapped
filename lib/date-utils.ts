// Advent calendar runs 9 days before Christmas (Dec 16-24)
// Each day unlocks one category

export function getUnlockDates(year?: number): Record<number, string> {
  const targetYear = year || new Date().getFullYear();
  
  return {
    1: `${targetYear}-12-16`,
    2: `${targetYear}-12-17`,
    3: `${targetYear}-12-18`,
    4: `${targetYear}-12-19`,
    5: `${targetYear}-12-20`,
    6: `${targetYear}-12-21`,
    7: `${targetYear}-12-22`,
    8: `${targetYear}-12-23`,
    9: `${targetYear}-12-24`,
  };
}

export const UNLOCK_DATES = getUnlockDates();

export function isDateUnlocked(day: number, testMode: boolean = false): boolean {
  if (testMode) return true;
  
  const unlockDates = getUnlockDates();
  const unlockDateStr = unlockDates[day as keyof typeof unlockDates];
  if (!unlockDateStr) return false;

  const unlockDate = new Date(unlockDateStr + 'T00:00:00');
  const now = new Date();
  
  return now >= unlockDate;
}

export function getDaysUntilChristmas(): number {
  const now = new Date();
  let christmas = new Date(now.getFullYear(), 11, 25); // Month is 0-indexed
  
  // If Christmas has passed this year, calculate for next year
  if (now.getMonth() === 11 && now.getDate() > 25) {
    christmas = new Date(now.getFullYear() + 1, 11, 25);
  }
  
  const diffTime = christmas.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

export function getVotingDeadline(year?: number): Date {
  const targetYear = year || new Date().getFullYear();
  // Voting ends on Dec 15 at 23:59:59
  return new Date(`${targetYear}-12-15T23:59:59`);
}

export function isVotingOpen(): boolean {
  const now = new Date();
  const deadline = getVotingDeadline();
  return now < deadline;
}

export function getDayUnlockDate(day: number): Date | null {
  const unlockDates = getUnlockDates();
  const dateStr = unlockDates[day as keyof typeof unlockDates];
  if (!dateStr) return null;
  return new Date(dateStr + 'T00:00:00');
}

export function getNextUnlockDay(): number | null {
  const now = new Date();
  
  for (let day = 1; day <= 9; day++) {
    const unlockDate = getDayUnlockDate(day);
    if (unlockDate && now < unlockDate) {
      return day;
    }
  }
  
  return null; // All days unlocked
}

export function formatCountdown(targetDate: Date): string {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Now!';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}
