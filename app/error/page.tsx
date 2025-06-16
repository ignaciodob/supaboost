'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Error() {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Email Verification Error</h1>
        <p className="mb-6">
          Hey there! It seems your email doesn't match the one in our records. Please make sure that you're not using an alias for your @supabase.io email.
          <br />
          If you need help, please contact Ignacio on Slack :)
        </p>
        <button
          onClick={handleSignOut}
          className="px-4 py-2 bg-[#a020f0] text-white rounded-lg hover:bg-[#a020f0]/90 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
} 