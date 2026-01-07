'use client';

interface InfoItem {
  emoji: string;
  text: string;
}

const defaultInfoItems: InfoItem[] = [
  { emoji: '🎄', text: 'Create your advent calendar' },
  { emoji: '📧', text: 'Invite your friends to vote' },
  { emoji: '🎁', text: 'Discover a new gift each day!' },
];

interface AuthInfoSectionProps {
  items?: InfoItem[];
}

export function AuthInfoSection({ items = defaultInfoItems }: AuthInfoSectionProps) {
  return (
    <div className="mt-8 text-center text-sm text-muted-foreground space-y-2">
      {items.map((item, index) => (
        <p key={index}>
          {item.emoji} {item.text}
        </p>
      ))}
    </div>
  );
}

