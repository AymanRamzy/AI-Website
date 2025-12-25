import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Users, Trophy, ArrowLeft, AlertCircle, CheckCircle, UserPlus } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function JoinTeam() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState('');
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [error, setError] = useState('');
  const [joiningTeamId, setJoiningTeamId] = useState(null);

  useEffect(() => {
    loadCompetitions();
  }, []);

  useEffect(() => {
    if (selectedCompetition) {
      loadTeams(selectedCompetition);
    } else {
      setTeams([]);
    }
  }, [selectedCompetition]);

  const loadCompetitions = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cfo/competitions`);
      
      // Check registration status for each competition
      const competitionsWithRegistration = await Promise.all(
        response.data.map(async (comp) => {
          try {
            const regResponse = await axios.get(
              `${API_URL}/api/cfo/competitions/${comp.id}/is-registered`
            );
            return { ...comp, isRegistered: regResponse.data.is_registered };
          } catch {
            return { ...comp, isRegistered: false };
          }
        })
      );
      
      // Filter: registered and open for registration
      const availableCompetitions = competitionsWithRegistration.filter(
        (comp) => comp.isRegistered && comp.status === 'registration_open'
      );
      setCompetitions(availableCompetitions);
    } catch (error) {
      console.error('Failed to load competitions:', error);
      setError('Failed to load competitions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async (competitionId) => {
    setLoadingTeams(true);
    setError('');
    try {
      const response = await axios.get(
        `${API_URL}/api/cfo/teams/competition/${competitionId}`
      );
      // Filter teams that are not full
      const availableTeams = response.data.filter(
        (team) => team.members.length < team.max_members
      );
      setTeams(availableTeams);
    } catch (error) {
      console.error('Failed to load teams:', error);
      setError('Failed to load teams. Please try again.');
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleJoinTeam = async (teamId) => {
    setError('');
    setJoiningTeamId(teamId);

    try {
      await axios.post(`${API_URL}/api/cfo/teams/join`, {
        team_id: teamId,
      });

      // Redirect to team details page
      navigate(`/teams/${teamId}`);
    } catch (error) {
      console.error('Failed to join team:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to join team. Please try again.');
      }
      setJoiningTeamId(null);
    }
  };

  const getTeamStatusBadge = (team) => {
    const isFull = team.members.length >= team.max_members;
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold ${
          isFull
            ? 'bg-gray-100 text-gray-800'
            : team.status === 'complete'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {isFull ? 'Full' : team.status === 'complete' ? 'Complete' : 'Forming'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-modex-secondary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <Link
              to="/dashboard"
              className="text-modex-secondary hover:text-modex-primary transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-bold text-modex-primary">Join a Team</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {competitions.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              No Competitions Available
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't registered for any competitions yet. Please register for a competition first.
            </p>
            <Link
              to="/dashboard"
              className="inline-block bg-modex-secondary text-white px-6 py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <>
            {/* Competition Selection */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-200 mb-6">
              <label className="block text-sm font-bold text-modex-primary mb-3">
                Select Competition
              </label>
              <select
                value={selectedCompetition}
                onChange={(e) => setSelectedCompetition(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors"
              >
                <option value="">-- Choose a competition to see available teams --</option>
                {competitions.map((comp) => (
                  <option key={comp.id} value={comp.id}>
                    {comp.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Teams List */}
            {selectedCompetition && (
              <div>
                {loadingTeams ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-modex-secondary"></div>
                  </div>
                ) : teams.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-700 mb-2">
                      No Teams Available
                    </h3>
                    <p className="text-gray-600 mb-6">
                      There are no teams with available slots in this competition.
                      Why not create your own?
                    </p>
                    <Link
                      to="/teams/create"
                      className="inline-block bg-modex-accent text-white px-6 py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors"
                    >
                      Create New Team
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-modex-primary mb-4">
                      Available Teams ({teams.length})
                    </h2>
                    {teams.map((team) => (
                      <div
                        key={team.id}
                        className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-modex-secondary transition-all"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-xl font-bold text-modex-primary">
                                {team.team_name}
                              </h3>
                              {getTeamStatusBadge(team)}
                            </div>
                            <p className="text-sm text-gray-600">
                              {team.members.length}/{team.max_members} members
                            </p>
                          </div>
                          <button
                            onClick={() => handleJoinTeam(team.id)}
                            disabled={joiningTeamId === team.id}
                            className="bg-modex-secondary text-white px-6 py-2 rounded-lg font-bold hover:bg-modex-primary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                          >
                            {joiningTeamId === team.id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Joining...
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Join Team
                              </>
                            )}
                          </button>
                        </div>

                        {/* Team Members */}
                        <div className="border-t border-gray-200 pt-4">
                          <h4 className="text-sm font-bold text-gray-700 mb-3">
                            Current Members:
                          </h4>
                          <div className="grid grid-cols-2 gap-2">
                            {team.members.map((member) => (
                              <div
                                key={member.user_id}
                                className="flex items-center text-sm"
                              >
                                <div className="bg-gradient-to-br from-modex-secondary to-modex-accent w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold mr-2">
                                  {member.user_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">
                                    {member.user_name}
                                  </p>
                                  {member.user_id === team.leader_id && (
                                    <span className="text-xs text-modex-accent font-bold">
                                      Leader
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default JoinTeam;
