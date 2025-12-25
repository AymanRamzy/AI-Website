import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Users, ArrowLeft, AlertCircle, Award, CheckCircle, Loader } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function CreateTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [teamEligibility, setTeamEligibility] = useState(null);

  useEffect(() => {
    loadCompetitions();
  }, []);

  // Check team creation eligibility when competition is selected
  useEffect(() => {
    if (selectedCompetition) {
      checkTeamEligibility(selectedCompetition);
    } else {
      setTeamEligibility(null);
    }
  }, [selectedCompetition]);

  const loadCompetitions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cfo/competitions`);
      
      // Filter to open competitions only
      const openCompetitions = response.data.filter(
        (comp) => comp.status === 'registration_open' || comp.status === 'open'
      );
      
      setCompetitions(openCompetitions);
    } catch (error) {
      console.error('Failed to load competitions:', error);
      setError('Failed to load competitions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkTeamEligibility = async (competitionId) => {
    try {
      const response = await axios.get(`${API_URL}/api/cfo/teams/eligibility`, {
        params: { competition_id: competitionId }
      });
      setTeamEligibility(response.data);
    } catch (error) {
      console.error('Failed to check eligibility:', error);
      setTeamEligibility({
        can_create_team: false,
        reason: 'Failed to check eligibility'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCompetition || !teamName.trim()) {
      setError('Please select a competition and enter a team name');
      return;
    }

    if (!teamEligibility?.can_create_team) {
      setError(teamEligibility?.reason || 'You are not eligible to create a team');
      return;
    }

    setSubmitting(true);

    try {
      const response = await axios.post(`${API_URL}/api/cfo/teams`, {
        competition_id: selectedCompetition,
        team_name: teamName.trim(),
      });

      // Navigate to the team details page
      if (response.data?.id) {
        navigate(`/teams/${response.data.id}`);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      setError(error.response?.data?.detail || 'Failed to create team. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-modex-secondary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-modex-secondary mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center mb-6">
            <div className="bg-modex-secondary/10 p-4 rounded-xl mr-4">
              <Users className="w-10 h-10 text-modex-secondary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-modex-primary">Create Your Team</h1>
              <p className="text-gray-600">As a Qualified CFO, build your team of 5</p>
            </div>
          </div>

          {/* CFO-First Notice */}
          <div className="bg-modex-light border border-modex-accent/30 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <Award className="w-6 h-6 text-modex-accent mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-modex-primary">CFO-First Model</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Only Qualified CFOs (Top 100) can create teams. If you haven&apos;t applied yet, 
                  submit your CFO application first.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {competitions.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Active Competitions</h3>
              <p className="text-gray-600">
                There are no competitions open for team creation at this time.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Competition Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Competition
                </label>
                <select
                  value={selectedCompetition}
                  onChange={(e) => setSelectedCompetition(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                >
                  <option value="">-- Select a Competition --</option>
                  {competitions.map((comp) => (
                    <option key={comp.id} value={comp.id}>
                      {comp.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Eligibility Status */}
              {selectedCompetition && teamEligibility && (
                <div className={`mb-6 p-4 rounded-lg border-2 ${
                  teamEligibility.can_create_team 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start">
                    {teamEligibility.can_create_team ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" />
                    )}
                    <div>
                      <h4 className={`font-bold ${teamEligibility.can_create_team ? 'text-green-800' : 'text-yellow-800'}`}>
                        {teamEligibility.can_create_team ? 'Eligible to Create Team' : 'Not Yet Eligible'}
                      </h4>
                      <p className={`text-sm mt-1 ${teamEligibility.can_create_team ? 'text-green-700' : 'text-yellow-700'}`}>
                        {teamEligibility.reason}
                      </p>
                      {teamEligibility.cfo_status && (
                        <p className="text-sm mt-2">
                          <strong>CFO Status:</strong> {teamEligibility.cfo_status}
                        </p>
                      )}
                      {!teamEligibility.can_create_team && teamEligibility.cfo_status !== 'qualified' && (
                        <Link 
                          to={`/cfo-application/${selectedCompetition}`}
                          className="inline-flex items-center mt-3 text-modex-secondary hover:underline font-semibold"
                        >
                          <Award className="w-4 h-4 mr-1" />
                          Apply as CFO
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Team Name */}
              {teamEligibility?.can_create_team && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Enter your team name"
                    maxLength={50}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {teamName.length}/50 characters
                  </p>
                </div>
              )}

              {/* Submit Button */}
              {teamEligibility?.can_create_team && (
                <button
                  type="submit"
                  disabled={submitting || !teamName.trim()}
                  className="w-full bg-gradient-to-r from-modex-secondary to-modex-accent text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Creating Team...
                    </>
                  ) : (
                    <>
                      <Users className="w-5 h-5 mr-2" />
                      Create Team
                    </>
                  )}
                </button>
              )}
            </form>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Team Requirements</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Only Qualified CFOs (Top 100) can create teams</li>
            <li>• Teams need 5 members total (including you as CFO)</li>
            <li>• Assign roles: Analyst, Designer, Strategist, Communicator</li>
            <li>• Complete your team before the deadline</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CreateTeam;
