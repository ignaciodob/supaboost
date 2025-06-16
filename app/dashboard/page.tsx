'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { RealtimeChannel } from '@supabase/supabase-js';

interface Stats {
  boostedUsers: number;
  totalBoosts: number;
  averageBoosts: number;
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

      // Get average boosts per person
      const { data: averageBoosts, error: averageBoostsError } = await supabase
        .rpc('get_average_boosts');

      // Get leaderboard
      const { data: leaderboard, error: leaderboardError } = await supabase
        .rpc('get_leaderboard');

      // Get top boosters
      const { data: topBoosters, error: topBoostersError } = await supabase
        .rpc('get_top_boosters');

      if (boostedUsersError || totalBoostsError || leaderboardError || averageBoostsError || topBoostersError) {
        throw new Error('Failed to fetch stats');
      }

      setStats({
        boostedUsers: boostedUsers || 0,
        totalBoosts: totalBoosts || 0,
        averageBoosts: averageBoosts || 0,
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
    fetchStats();

    // Subscribe to realtime changes on the votes table
    const channel = supabase
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
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Dashboard</h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-[#a020f0] bg-white rounded-lg hover:bg-white/90 transition-colors"
          >
            Back to boosting
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#a020f0] rounded-2xl p-6 shadow-xl">
            <h3 className="text-white/70 text-lg mb-2">Boosted Supatroopers</h3>
            <p className="text-4xl font-bold text-white">{stats?.boostedUsers || 0}</p>
          </div>
          <div className="bg-[#a020f0] rounded-2xl p-6 shadow-xl">
            <h3 className="text-white/70 text-lg mb-2">Total Boosts Given</h3>
            <p className="text-4xl font-bold text-white">{stats?.totalBoosts || 0}</p>
          </div>
          <div className="bg-[#a020f0] rounded-2xl p-6 shadow-xl">
            <h3 className="text-white/70 text-lg mb-2">Average Boosts per User</h3>
            <p className="text-4xl font-bold text-white">{stats?.averageBoosts || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Leaderboard */}
          <div className="bg-[#a020f0] rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Top 10 Most Boosted</h2>
            <div className="space-y-4">
              {stats?.leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/10 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-white/70 text-lg w-8">{index + 1}</span>
                    <span className="text-white font-medium">Anonymous User</span>
                  </div>
                  <span className="text-white font-bold">{entry.total_votes} boosts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Boosters */}
          <div className="bg-[#a020f0] rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">Top 10 Boosters</h2>
            <div className="space-y-4">
              {stats?.topBoosters.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-white/10 rounded-lg p-4"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-white/70 text-lg w-8">{index + 1}</span>
                    <span className="text-white font-medium">Anonymous Booster</span>
                  </div>
                  <span className="text-white font-bold">{entry.total_given} boosts given</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 