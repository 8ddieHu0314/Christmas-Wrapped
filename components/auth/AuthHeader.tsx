'use client';

interface AuthHeaderProps {
  title?: string;
  subtitle?: string;
}

export function AuthHeader({
  title = 'Christmas Wrapped',
  subtitle = 'Discover what your friends think of you! ✨',
}: AuthHeaderProps) {
  return (
    <div className="text-center mb-8">
      <div className="text-6xl mb-4 animate-float">🎁</div>
      <h1 className="text-4xl font-display font-bold text-primary text-shadow-glow mb-2">
        {title}
      </h1>
      <p className="text-lg text-foreground/80">{subtitle}</p>
    </div>
  );
}

