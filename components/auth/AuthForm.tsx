'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase';

interface AuthFormProps {
  redirectTo?: string;
}

export function AuthForm({ redirectTo = '/calendar' }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
            },
          },
        });
        if (error) throw error;
        
        // Check if email confirmation is required
        // If session is null but user exists, email confirmation is pending
        if (data.user && !data.session) {
          setSuccessMessage(
            '✨ Account created! Please check your email to confirm your account, then sign in.'
          );
          setIsLogin(true); // Switch to login mode
          setPassword(''); // Clear password for security
        } else {
          // No email confirmation required, redirect directly
          router.push(redirectTo);
          router.refresh();
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMessage(null);
  };

  return (
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

        {successMessage && (
          <div className="text-green-400 text-sm bg-green-950/50 p-3 rounded-md border border-green-800">
            {successMessage}
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
          onClick={toggleMode}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}

