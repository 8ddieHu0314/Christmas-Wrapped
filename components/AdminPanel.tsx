'use client';

import { createClient } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function AdminPanel() {
  const supabase = createClient();
  const router = useRouter();

  const resetReveals = async () => {
    if (!confirm('Are you sure? This will lock all days again.')) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('reveals').delete().eq('user_id', user.id);
      window.location.reload();
    }
  };

  return (
    <div className="bg-gray-800 text-white p-4 rounded-xl mt-8">
      <h3 className="font-bold mb-2 text-yellow-400">🚧 Dev / Test Panel</h3>
      <p className="text-xs text-gray-400 mb-4">Visible because ?testMode=true</p>
      
      <div className="space-y-2">
        <button 
          onClick={resetReveals}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded"
        >
          Reset My Reveals
        </button>
      </div>
    </div>
  );
}