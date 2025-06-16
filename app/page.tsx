'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import ConfettiExplosion from 'react-confetti-explosion';

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

interface Vote {
 question_text: string,
 emoji: string,
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [options, setOptions] = useState<Person[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [hasShownConfetti, setHasShownConfetti] = useState<boolean>(false);
  const router = useRouter();


  const linkUserToPerson = async () => {
    const { data, error } = await supabase.rpc('link_current_user_to_person');
    if (error) {
      console.error('Error linking user to person:', error);
    }
    return data;
  }
  
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
      if (session?.user) {
        linkUserToPerson();
      }
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
      setOptions(data[0].people.map((row: any) => row as Person));
    }
    if (error) setError(error.message);
    setIsLoading(false);
  };

  const shufflePeople = async () => {
    if (!user) return;
    setIsLoading(true);
    const { data, error } = await supabase.rpc('get_random_people', { uid: user.id });
    if (error) setError(error.message);
    setOptions(data.map((row: any) => row as Person));
    setIsLoading(false);
  }

  const skipQuestion = async () => {
    if (!user) return;
    fetchQuestion();
  }

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

  const getVotes = async () => {
    const { data, error } = await supabase.rpc('get_votes_received');
    if (data) {
      setVotes(data);
    } else {
      setVotes([]);
    }
  }

  useEffect(() => {
    if (!user) return;
    getVotes();
    // Set up polling
    const interval = setInterval(() => {
      getVotes();
    }, 5000);
    // Clean up on unmount or user change
    return () => clearInterval(interval);
  }, [user?.id]);

  if (!user) {
    return null;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }



  const personButton = (person: Person) => {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      {/* Banner */}
      {votes.length > 0 && (
        <button 
          onClick={() => setIsModalOpen(true)}
          className="mb-6"
        >
          <div className="flex items-center gap-2 bg-white/90 text-[#a020f0] font-bold text-lg px-6 py-2 rounded-full shadow-lg border border-[#a020f0] cursor-pointer transition-all hover:bg-[#a020f0]/90 hover:text-white hover:border-white hover:scale-105">
            <span className="text-xl">🎉</span>
            <span>You've been boosted {votes.length} times!</span>
          </div>
        </button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#a020f0] rounded-2xl w-full max-w-md mx-4 overflow-hidden relative">
            {!hasShownConfetti && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 z-[100]">
                <ConfettiExplosion
                  onComplete={() => setHasShownConfetti(true)}
                  duration={3000}
                  particleCount={300}
                  colors={['#ffffff', '#a020f0', '#ffd700']}
                />
              </div>
            )}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">You've been boosted {votes.length} times!</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white/80 hover:text-white"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {votes.map((vote, index) => (
                <div key={index} className="p-4 border-b border-white/20 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{vote.emoji}</span>
                      <div>
                        <p className="font-medium text-white">{vote.question_text}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-6 right-6 z-30">
        <button
          onClick={async () => {
            if (window.confirm('Are you sure you want to log out?')) {
              await handleSignOut();
            }
          }}
          className="px-2 py-1 text-sm text-[#a020f0] bg-transparent hover:underline hover:text-white transition-all font-medium"
          aria-label="Log out"
        >
          Sign out
        </button>
      </div>
      <div className="relative w-full max-w-xs aspect-[9/16] bg-[#a020f0] rounded-[2.5rem] shadow-2xl flex flex-col items-center justify-center p-0">
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
            {options?.slice(0, 2).map((person: Person) => personButton(person))}
          </div>  
          <div className="flex gap-4">
            {options?.slice(2).map((person: Person) => personButton(person))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-8 mt-6">
        <button className="text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer" onClick={shufflePeople}>
          Shuffle
        </button>
        <button className="text-white/70 hover:text-white text-sm font-medium transition-colors cursor-pointer" onClick={skipQuestion}>
          Skip
        </button>
      </div>
    </div>
  );
}
