'use client';

import { useSearchParams } from 'next/navigation';
import { Sparkles } from '@/components/Sparkles';
import {
  FloatingDecorations,
  AuthHeader,
  AuthForm,
  AuthInfoSection,
} from '@/components/auth';

export default function Auth() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/calendar';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden sparkle-bg">
      <Sparkles />
      <FloatingDecorations />

      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
          <AuthHeader />
          <AuthForm redirectTo={redirectTo} />
          <AuthInfoSection />
        </div>
      </main>
    </div>
  );
}
