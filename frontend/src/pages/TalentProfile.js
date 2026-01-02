/**
 * TalentProfile - Individual talent profile view
 * Phase 9: Talent Marketplace
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  User,
  Star,
  Trophy,
  Award,
  MapPin,
  Briefcase,
  TrendingUp,
  DollarSign,
  Mail,
  ArrowLeft,
  Loader,
  AlertCircle,
  Send,
  CheckCircle,
  Globe
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function TalentProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerSent, setOfferSent] = useState(false);

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const endpoint = isOwnProfile
        ? `${API_URL}/api/talent/profile`
        : `${API_URL}/api/talent/${userId}`;
      
      const response = await axios.get(endpoint, { withCredentials: true });
      setProfile(response.data);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err.response?.data?.detail || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const getSkillLevel = (value) => {
    if (value >= 90) return { label: 'Elite', color: 'text-yellow-400' };
    if (value >= 70) return { label: 'Expert', color: 'text-purple-400' };
    if (value >= 50) return { label: 'Advanced', color: 'text-blue-400' };
    if (value >= 30) return { label: 'Intermediate', color: 'text-green-400' };
    return { label: 'Beginner', color: 'text-gray-400' };
  };

  const skills = [
    { key: 'skill_financial_modeling', label: 'Financial Modeling' },
    { key: 'skill_strategic_thinking', label: 'Strategic Thinking' },
    { key: 'skill_data_analysis', label: 'Data Analysis' },
    { key: 'skill_communication', label: 'Communication' },
    { key: 'skill_leadership', label: 'Leadership' },
    { key: 'skill_risk_management', label: 'Risk Management' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-modex-secondary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white text-lg">{error}</p>
          <Link to="/talent" className="text-modex-secondary hover:underline mt-4 inline-block">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-modex-secondary to-modex-accent">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link
            to="/talent"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-8">
        {/* Profile Card */}
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          {/* Top Section */}
          <div className="p-6 bg-gradient-to-r from-gray-700 to-gray-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center">
                {profile?.user_profiles?.avatar_url ? (
                  <img
                    src={profile.user_profiles.avatar_url}
                    alt=""
                    className="w-24 h-24 rounded-full border-4 border-modex-secondary"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-600 flex items-center justify-center border-4 border-modex-secondary">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="ml-6">
                  <h1 className="text-2xl font-bold text-white">
                    {profile?.user_profiles?.full_name || 'Anonymous Talent'}
                  </h1>
                  <div className="flex items-center mt-2">
                    <Star className="w-6 h-6 text-yellow-400 mr-2" />
                    <span className="text-3xl font-bold text-yellow-400">
                      {profile?.overall_rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                {profile?.is_open_to_offers && !isOwnProfile && (
                  <button
                    onClick={() => setShowOfferModal(true)}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold flex items-center"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Make Offer
                  </button>
                )}
                {isOwnProfile && (
                  <Link
                    to="/talent/settings"
                    className="bg-modex-secondary hover:bg-modex-primary text-white px-6 py-3 rounded-lg font-bold"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-gray-700">
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {profile?.market_value?.toLocaleString() || 0}
              </p>
              <p className="text-sm text-gray-400">Market Value</p>
            </div>
            <div className="text-center">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {profile?.competitions_won || 0}
              </p>
              <p className="text-sm text-gray-400">Wins</p>
            </div>
            <div className="text-center">
              <Award className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {profile?.competitions_participated || 0}
              </p>
              <p className="text-sm text-gray-400">Competitions</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                #{profile?.average_rank?.toFixed(0) || '-'}
              </p>
              <p className="text-sm text-gray-400">Avg Rank</p>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Skills */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Skills</h3>
              <div className="space-y-4">
                {skills.map(skill => {
                  const value = profile?.[skill.key] || 0;
                  const level = getSkillLevel(value);
                  return (
                    <div key={skill.key}>
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-300">{skill.label}</span>
                        <span className={`font-bold ${level.color}`}>
                          {value} - {level.label}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-modex-secondary to-modex-accent`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preferences & Badges */}
            <div>
              <h3 className="text-lg font-bold text-white mb-4">Preferences</h3>
              <div className="space-y-3">
                {profile?.preferred_roles?.length > 0 && (
                  <div className="flex items-start">
                    <Briefcase className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Preferred Roles</p>
                      <p className="text-white">
                        {profile.preferred_roles.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                {profile?.preferred_locations?.length > 0 && (
                  <div className="flex items-start">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Locations</p>
                      <p className="text-white">
                        {profile.preferred_locations.join(', ')}
                      </p>
                    </div>
                  </div>
                )}
                {profile?.remote_preference && (
                  <div className="flex items-start">
                    <Globe className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-400">Work Style</p>
                      <p className="text-white capitalize">
                        {profile.remote_preference}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Badges */}
              {profile?.user_badges?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-bold text-white mb-4">Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.user_badges.map((badge, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-700 rounded-lg px-3 py-2 flex items-center"
                      >
                        <Award className="w-4 h-4 text-yellow-400 mr-2" />
                        <span className="text-white text-sm">
                          {badge.badge_definitions?.name || 'Badge'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Offer Modal */}
      {showOfferModal && (
        <OfferModal
          talentId={userId}
          talentName={profile?.user_profiles?.full_name}
          onClose={() => setShowOfferModal(false)}
          onSuccess={() => {
            setShowOfferModal(false);
            setOfferSent(true);
          }}
        />
      )}

      {/* Success Toast */}
      {offerSent && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Offer sent successfully!
        </div>
      )}
    </div>
  );
}

// Offer Modal Component
function OfferModal({ talentId, talentName, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    role_title: '',
    role_description: '',
    salary_min: '',
    salary_max: '',
    location: '',
    remote_option: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await axios.post(
        `${API_URL}/api/talent/offers`,
        {
          talent_id: talentId,
          ...formData,
          salary_min: formData.salary_min ? Number(formData.salary_min) : null,
          salary_max: formData.salary_max ? Number(formData.salary_max) : null
        },
        { withCredentials: true }
      );
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send offer');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-bold text-white">
            Make Offer to {talentName}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Role Title *</label>
            <input
              type="text"
              required
              value={formData.role_title}
              onChange={(e) => setFormData(prev => ({ ...prev, role_title: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-modex-secondary focus:outline-none"
              placeholder="e.g., Chief Financial Officer"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              value={formData.role_description}
              onChange={(e) => setFormData(prev => ({ ...prev, role_description: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-modex-secondary focus:outline-none resize-none"
              rows="3"
              placeholder="Describe the role and responsibilities..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Min Salary (USD)</label>
              <input
                type="number"
                value={formData.salary_min}
                onChange={(e) => setFormData(prev => ({ ...prev, salary_min: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-modex-secondary focus:outline-none"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Max Salary (USD)</label>
              <input
                type="number"
                value={formData.salary_max}
                onChange={(e) => setFormData(prev => ({ ...prev, salary_max: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-modex-secondary focus:outline-none"
                placeholder="150000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-modex-secondary focus:outline-none"
              placeholder="e.g., New York, NY"
            />
          </div>

          <label className="flex items-center text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.remote_option}
              onChange={(e) => setFormData(prev => ({ ...prev, remote_option: e.target.checked }))}
              className="mr-2"
            />
            Remote work available
          </label>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold disabled:opacity-50 flex items-center"
            >
              {submitting ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <><Send className="w-5 h-5 mr-2" /> Send Offer</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TalentProfile;
