export const UNLOCK_DATES = {
  1: '2023-12-16',
  2: '2023-12-17',
  3: '2023-12-18',
  4: '2023-12-19',
  5: '2023-12-20',
  6: '2023-12-21',
  7: '2023-12-22',
  8: '2023-12-23',
  9: '2023-12-24',
};

export function isDateUnlocked(day: number, testMode: boolean = false): boolean {
  if (testMode) return true;
  
  const unlockDateStr = UNLOCK_DATES[day as keyof typeof UNLOCK_DATES];
  if (!unlockDateStr) return false;

  const unlockDate = new Date(unlockDateStr);
  const now = new Date();
  
  // Reset hours to compare just dates if desired, or keep precise
  // For this app, let's assume unlock happens at 00:00 local time or UTC depending on server
  // We'll use simple string comparison for YYYY-MM-DD to be safe with timezones in this simple implementation
  // or just standard date comparison
  
  return now >= unlockDate;
}

export function getDaysUntilChristmas(): number {
  const now = new Date();
  const christmas = new Date(now.getFullYear(), 11, 25); // Month is 0-indexed
  if (now.getMonth() === 11 && now.getDate() > 25) {
    christmas.setFullYear(christmas.getFullYear() + 1);
  }
  const diffTime = Math.abs(christmas.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  return diffDays;
}