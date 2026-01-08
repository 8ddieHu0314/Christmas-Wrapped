'use client';

import { FLOATING_DECORATIONS } from '@/lib/constants';

export function FloatingDecorations() {
  return (
    <>
      {FLOATING_DECORATIONS.map((item, index) => (
        <div
          key={index}
          className="absolute text-3xl md:text-4xl animate-float select-none"
          style={{ ...item.style, animationDelay: item.delay }}
        >
          {item.emoji}
        </div>
      ))}
    </>
  );
}

