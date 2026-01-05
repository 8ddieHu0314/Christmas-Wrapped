'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles } from '@/components/Sparkles';
import { createClient } from '@/lib/supabase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(redirectTo);
        router.refresh();
      } else {
        if (!name) {
          setError('Please enter your name');
          setIsLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
            },
          },
        });
        if (error) throw error;
        router.push(redirectTo);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden sparkle-bg">
      <Sparkles />
      
      {/* Decorative floating elements */}
      <div className="absolute top-10 left-10 text-4xl animate-float select-none" style={{ animationDelay: '0s' }}>🎄</div>
      <div className="absolute top-20 right-20 text-3xl animate-float select-none" style={{ animationDelay: '0.5s' }}>⭐</div>
      <div className="absolute bottom-20 left-20 text-3xl animate-float select-none" style={{ animationDelay: '1s' }}>🎁</div>
      <div className="absolute bottom-10 right-10 text-4xl animate-float select-none" style={{ animationDelay: '1.5s' }}>❄️</div>

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo section */}
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-float">🎁</div>
            <h1 className="text-4xl font-display font-bold text-primary text-shadow-glow mb-2">
              Friend Gifts
            </h1>
            <p className="text-lg text-foreground/80">
              Discover what your friends think of you! ✨
            </p>
          </div>

          {/* Auth card */}
          <div className="bg-card/90 backdrop-blur-sm border border-primary/30 rounded-2xl p-8 shadow-lg shadow-primary/10">
            <h2 className="text-2xl font-semibold text-center text-foreground mb-6">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="What should friends call you?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-950/50 p-3 rounded-md border border-red-800">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full font-semibold py-6 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-pulse">✨ Loading...</span>
                ) : isLogin ? (
                  '🎄 Sign In'
                ) : (
                  '🎁 Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>

          {/* Info section */}
          <div className="mt-8 text-center text-sm text-muted-foreground space-y-2">
            <p>🎄 Create your advent calendar</p>
            <p>📧 Invite your friends to vote</p>
            <p>🎁 Discover a new gift each day!</p>
          </div>
        </div>
      </main>
    </div>
  );
}

