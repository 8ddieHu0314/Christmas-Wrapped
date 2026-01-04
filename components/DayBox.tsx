'use client';

import { motion } from 'framer-motion';
import { isDateUnlocked } from '@/lib/date-utils';
import { Lock, Gift, Snowflake } from 'lucide-react';

interface DayBoxProps {
  day: number;
  isRevealed: boolean;
  isLoading: boolean;
  testMode: boolean;
  onClick: (isUnlocked: boolean, isRevealed: boolean) => void;
}

export default function DayBox({ day, isRevealed, isLoading, testMode, onClick }: DayBoxProps) {
  const isUnlocked = isDateUnlocked(day, testMode);

  return (
    <motion.div
      whileHover={isUnlocked ? { "scale": 1.05, "rotate": [0, -2, 2, 0] } : {}}
      whileTap={isUnlocked ? { "scale": 0.95 } : {}}
      onClick={() => onClick(isUnlocked, isRevealed)}
      className={`
        relative rounded-xl shadow-lg flex flex-col items-center justify-center cursor-pointer transition-colors border-4
        ${isRevealed 
          ? 'bg-white border-christmas-gold text-christmas-gold' 
          : isUnlocked 
            ? 'bg-christmas-red border-christmas-green text-white' 
            : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'}
      `}
      style={{ "aspectRatio": '1/1' }}
    >
      <span className="absolute top-2 left-3 font-christmas font-bold text-xl md:text-2xl">
        {day}
      </span>
      
      <div className="flex items-center justify-center">
        {isLoading ? (
          <motion.div animate={{ "rotate": 360 }} transition={{ "repeat": Infinity, "duration": 1, "ease": "linear" }}>
            <Snowflake size={48} />
          </motion.div>
        ) : isRevealed ? (
          <span className="text-4xl md:text-6xl">🎉</span>
        ) : isUnlocked ? (
          <Gift size={48} className="animate-bounce" />
        ) : (
          <Lock size={48} />
        )}
      </div>
      
      {isUnlocked && !isRevealed && (
        <span className="absolute bottom-2 text-xs md:text-sm font-bold opacity-80">
          Open Me!
        </span>
      )}
      
      {!isUnlocked && (
        <span className="absolute bottom-2 text-xs md:text-sm font-bold">
          Locked
        </span>
      )}
    </motion.div>
  );
}