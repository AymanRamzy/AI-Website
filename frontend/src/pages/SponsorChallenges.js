/**
 * SponsorChallenges - View and participate in sponsor challenges
 * Phase 10: Sponsors & Gamification
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Target,
  Gift,
  Clock,
  Award,
  ExternalLink,
  Loader,
  ArrowLeft,
  Star,
  Briefcase
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function SponsorChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [challengesRes, sponsorsRes] = await Promise.all([
        axios.get(`${API_URL}/api/challenges/active`, { withCredentials: true }),
        axios.get(`${API_URL}/api/sponsors`, { withCredentials: true })
      ]);
      setChallenges(challengesRes.data || []);
      setSponsors(sponsorsRes.data || []);
    } catch (err) {
      console.error('Failed to load challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRewardIcon = (type) => {
    switch (type) {
      case 'badge': return Award;
      case 'points': return Star;
      case 'certificate': return Award;
      case 'interview': return Briefcase;
      case 'prize': return Gift;
      default: return Gift;
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'title': return 'from-yellow-500 to-amber-600';
      case 'platinum': return 'from-gray-300 to-gray-400';
      case 'gold': return 'from-yellow-400 to-yellow-500';
      case 'silver': return 'from-gray-400 to-gray-500';
      case 'bronze': return 'from-amber-600 to-amber-700';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-modex-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-modex-primary to-modex-secondary text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex items-center">
            <Target className="w-12 h-12 mr-4" />
            <div>
              <h1 className="text-4xl font-bold">Sponsor Challenges</h1>
              <p className="text-lg opacity-90 mt-1">
                Complete challenges from our sponsors. Earn rewards.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Sponsors Section */}
        {sponsors.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Our Sponsors</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {sponsors.map(sponsor => (
                <div
                  key={sponsor.id}
                  className="bg-white rounded-xl p-4 text-center border border-gray-200 hover:border-modex-secondary transition-colors"
                >
                  {sponsor.logo_url ? (
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="h-12 mx-auto mb-2 object-contain"
                    />
                  ) : (
                    <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r ${getTierColor(sponsor.tier)} flex items-center justify-center`}>
                      <Star className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <p className="font-medium text-gray-800 text-sm">{sponsor.name}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded bg-gradient-to-r ${getTierColor(sponsor.tier)} text-white capitalize`}>
                    {sponsor.tier}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Challenges */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Challenges</h2>
        
        {challenges.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No active challenges at the moment</p>
            <p className="text-sm text-gray-400 mt-2">
              Check back soon for new sponsor challenges!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {challenges.map(challenge => {
              const RewardIcon = getRewardIcon(challenge.reward_type);
              const endsAt = challenge.ends_at ? new Date(challenge.ends_at) : null;
              const daysLeft = endsAt ? Math.ceil((endsAt - new Date()) / (1000 * 60 * 60 * 24)) : null;

              return (
                <div
                  key={challenge.id}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  {/* Challenge Header */}
                  <div className="bg-gradient-to-r from-modex-secondary to-modex-accent p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {challenge.sponsors?.logo_url ? (
                          <img
                            src={challenge.sponsors.logo_url}
                            alt=""
                            className="w-8 h-8 rounded bg-white p-1 mr-3"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center mr-3">
                            <Star className="w-4 h-4" />
                          </div>
                        )}
                        <span className="font-medium">
                          {challenge.sponsors?.name || 'Sponsor'}
                        </span>
                      </div>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm capitalize">
                        {challenge.challenge_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Challenge Body */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {challenge.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {challenge.description || 'Complete this challenge to earn rewards!'}
                    </p>

                    {/* Reward */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center">
                        <RewardIcon className="w-6 h-6 text-green-600 mr-3" />
                        <div>
                          <p className="text-sm text-green-600 font-medium">Reward</p>
                          <p className="text-green-800 font-bold">
                            {challenge.reward_description || `${challenge.reward_value} ${challenge.reward_type}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      {daysLeft !== null && (
                        <div className="flex items-center text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">
                            {daysLeft > 0 ? `${daysLeft} days left` : 'Ending soon'}
                          </span>
                        </div>
                      )}
                      <button className="bg-modex-secondary hover:bg-modex-primary text-white px-4 py-2 rounded-lg font-medium flex items-center">
                        View Challenge
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default SponsorChallenges;
