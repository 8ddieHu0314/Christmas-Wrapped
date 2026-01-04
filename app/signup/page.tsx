'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Sign up the user
      const { "data": signUpData, "error": signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          // IMPORTANT: We disable email redirect to prevent the confirmation flow on client side
          // But Supabase settings MUST have "Confirm email" disabled for this to work seamlessly
        },
      });

      if (signUpError) throw signUpError;

      // 2. Auto-login immediately
      if (signUpData.user) {
        const { "error": signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // 3. Create user record in public table if trigger didn't catch it (optional safety)
        // The trigger in schema.sql should handle this, but we redirect now.
        
        router.push('/dashboard');
        router.refresh();
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <motion.div 
        initial={{ "opacity": 0, "y": 20 }}
        animate={{ "opacity": 1, "y": 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-4 border-christmas-green"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-christmas font-bold text-christmas-green mb-2">Join the Fun</h1>
          <p className="text-gray-600">Create your Advent Calendar</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-christmas-green focus:outline-none focus:ring-1 focus:ring-christmas-green"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-christmas-green focus:outline-none focus:ring-1 focus:ring-christmas-green"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-christmas-green focus:outline-none focus:ring-1 focus:ring-christmas-green"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-christmas-red text-white py-2 px-4 rounded-md hover:bg-red-800 transition-colors font-bold disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Sign Up & Start'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link href="/" className="text-christmas-green hover:underline font-bold">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}