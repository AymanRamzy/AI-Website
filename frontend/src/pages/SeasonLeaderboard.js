/**
 * SeasonLeaderboard - Season points leaderboard
 * Phase 10: Gamification
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Calendar,
  Users,
  Loader,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function SeasonLeaderboard() {
  const { user } = useAuth();
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      loadLeaderboard();
    }
  }, [selectedSeason]);

  const loadSeasons = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/seasons`, { withCredentials: true });
      const seasonList = response.data || [];
      setSeasons(seasonList);
      
      // Select current/latest season
      const activeSeason = seasonList.find(s => s.is_active);
      if (activeSeason) {
        setSelectedSeason(activeSeason.code);
      } else if (seasonList.length > 0) {
        setSelectedSeason(seasonList[0].code);
      }
    } catch (err) {
      console.error('Failed to load seasons:', err);
      // Default to current quarter
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      setSelectedSeason(`${now.getFullYear()}-S${quarter}`);
    }
    setLoading(false);
  };

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/leaderboard/season?season=${selectedSeason}`,
        { withCredentials: true }
      );
      setLeaderboard(response.data?.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-gray-500 font-bold">#{rank}</span>;
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white';
    return 'bg-white';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center">
            <Trophy className="w-12 h-12 mr-4" />
            <div>
              <h1 className="text-4xl font-bold">Season Leaderboard</h1>
              <p className="text-lg opacity-90 mt-1">
                Compete for glory. Earn points. Climb the ranks.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Season Selector */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-6 h-6 text-modex-secondary mr-3" />
              <span className="text-white font-medium">Select Season</span>
            </div>
            <div className="relative">
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="appearance-none px-6 py-3 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white font-medium focus:border-modex-secondary focus:outline-none cursor-pointer"
              >
                {seasons.map(season => (
                  <option key={season.code} value={season.code}>
                    {season.name || season.code} {season.is_active && '(Current)'}
                  </option>
                ))}
                {seasons.length === 0 && (
                  <option value={selectedSeason}>{selectedSeason}</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin text-modex-secondary mx-auto" />
            <p className="text-gray-400 mt-4">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 rounded-xl">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No rankings yet for this season</p>
            <p className="text-sm text-gray-500 mt-2">
              Earn points by participating in competitions and earning badges!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Second Place */}
                <div className="bg-gray-800 rounded-xl p-6 text-center mt-8">
                  <div className="w-16 h-16 rounded-full bg-gray-400 mx-auto mb-3 flex items-center justify-center">
                    <Medal className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-gray-400 text-sm">#2</p>
                  <p className="text-white font-bold mt-1">
                    {leaderboard[1]?.user_profiles?.full_name || 'User'}
                  </p>
                  <p className="text-2xl font-bold text-gray-400 mt-2">
                    {leaderboard[1]?.total_points || 0}
                  </p>
                  <p className="text-xs text-gray-500">points</p>
                </div>

                {/* First Place */}
                <div className="bg-gradient-to-b from-yellow-500 to-amber-600 rounded-xl p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-white/20 mx-auto mb-3 flex items-center justify-center">
                    <Crown className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-white/80 text-sm">#1</p>
                  <p className="text-white font-bold text-lg mt-1">
                    {leaderboard[0]?.user_profiles?.full_name || 'User'}
                  </p>
                  <p className="text-4xl font-bold text-white mt-2">
                    {leaderboard[0]?.total_points || 0}
                  </p>
                  <p className="text-xs text-white/80">points</p>
                </div>

                {/* Third Place */}
                <div className="bg-gray-800 rounded-xl p-6 text-center mt-12">
                  <div className="w-14 h-14 rounded-full bg-amber-600 mx-auto mb-3 flex items-center justify-center">
                    <Medal className="w-7 h-7 text-white" />
                  </div>
                  <p className="text-gray-400 text-sm">#3</p>
                  <p className="text-white font-bold mt-1">
                    {leaderboard[2]?.user_profiles?.full_name || 'User'}
                  </p>
                  <p className="text-xl font-bold text-amber-500 mt-2">
                    {leaderboard[2]?.total_points || 0}
                  </p>
                  <p className="text-xs text-gray-500">points</p>
                </div>
              </div>
            )}

            {/* Rest of Leaderboard */}
            <div className="bg-gray-800 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-700 text-gray-400 text-sm font-medium">
                <div className="col-span-1">Rank</div>
                <div className="col-span-7">Player</div>
                <div className="col-span-2 text-center">Points</div>
                <div className="col-span-2 text-right">Badges</div>
              </div>

              {leaderboard.slice(3).map((entry, idx) => {
                const isCurrentUser = entry.user_id === user?.id;
                return (
                  <div
                    key={entry.id || idx}
                    className={`grid grid-cols-12 gap-4 p-4 border-b border-gray-700/50 items-center ${
                      isCurrentUser ? 'bg-modex-secondary/20' : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="col-span-1">
                      <span className="text-gray-400 font-bold">#{entry.rank || idx + 4}</span>
                    </div>
                    <div className="col-span-7 flex items-center">
                      {entry.user_profiles?.avatar_url ? (
                        <img
                          src={entry.user_profiles.avatar_url}
                          alt=""
                          className="w-10 h-10 rounded-full mr-3"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="text-white font-medium">
                          {entry.user_profiles?.full_name || 'User'}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-modex-secondary text-white px-2 py-0.5 rounded">
                              You
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="text-xl font-bold text-white">
                        {entry.total_points || 0}
                      </span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="text-gray-400">
                        {entry.badge_points || 0} bp
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SeasonLeaderboard;
