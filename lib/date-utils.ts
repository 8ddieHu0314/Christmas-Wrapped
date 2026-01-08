// Advent calendar runs 9 days before Christmas (Dec 16-24)
// Each day unlocks one category

import { TEST_MODE } from './constants';

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

export function isDateUnlocked(day: number): boolean {
  if (TEST_MODE) return true;
  
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

