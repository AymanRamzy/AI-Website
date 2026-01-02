/**
 * PointsHistory - View points history and activity
 * Phase 10: Gamification
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  TrendingUp,
  Award,
  Trophy,
  Calendar,
  ArrowLeft,
  Loader,
  Star,
  Gift,
  Target,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const ACTIVITY_ICONS = {
  badge_earned: Award,
  competition_win: Trophy,
  competition_participated: Target,
  challenge_completed: Gift,
  bonus_points: Star
};

function PointsHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSeasons();
  }, []);

  useEffect(() => {
    if (selectedSeason) {
      loadHistory();
    }
  }, [selectedSeason]);

  const loadSeasons = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/seasons`, { withCredentials: true });
      const seasonList = response.data || [];
      setSeasons(seasonList);
      
      // Select current season
      const activeSeason = seasonList.find(s => s.is_active);
      if (activeSeason) {
        setSelectedSeason(activeSeason.code);
      } else if (seasonList.length > 0) {
        setSelectedSeason(seasonList[0].code);
      } else {
        const now = new Date();
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        setSelectedSeason(`${now.getFullYear()}-S${quarter}`);
      }
    } catch (err) {
      console.error('Failed to load seasons:', err);
      const now = new Date();
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      setSelectedSeason(`${now.getFullYear()}-S${quarter}`);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      // Load leaderboard entry for current user
      const leaderboardRes = await axios.get(
        `${API_URL}/api/leaderboard/season?season=${selectedSeason}`,
        { withCredentials: true }
      );
      
      const myEntry = leaderboardRes.data?.leaderboard?.find(e => e.user_id === user?.id);
      setSummary(myEntry || { total_points: 0, badge_points: 0, competition_points: 0 });

      // Load badges for activity
      const badgesRes = await axios.get(`${API_URL}/api/badges/my`, { withCredentials: true });
      const badges = badgesRes.data || [];

      // Transform badges into history items
      const badgeHistory = badges.map(b => ({
        id: b.id,
        type: 'badge_earned',
        title: `Earned badge: ${b.badge_definitions?.name || 'Badge'}`,
        points: b.badge_definitions?.points_value || 0,
        timestamp: b.earned_at,
        meta: {
          badge_name: b.badge_definitions?.name,
          rarity: b.badge_definitions?.rarity,
          competition: b.competitions?.title
        }
      }));

      setHistory(badgeHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'text-gray-500',
      uncommon: 'text-green-500',
      rare: 'text-blue-500',
      epic: 'text-purple-500',
      legendary: 'text-yellow-500'
    };
    return colors[rarity] || colors.common;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center">
            <TrendingUp className="w-10 h-10 mr-3" />
            <div>
              <h1 className="text-3xl font-bold">Points History</h1>
              <p className="text-lg opacity-90">Track your progress and achievements</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Season Selector */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-3" />
            <span className="text-white font-medium">Season</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="appearance-none px-6 py-2 pr-10 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-green-500 focus:outline-none"
              >
                {seasons.map(s => (
                  <option key={s.code} value={s.code}>
                    {s.name || s.code} {s.is_active && '(Current)'}
                  </option>
                ))}
                {seasons.length === 0 && (
                  <option value={selectedSeason}>{selectedSeason}</option>
                )}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={loadHistory}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin text-green-500 mx-auto" />
          </div>
        ) : (
          <>
            {/* Points Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{summary?.total_points || 0}</p>
                <p className="text-sm text-gray-400">Total Points</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
                <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{summary?.badge_points || 0}</p>
                <p className="text-sm text-gray-400">Badge Points</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
                <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-3xl font-bold text-white">{summary?.competition_points || 0}</p>
                <p className="text-sm text-gray-400">Competition Points</p>
              </div>
            </div>

            {/* Activity List */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-700">
                <h2 className="text-lg font-bold text-white">Recent Activity</h2>
              </div>

              {history.length === 0 ? (
                <div className="p-12 text-center">
                  <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">No activity yet this season</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Earn badges and compete to build your history!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {history.map((item) => {
                    const Icon = ACTIVITY_ICONS[item.type] || Star;
                    return (
                      <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-750">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center mr-4">
                            <Icon className={`w-5 h-5 ${getRarityColor(item.meta?.rarity)}`} />
                          </div>
                          <div>
                            <p className="text-white font-medium">{item.title}</p>
                            <div className="flex items-center text-sm text-gray-400 mt-1">
                              <Calendar className="w-3 h-3 mr-1" />
                              {formatDate(item.timestamp)}
                              {item.meta?.competition && (
                                <span className="ml-3">• {item.meta.competition}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-green-400">+{item.points}</span>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PointsHistory;
