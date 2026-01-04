'use client';

import { getDaysUntilChristmas } from '@/lib/date-utils';

export default function ProgressSidebar({ revealedCount, totalDays }: { revealedCount: number, totalDays: number }) {
  const daysUntilXmas = getDaysUntilChristmas();
  const progress = Math.round((revealedCount / totalDays) * 100);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
      <h3 className="text-xl font-bold mb-4 text-gray-800">Calendar Stats</h3>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span className="font-bold">{revealedCount}/{totalDays}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-christmas-green h-2.5 rounded-full transition-all duration-500"
            style={{ "width": `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-red-50 p-4 rounded-lg text-center mb-4">
        <p className="text-sm text-gray-600 uppercase tracking-wide">Days until Christmas</p>
        <p className="text-4xl font-bold text-christmas-red">{daysUntilXmas}</p>
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Keep checking back every day!</p>
      </div>
    </div>
  );
}