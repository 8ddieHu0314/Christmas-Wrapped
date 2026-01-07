'use client';

import { useEffect, useState } from 'react';
import { getDaysUntilChristmas } from '@/lib/date-utils';

export function CountdownTimer() {
  const [daysLeft, setDaysLeft] = useState(getDaysUntilChristmas());

  useEffect(() => {
    const timer = setInterval(() => {
      setDaysLeft(getDaysUntilChristmas());
    }, 1000 * 60 * 60); // Update every hour

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center gap-3 bg-secondary/50 px-6 py-4 rounded-2xl border border-primary/30">
        <span className="text-3xl">🎄</span>
        <div>
          <div className="text-4xl font-bold text-primary text-shadow-glow">
            {daysLeft}
          </div>
          <div className="text-sm text-muted-foreground">
            {daysLeft === 1 ? 'day' : 'days'} until Christmas
          </div>
        </div>
        <span className="text-3xl">🎄</span>
      </div>
    </div>
  );
}

export default CountdownTimer;

