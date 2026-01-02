/**
 * BadgesShowcase - User badges and achievements
 * Phase 10: Gamification
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Award,
  Star,
  Trophy,
  Zap,
  Target,
  Users,
  Clock,
  CheckCircle,
  Loader,
  Sparkles
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const RARITY_CONFIG = {
  common: { color: 'from-gray-400 to-gray-500', bg: 'bg-gray-100', text: 'text-gray-600' },
  uncommon: { color: 'from-green-400 to-emerald-500', bg: 'bg-green-100', text: 'text-green-600' },
  rare: { color: 'from-blue-400 to-cyan-500', bg: 'bg-blue-100', text: 'text-blue-600' },
  epic: { color: 'from-purple-400 to-pink-500', bg: 'bg-purple-100', text: 'text-purple-600' },
  legendary: { color: 'from-yellow-400 to-orange-500', bg: 'bg-yellow-100', text: 'text-yellow-600' }
};

const CATEGORY_ICONS = {
  achievement: Trophy,
  skill: Zap,
  participation: Users,
  leadership: Star,
  special: Sparkles,
  sponsor: Target
};

function BadgesShowcase() {
  const { user } = useAuth();
  const [allBadges, setAllBadges] = useState([]);
  const [myBadges, setMyBadges] = useState([]);
  const [seasonPoints, setSeasonPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [badgesRes, myBadgesRes, pointsRes] = await Promise.all([
        axios.get(`${API_URL}/api/badges`, { withCredentials: true }),
        axios.get(`${API_URL}/api/badges/my`, { withCredentials: true }),
        axios.get(`${API_URL}/api/leaderboard/season`, { withCredentials: true }).catch(() => ({ data: null }))
      ]);

      setAllBadges(badgesRes.data || []);
      setMyBadges(myBadgesRes.data || []);
      
      if (pointsRes.data?.leaderboard) {
        const myEntry = pointsRes.data.leaderboard.find(e => e.user_id === user?.id);
        setSeasonPoints(myEntry);
      }
    } catch (err) {
      console.error('Failed to load badges:', err);
    } finally {
      setLoading(false);
    }
  };

  const earnedBadgeIds = new Set(myBadges.map(b => b.badge_id));

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader className="w-8 h-8 animate-spin text-modex-secondary mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Season Points Card */}
      {seasonPoints && (
        <div className="bg-gradient-to-r from-modex-secondary to-modex-accent rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Season Points</p>
              <p className="text-4xl font-bold">{seasonPoints.total_points || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">Global Rank</p>
              <p className="text-4xl font-bold">#{seasonPoints.rank || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveTab('my')}
          className={`px-6 py-3 rounded-lg font-bold transition-colors ${
            activeTab === 'my'
              ? 'bg-modex-secondary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          My Badges ({myBadges.length})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-6 py-3 rounded-lg font-bold transition-colors ${
            activeTab === 'all'
              ? 'bg-modex-secondary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All Badges ({allBadges.length})
        </button>
      </div>

      {/* My Badges */}
      {activeTab === 'my' && (
        <div>
          {myBadges.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">You haven't earned any badges yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Participate in competitions to earn badges!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {myBadges.map((badge, idx) => {
                const def = badge.badge_definitions || {};
                const rarity = RARITY_CONFIG[def.rarity] || RARITY_CONFIG.common;
                const Icon = CATEGORY_ICONS[def.category] || Award;

                return (
                  <div
                    key={idx}
                    className={`rounded-xl overflow-hidden border-2 border-gray-200 hover:border-modex-secondary transition-colors`}
                  >
                    <div className={`bg-gradient-to-br ${rarity.color} p-4`}>
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="p-4 bg-white">
                      <p className="font-bold text-gray-800 text-center">
                        {def.name || 'Badge'}
                      </p>
                      <p className="text-xs text-gray-500 text-center mt-1">
                        {def.description}
                      </p>
                      <div className="flex items-center justify-center mt-3">
                        <span className={`${rarity.bg} ${rarity.text} px-2 py-1 rounded text-xs font-bold capitalize`}>
                          {def.rarity}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          +{def.points_value} pts
                        </span>
                      </div>
                      {badge.competitions?.title && (
                        <p className="text-xs text-gray-400 text-center mt-2">
                          From: {badge.competitions.title}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* All Badges */}
      {activeTab === 'all' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBadges.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            const rarity = RARITY_CONFIG[badge.rarity] || RARITY_CONFIG.common;
            const Icon = CATEGORY_ICONS[badge.category] || Award;

            return (
              <div
                key={badge.id}
                className={`rounded-xl overflow-hidden border-2 transition-all ${
                  isEarned
                    ? 'border-green-400 shadow-lg'
                    : 'border-gray-200 opacity-60'
                }`}
              >
                <div className={`bg-gradient-to-br ${isEarned ? rarity.color : 'from-gray-300 to-gray-400'} p-4 relative`}>
                  {isEarned && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className={`w-16 h-16 ${isEarned ? 'bg-white/20' : 'bg-black/10'} rounded-full flex items-center justify-center mx-auto`}>
                    <Icon className={`w-8 h-8 ${isEarned ? 'text-white' : 'text-gray-500'}`} />
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <p className="font-bold text-gray-800 text-center">
                    {badge.name}
                  </p>
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {badge.description}
                  </p>
                  <div className="flex items-center justify-center mt-3">
                    <span className={`${rarity.bg} ${rarity.text} px-2 py-1 rounded text-xs font-bold capitalize`}>
                      {badge.rarity}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      +{badge.points_value} pts
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BadgesShowcase;
