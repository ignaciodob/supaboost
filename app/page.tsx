'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push('/login');
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-xs aspect-[9/16] bg-[#a020f0] rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-0 relative">
        {/* Emoji */}
        <div className="flex flex-col items-center justify-center flex-1 w-full">
          <span className="text-7xl mb-4">😃</span>
          <div className="text-white text-2xl font-extrabold tracking-wide text-center mb-10" style={{letterSpacing: '0.05em'}}>
            BEST SMILE
          </div>
        </div>
        {/* Options */}
        <div className="w-full px-6 pb-10 flex flex-col gap-4">
          <div className="flex gap-4 mb-4">
            <button className="flex-1 h-16 bg-white rounded-xl text-lg font-bold shadow-md active:scale-95 transition-transform text-gray-900">Option 1</button>
            <button className="flex-1 h-16 bg-white rounded-xl text-lg font-bold shadow-md active:scale-95 transition-transform text-gray-900">Option 2</button>
          </div>
          <div className="flex gap-4">
            <button className="flex-1 h-16 bg-white rounded-xl text-lg font-bold shadow-md active:scale-95 transition-transform text-gray-900">Option 3</button>
            <button className="flex-1 h-16 bg-white rounded-xl text-lg font-bold shadow-md active:scale-95 transition-transform text-gray-900">Option 4</button>
          </div>
        </div>
      </div>
    </div>
  );
}
