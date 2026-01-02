/**
 * TalentSettings - Edit talent profile settings
 * Phase 9: Talent Marketplace
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User,
  Settings,
  Save,
  ArrowLeft,
  Loader,
  CheckCircle,
  AlertCircle,
  Globe,
  MapPin,
  Briefcase,
  Eye,
  EyeOff,
  DollarSign
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function TalentSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    is_public: true,
    is_open_to_offers: true,
    headline: '',
    bio: '',
    preferred_roles: [],
    preferred_locations: [],
    remote_preference: 'hybrid',
    min_salary_expectation: '',
    skill_financial_modeling: 50,
    skill_strategic_thinking: 50,
    skill_data_analysis: 50,
    skill_communication: 50,
    skill_leadership: 50,
    skill_risk_management: 50
  });

  const roleOptions = ['CFO', 'Finance Director', 'VP Finance', 'Controller', 'Treasurer', 'Financial Analyst', 'FP&A Manager'];
  const remoteOptions = [
    { value: 'remote', label: 'Fully Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'onsite', label: 'On-site Only' }
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/talent/profile`, {
        withCredentials: true
      });
      const data = response.data;
      setProfile(data);
      setFormData({
        is_public: data.is_public ?? true,
        is_open_to_offers: data.is_open_to_offers ?? true,
        headline: data.headline || '',
        bio: data.bio || '',
        preferred_roles: data.preferred_roles || [],
        preferred_locations: data.preferred_locations || [],
        remote_preference: data.remote_preference || 'hybrid',
        min_salary_expectation: data.min_salary_expectation || '',
        skill_financial_modeling: data.skill_financial_modeling || 50,
        skill_strategic_thinking: data.skill_strategic_thinking || 50,
        skill_data_analysis: data.skill_data_analysis || 50,
        skill_communication: data.skill_communication || 50,
        skill_leadership: data.skill_leadership || 50,
        skill_risk_management: data.skill_risk_management || 50
      });
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Create new profile if not exists
      setFormData(prev => ({ ...prev }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await axios.patch(
        `${API_URL}/api/talent/profile`,
        {
          ...formData,
          min_salary_expectation: formData.min_salary_expectation 
            ? Number(formData.min_salary_expectation) 
            : null
        },
        { withCredentials: true }
      );
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (role) => {
    setFormData(prev => ({
      ...prev,
      preferred_roles: prev.preferred_roles.includes(role)
        ? prev.preferred_roles.filter(r => r !== role)
        : [...prev.preferred_roles, role]
    }));
  };

  const handleLocationInput = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const location = e.target.value.trim();
      if (!formData.preferred_locations.includes(location)) {
        setFormData(prev => ({
          ...prev,
          preferred_locations: [...prev.preferred_locations, location]
        }));
      }
      e.target.value = '';
    }
  };

  const removeLocation = (location) => {
    setFormData(prev => ({
      ...prev,
      preferred_locations: prev.preferred_locations.filter(l => l !== location)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-modex-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-modex-secondary to-modex-accent text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            to="/talent"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Marketplace
          </Link>
          <div className="flex items-center">
            <Settings className="w-10 h-10 mr-3" />
            <div>
              <h1 className="text-3xl font-bold">Profile Settings</h1>
              <p className="text-lg opacity-90">Manage your talent marketplace presence</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-500/20 border border-green-500 text-green-400 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Visibility Settings */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Visibility Settings
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg cursor-pointer">
                <div>
                  <p className="font-medium text-white">Public Profile</p>
                  <p className="text-sm text-gray-400">Allow others to view your profile</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.is_public}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_public: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-14 h-8 rounded-full transition-colors ${formData.is_public ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-6 h-6 rounded-full bg-white transform transition-transform mt-1 ${formData.is_public ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              </label>

              <label className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg cursor-pointer">
                <div>
                  <p className="font-medium text-white">Open to Offers</p>
                  <p className="text-sm text-gray-400">Allow companies to send you job offers</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={formData.is_open_to_offers}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_open_to_offers: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`w-14 h-8 rounded-full transition-colors ${formData.is_open_to_offers ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-6 h-6 rounded-full bg-white transform transition-transform mt-1 ${formData.is_open_to_offers ? 'translate-x-7' : 'translate-x-1'}`} />
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Bio & Headline */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              About You
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData(prev => ({ ...prev, headline: e.target.value }))}
                  placeholder="e.g., Strategic CFO with 10+ years in tech"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-modex-secondary focus:outline-none"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell companies about your experience and what you're looking for..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-modex-secondary focus:outline-none resize-none"
                  rows="4"
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <Briefcase className="w-5 h-5 mr-2" />
              Job Preferences
            </h2>
            
            <div className="space-y-6">
              {/* Preferred Roles */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Preferred Roles</label>
                <div className="flex flex-wrap gap-2">
                  {roleOptions.map(role => (
                    <button
                      key={role}
                      onClick={() => toggleRole(role)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.preferred_roles.includes(role)
                          ? 'bg-modex-secondary text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Preferred Locations</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.preferred_locations.map(loc => (
                    <span
                      key={loc}
                      className="bg-gray-700 text-white px-3 py-1 rounded-full text-sm flex items-center"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      {loc}
                      <button
                        onClick={() => removeLocation(loc)}
                        className="ml-2 text-gray-400 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  onKeyDown={handleLocationInput}
                  placeholder="Type a city and press Enter..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-modex-secondary focus:outline-none"
                />
              </div>

              {/* Remote Preference */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Work Style</label>
                <div className="grid grid-cols-3 gap-4">
                  {remoteOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFormData(prev => ({ ...prev, remote_preference: opt.value }))}
                      className={`p-4 rounded-lg text-center transition-colors ${
                        formData.remote_preference === opt.value
                          ? 'bg-modex-secondary text-white border-2 border-modex-secondary'
                          : 'bg-gray-700 text-gray-300 border-2 border-transparent hover:border-gray-600'
                      }`}
                    >
                      <Globe className="w-6 h-6 mx-auto mb-2" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Salary Expectation */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Minimum Salary Expectation (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.min_salary_expectation}
                    onChange={(e) => setFormData(prev => ({ ...prev, min_salary_expectation: e.target.value }))}
                    placeholder="100000"
                    className="w-full pl-12 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-modex-secondary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Skills Self-Assessment */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Skills Self-Assessment</h2>
            <p className="text-sm text-gray-400 mb-6">
              Rate your skills (these can be updated based on competition performance)
            </p>
            
            <div className="space-y-6">
              {[
                { key: 'skill_financial_modeling', label: 'Financial Modeling' },
                { key: 'skill_strategic_thinking', label: 'Strategic Thinking' },
                { key: 'skill_data_analysis', label: 'Data Analysis' },
                { key: 'skill_communication', label: 'Communication' },
                { key: 'skill_leadership', label: 'Leadership' },
                { key: 'skill_risk_management', label: 'Risk Management' }
              ].map(skill => (
                <div key={skill.key}>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">{skill.label}</span>
                    <span className="text-modex-secondary font-bold">{formData[skill.key]}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={formData[skill.key]}
                    onChange={(e) => setFormData(prev => ({ ...prev, [skill.key]: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-modex-secondary"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-modex-secondary hover:bg-modex-primary text-white px-8 py-3 rounded-lg font-bold flex items-center disabled:opacity-50"
            >
              {saving ? (
                <Loader className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TalentSettings;
