'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface Person {
  id: string;
  name: string;
}

interface Question {
  id: string;
  emoji: string;
  text: string;
  people: Person[];
}



export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
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

  const fetchQuestion = async () => {
    if (!user) return;
    setIsLoading(true);
    setSelectedOption(null);
    const { data, error } = await supabase.rpc('get_question_with_random_people', { uid: user.id });
    if (data && data.length > 0) {
      setQuestion(data[0] as Question);
      setOptions(data.map((row: any) => row.person_name));
    }
    if (error) setError(error.message);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchQuestion();
  }, [user?.id]);

  const handleVote = async (person: Person) => {
    if (!question || !person || selectedOption) return;
    setSelectedOption(person.id);
    setIsLoading(true);
    try {
      await supabase.rpc('submit_vote', {
        person_id: person.id,
        question_id: question.id,
      });
      await fetchQuestion();
    } catch (e) {
      setError('Failed to submit vote.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const personButton = (person: Person, index: number) => {
    return (
      <button
        key={person.id}
        className={`flex-1 h-16 bg-white rounded-xl text-lg font-bold shadow-md active:scale-95 transition-transform text-gray-900 cursor-pointer ${selectedOption ? 'opacity-60' : ''}`}
        onClick={() => handleVote(person)}
        disabled={!!selectedOption || isLoading}
      >
        {person.name}
      </button>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-xs aspect-[9/16] bg-[#a020f0] rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-0 relative">
        {/* Emoji */}
        <div className="flex flex-col items-center justify-center flex-1 w-full mt-10">
          <span className="text-7xl mb-8">{question?.emoji}</span>
          <div className="text-white text-2xl font-extrabold tracking-wide text-center mx-10 mb-12" style={{letterSpacing: '0.05em'}}>
            {question?.text}
          </div>
        </div>
        {/* Options */}
        <div className="w-full px-6 pb-10 flex flex-col gap-4">
          <div className="flex gap-4 mb-4">
            {question?.people.slice(0, 2).map((person: Person, index: number) => personButton(person, index))}
          </div>
          <div className="flex gap-4">
            {question?.people.slice(2).map((person: Person, index: number) => personButton(person, index))}
          </div>
        </div>
      </div>
    </div>
  );
}
