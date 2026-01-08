'use client';

import { useState, useEffect } from 'react';
import { Gift, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isDateUnlocked, getDayUnlockDate } from '@/lib/date-utils';

interface Category {
  id: number;
  name: string;
  emoji: string;
}

interface Vote {
  answer: string;
  voteCount: number;
  voters: string[];
}

interface GiftBoxProps {
  category: Category;
  day: number;
  votes?: Vote[];
  isRevealed: boolean;
  onReveal: () => void;
}

export function GiftBox({ category, day, votes = [], isRevealed, onReveal }: GiftBoxProps) {
  const [isFlipping, setIsFlipping] = useState(false);
  const [showBack, setShowBack] = useState(isRevealed);
  const canUnlock = isDateUnlocked(day);
  const unlockDate = getDayUnlockDate(day);

  // Sync showBack with isRevealed prop
  useEffect(() => {
    setShowBack(isRevealed);
  }, [isRevealed]);

  const handleClick = () => {
    if (!canUnlock || isFlipping) return;
    
    // If already revealed, just trigger onReveal to show modal
    if (isRevealed) {
      onReveal();
      return;
    }
    
    setIsFlipping(true);
    
    // Start flip animation, switch to back face halfway through
    setTimeout(() => {
      setShowBack(true);
      onReveal();
    }, 150);
    
    setTimeout(() => {
      setIsFlipping(false);
    }, 300);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Locked state
  if (!canUnlock) {
    return (
      <div className="relative group">
        <div className="aspect-square rounded-lg bg-gift-red border-2 border-primary/30 flex flex-col items-center justify-center p-4 cursor-not-allowed opacity-80">
          {/* Ribbon decoration */}
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-primary/40" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-4 bg-primary/40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-primary/60 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          
          {/* Category label */}
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-xs font-medium text-white/80">
              {category.emoji} {category.name}
            </span>
          </div>
        </div>
        
        {/* Hover tooltip */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card px-3 py-1 rounded text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-border">
          Opens {formatDate(unlockDate)}
        </div>
      </div>
    );
  }

  // Flip card container
  return (
    <div className="relative group" style={{ perspective: '1000px' }}>
      <div 
        className={cn(
          "relative w-full aspect-square transition-transform duration-500 cursor-pointer",
          "hover:scale-105"
        )}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: showBack ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
        onClick={handleClick}
      >
        {/* Front face - Gift box */}
        <div 
          className={cn(
            "absolute inset-0 rounded-lg bg-gift-red border-2 border-primary flex flex-col items-center justify-center p-4",
            "shadow-lg shadow-primary/20"
          )}
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          {/* Ribbon decoration */}
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-full bg-primary/60" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-4 bg-primary/60" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary flex items-center justify-center animate-glow-pulse">
              <Gift className="w-6 h-6 text-primary-foreground" />
            </div>
          </div>
          
          {/* Category label */}
          <div className="absolute bottom-2 left-0 right-0 text-center">
            <span className="text-xs font-medium text-white">
              {category.emoji} {category.name}
            </span>
          </div>
        </div>

        {/* Back face - Revealed content */}
        <div 
          className="absolute inset-0 rounded-lg bg-revealed border-2 border-primary/50 p-3 overflow-hidden"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <div className="h-full flex flex-col items-center justify-center text-center">
            {/* Header */}
            <span className="text-2xl mb-1">{category.emoji}</span>
            <h3 className="text-xs font-semibold text-primary mb-2">{category.name}</h3>
            
            {/* Top Answer Only */}
            {votes.length > 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <p className="text-foreground text-lg md:text-xl font-bold capitalize leading-tight px-2">
                  {votes[0].answer}
                </p>
                <p className="text-primary/70 text-[10px] mt-2">
                  Tap for details
                </p>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-xs">No votes yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Hover tooltip */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-card px-3 py-1 rounded text-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-border">
        {showBack ? 'Tap for details 👀' : 'Click to open! ✨'}
      </div>
    </div>
  );
}

export default GiftBox;

