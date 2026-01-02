/**
 * TalentMarketplace - Browse and discover talent
 * Phase 9: FIFA-Style Talent Marketplace
 */
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Search,
  Star,
  TrendingUp,
  Briefcase,
  MapPin,
  Award,
  Filter,
  Users,
  Loader,
  ChevronRight,
  DollarSign,
  Settings,
  Mail
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function TalentMarketplace() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [talents, setTalents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    openToOffers: true,
    minRating: 0,
    skill: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTalents();
  }, [filters]);

  const loadTalents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.openToOffers) params.append('open_to_offers', 'true');
      if (filters.minRating > 0) params.append('min_rating', filters.minRating);
      if (filters.skill) params.append('skill', filters.skill);

      const response = await axios.get(
        `${API_URL}/api/talent/browse?${params.toString()}`,
        { withCredentials: true }
      );
      setTalents(response.data || []);
    } catch (err) {
      console.error('Failed to load talents:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rating) => {
    if (rating >= 9) return 'from-yellow-400 to-orange-500'; // Legendary
    if (rating >= 7) return 'from-purple-500 to-pink-500'; // Epic
    if (rating >= 5) return 'from-blue-500 to-cyan-500'; // Rare
    if (rating >= 3) return 'from-green-500 to-emerald-500'; // Uncommon
    return 'from-gray-400 to-gray-500'; // Common
  };

  const formatMarketValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const filteredTalents = talents.filter(t => {
    if (!searchTerm) return true;
    const name = t.user_profiles?.full_name?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-modex-secondary to-modex-accent text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <Users className="w-10 h-10 mr-3" />
                <h1 className="text-4xl font-bold">Talent Marketplace</h1>
              </div>
              <p className="text-lg opacity-90">
                Discover top CFO talent. FIFA-style transfer market for finance professionals.
              </p>
            </div>
            {/* Quick Actions */}
            <div className="flex items-center space-x-4">
              <Link
                to="/talent/offers"
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center font-medium"
              >
                <Mail className="w-5 h-5 mr-2" />
                My Offers
              </Link>
              <Link
                to="/talent/settings"
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center font-medium"
              >
                <Settings className="w-5 h-5 mr-2" />
                My Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search talent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-modex-secondary focus:outline-none"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-4">
              <select
                value={filters.minRating}
                onChange={(e) => setFilters(prev => ({ ...prev, minRating: Number(e.target.value) }))}
                className="px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-modex-secondary focus:outline-none"
              >
                <option value="0">All Ratings</option>
                <option value="3">3+ Stars</option>
                <option value="5">5+ Stars</option>
                <option value="7">7+ Stars</option>
                <option value="9">9+ Stars</option>
              </select>

              <label className="flex items-center px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.openToOffers}
                  onChange={(e) => setFilters(prev => ({ ...prev, openToOffers: e.target.checked }))}
                  className="mr-2"
                />
                Open to Offers
              </label>
            </div>
          </div>
        </div>

        {/* Talent Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader className="w-8 h-8 animate-spin text-modex-secondary mx-auto" />
            <p className="text-gray-400 mt-4">Loading talent...</p>
          </div>
        ) : filteredTalents.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No talent found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTalents.map(talent => (
              <div
                key={talent.id}
                onClick={() => navigate(`/talent/${talent.user_id}`)}
                className="bg-gray-800 rounded-xl overflow-hidden cursor-pointer transform hover:scale-105 transition-transform border border-gray-700 hover:border-modex-secondary"
              >
                {/* Card Header with Rating Gradient */}
                <div className={`bg-gradient-to-r ${getRarityColor(talent.overall_rating)} p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-6 h-6 text-white" />
                      <span className="text-2xl font-bold text-white ml-2">
                        {talent.overall_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    {talent.is_open_to_offers && (
                      <span className="bg-white/20 text-white px-2 py-1 rounded text-xs font-bold">
                        OPEN
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4">
                  {/* Avatar & Name */}
                  <div className="flex items-center mb-4">
                    {talent.user_profiles?.avatar_url ? (
                      <img
                        src={talent.user_profiles.avatar_url}
                        alt=""
                        className="w-12 h-12 rounded-full mr-3"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center mr-3">
                        <Users className="w-6 h-6 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-white">
                        {talent.user_profiles?.full_name || 'Anonymous'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {(talent.preferred_roles || [])[0] || 'CFO'}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Competitions</p>
                      <p className="text-lg font-bold text-white">
                        {talent.competitions_participated || 0}
                      </p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-gray-400">Wins</p>
                      <p className="text-lg font-bold text-yellow-400">
                        {talent.competitions_won || 0}
                      </p>
                    </div>
                  </div>

                  {/* Market Value */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <div className="flex items-center text-green-400">
                      <DollarSign className="w-5 h-5 mr-1" />
                      <span className="font-bold">
                        {formatMarketValue(talent.market_value || 0)}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TalentMarketplace;
