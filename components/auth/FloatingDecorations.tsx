'use client';

import { FLOATING_DECORATIONS } from '@/lib/constants';

export function FloatingDecorations() {
  return (
    <>
      {FLOATING_DECORATIONS.map((item, index) => (
        <div
          key={index}
          className={`absolute ${item.position} text-3xl md:text-4xl animate-float select-none`}
          style={{ animationDelay: item.delay }}
        >
          {item.emoji}
        </div>
      ))}
    </>
  );
}

