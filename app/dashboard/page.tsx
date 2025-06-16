'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { RealtimeChannel } from '@supabase/supabase-js';
import { useAuth } from '../providers';

interface Stats {
  boostedUsers: number;
  totalBoosts: number;
  boostCoverage: number;
  leaderboard: Array<{
    person_id: string;
    total_votes: number;
  }>;
  topBoosters: Array<{
    user_id: string;
    total_given: number;
  }>;
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchStats = async () => {
    try {
      // Get distinct users who received votes
      const { data: boostedUsers, error: boostedUsersError } = await supabase
        .rpc('get_distinct_boosted_users');

      // Get total number of votes
      const { data: totalBoosts, error: totalBoostsError } = await supabase
        .rpc('get_total_boosts');

      // Get boost coverage
      const { data: boostCoverage, error: boostCoverageError } = await supabase
        .rpc('get_boost_coverage');

      // Get leaderboard
      const { data: leaderboard, error: leaderboardError } = await supabase
        .rpc('get_leaderboard');

      // Get top boosters
      const { data: topBoosters, error: topBoostersError } = await supabase
        .rpc('get_top_boosters');

      if (boostedUsersError || totalBoostsError || leaderboardError || boostCoverageError || topBoostersError) {
        throw new Error('Failed to fetch stats');
      }

      setStats({
        boostedUsers: boostedUsers || 0,
        totalBoosts: totalBoosts || 0,
        boostCoverage: boostCoverage || 0,
        leaderboard: leaderboard || [],
        topBoosters: topBoosters || [],
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchStats();

    let channel: RealtimeChannel | null = null;

    const setupRealtimeSubscription = async () => {
      try {
        channel = supabase
          .channel('votes-changes')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'votes'
            },
            (payload) => {
              console.log('New vote received:', payload);
              fetchStats();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to votes changes');
            }
          });
      } catch (error) {
        console.error('Error setting up realtime subscription:', error);
      }
    };

    setupRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 text-[#a020f0] bg-white rounded-xl hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to boosting
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-br from-[#a020f0] to-[#8a1cd0] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <h3 className="text-white/80 text-lg mb-3">🚀 Boosted Supatroopers</h3>
            <p className="text-5xl font-bold text-white">{stats?.boostedUsers || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-[#a020f0] to-[#8a1cd0] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <h3 className="text-white/80 text-lg mb-3">⚡ Total Boosts Given</h3>
            <p className="text-5xl font-bold text-white">{stats?.totalBoosts || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-[#a020f0] to-[#8a1cd0] rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
            <h3 className="text-white/80 text-lg mb-3">🎯 Boost Coverage</h3>
            <p className="text-5xl font-bold text-white">💚 {stats?.boostCoverage || 0}%</p>
            <p className="text-white/60 mt-2">of teammates have been picked</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Leaderboard */}
          <div className="bg-gradient-to-br from-[#8a1cd0] to-[#6b16a0] rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-8">Top 10 Most Boosted</h2>
            <div className="space-y-4">
              {stats?.leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/10 rounded-xl p-4 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-white/70 text-lg w-8">{index + 1}</span>
                    <span className="text-white font-medium">
                      {['🚀', '⭐', '🌟', '💫', '✨', '🎯', '🎪', '🎨', '🎭', '🎪'][index]} 
                      {' '}BoostPal #{index + 1}
                    </span>
                  </div>
                  <span className="text-white font-bold bg-white/20 px-3 py-1 rounded-lg">
                    {entry.total_votes} boosts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Boosters */}
          <div className="bg-gradient-to-br from-[#8a1cd0] to-[#6b16a0] rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-8">Top 10 Boosters</h2>
            <div className="space-y-4">
              {stats?.topBoosters.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/10 rounded-xl p-4 hover:bg-white/15 transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-white/70 text-lg w-8">{index + 1}</span>
                    <span className="text-white font-medium">
                      {['🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎪', '🎯', '🎲', '🎮'][index]} 
                      {' '} Supatrooper #{index + 1}
                    </span>
                  </div>
                  <span className="text-white font-bold bg-white/20 px-3 py-1 rounded-lg">
                    {entry.total_given} boosts
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 