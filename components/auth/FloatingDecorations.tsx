'use client';

interface DecorationItem {
  emoji: string;
  position: string;
  delay: string;
}

const decorations: DecorationItem[] = [
  { emoji: '🎄', position: 'top-10 left-10', delay: '0s' },
  { emoji: '⭐', position: 'top-20 right-20', delay: '0.5s' },
  { emoji: '🎁', position: 'bottom-20 left-20', delay: '1s' },
  { emoji: '❄️', position: 'bottom-10 right-10', delay: '1.5s' },
];

export function FloatingDecorations() {
  return (
    <>
      {decorations.map((item, index) => (
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

