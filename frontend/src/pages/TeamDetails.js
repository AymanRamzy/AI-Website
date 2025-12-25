import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Trophy,
  ArrowLeft,
  AlertCircle,
  Copy,
  CheckCircle,
  UserMinus,
  Shield,
  MessageSquare,
  Video,
  Award,
} from 'lucide-react';
import TeamChat from '../components/TeamChat';
import TeamVideo from '../components/TeamVideo';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function TeamDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [copiedTeamId, setCopiedTeamId] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [assigningRole, setAssigningRole] = useState(null);
  const [activeTab, setActiveTab] = useState('members'); // members, chat, video

  const roles = ['Analyst', 'Designer', 'Strategist', 'Communicator'];

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      // Load team data
      const teamResponse = await axios.get(`${API_URL}/api/cfo/teams/${teamId}`);
      setTeam(teamResponse.data);

      // Load competition data
      const compResponse = await axios.get(
        `${API_URL}/api/cfo/competitions/${teamResponse.data.competition_id}`
      );
      setCompetition(compResponse.data);
    } catch (error) {
      console.error('Failed to load team data:', error);
      setError('Failed to load team data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTeamId = () => {
    navigator.clipboard.writeText(team.id);
    setCopiedTeamId(true);
    setTimeout(() => setCopiedTeamId(false), 2000);
  };

  const handleLeaveTeam = async () => {
    if (!window.confirm('Are you sure you want to leave this team?')) {
      return;
    }

    setLeaving(true);
    setError('');

    try {
      await axios.delete(`${API_URL}/api/cfo/teams/${teamId}/leave`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to leave team:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to leave team. Please try again.');
      }
      setLeaving(false);
    }
  };

  const handleAssignRole = async (memberId, newRole) => {
    setAssigningRole(memberId);
    setError('');
    setSuccessMessage('');

    try {
      await axios.put(`${API_URL}/api/cfo/teams/${teamId}/assign-role`, {
        user_id: memberId,
        team_role: newRole,
      });

      // Update local state immediately (CHANGE 2)
      setTeam(prev => ({
        ...prev,
        members: prev.members.map(m =>
          m.user_id === memberId
            ? { ...m, team_role: newRole }
            : m
        )
      }));

      setSuccessMessage('Role assigned successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Failed to assign role:', error);
      if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to assign role. Please try again.');
      }
    } finally {
      setAssigningRole(null);
    }
  };

  // Helper to capitalize role for display (CHANGE 3)
  const capitalizeRole = (role) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const isLeader = team && user && team.leader_id === user.id;

  const getAvailableRoles = (currentMemberRole) => {
    if (!team) return [];

    const assignedRoles = team.members
      .map((m) => m.team_role)
      .filter((role) => role && role !== currentMemberRole);

    return roles.filter((role) => !assignedRoles.includes(role));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-modex-secondary"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Team Not Found</h2>
          <p className="text-gray-600 mb-6">The team you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            to="/dashboard"
            className="inline-block bg-modex-secondary text-white px-6 py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
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
            <h1 className="text-2xl font-bold text-modex-primary">Team Details</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Team Info Card */}
        <div className="bg-white rounded-xl p-8 border-2 border-modex-secondary/20 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-modex-primary mb-2">
                {team.team_name}
              </h2>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  team.status === 'complete'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {team.status === 'complete' ? 'Complete' : 'Forming'}
              </span>
            </div>
            {!isLeader && (
              <button
                onClick={handleLeaveTeam}
                disabled={leaving}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
              >
                {leaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Leaving...
                  </>
                ) : (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    Leave Team
                  </>
                )}
              </button>
            )}
          </div>

          {/* Competition Info */}
          {competition && (
            <div className="bg-modex-light p-4 rounded-lg mb-6">
              <div className="flex items-start">
                <Trophy className="w-5 h-5 text-modex-accent mr-3 mt-0.5" />
                <div>
                  <h4 className="font-bold text-modex-primary">{competition.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{competition.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                    <span>
                      Registration: {new Date(competition.registration_deadline).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>
                      Duration: {new Date(competition.start_date).toLocaleDateString()} -{' '}
                      {new Date(competition.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CFO Status Badge - Show for team leader */}
          {isLeader && (
            <div className="bg-gradient-to-r from-modex-accent/10 to-modex-secondary/10 border-2 border-modex-accent/30 p-4 rounded-xl mb-6">
              <div className="flex items-center">
                <Award className="w-6 h-6 text-modex-accent mr-3" />
                <div>
                  <span className="font-bold text-modex-primary">Qualified CFO</span>
                  <p className="text-sm text-gray-600">You are leading this team as a Top 100 CFO</p>
                </div>
              </div>
            </div>
          )}
          {/* Team ID (for sharing) */}
          {isLeader && team.members.length < team.max_members && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
              <h4 className="font-bold text-blue-900 mb-2">Share Team ID</h4>
              <p className="text-sm text-blue-800 mb-3">
                Share this ID with others so they can join your team
              </p>
              <div className="flex items-center">
                <code className="flex-1 bg-white px-4 py-2 rounded-lg text-sm font-mono text-gray-800 border border-blue-200">
                  {team.id}
                </code>
                <button
                  onClick={handleCopyTeamId}
                  className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center"
                >
                  {copiedTeamId ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('members')}
                className={`px-6 py-3 font-bold transition-colors border-b-2 ${
                  activeTab === 'members'
                    ? 'border-modex-secondary text-modex-secondary'
                    : 'border-transparent text-gray-600 hover:text-modex-primary'
                }`}
              >
                <Users className="w-5 h-5 inline-block mr-2" />
                Members
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-6 py-3 font-bold transition-colors border-b-2 ${
                  activeTab === 'chat'
                    ? 'border-modex-secondary text-modex-secondary'
                    : 'border-transparent text-gray-600 hover:text-modex-primary'
                }`}
              >
                <MessageSquare className="w-5 h-5 inline-block mr-2" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`px-6 py-3 font-bold transition-colors border-b-2 ${
                  activeTab === 'video'
                    ? 'border-modex-secondary text-modex-secondary'
                    : 'border-transparent text-gray-600 hover:text-modex-primary'
                }`}
              >
                <Video className="w-5 h-5 inline-block mr-2" />
                Video Calls
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'members' && (
            <div>
              <h3 className="font-bold text-modex-primary mb-4 text-lg">
                Team Members ({team.members.length}/{team.max_members})
              </h3>
            <div className="space-y-4">
              {team.members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center flex-1">
                    <div className="bg-gradient-to-br from-modex-secondary to-modex-accent w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {member.user_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-modex-primary text-lg">
                        {member.user_name}
                        {member.user_id === user.id && (
                          <span className="text-sm text-gray-500 ml-2">(You)</span>
                        )}
                      </p>
                      {member.user_id === team.leader_id && (
                        <div className="flex items-center text-modex-accent text-sm font-bold mt-1">
                          <Shield className="w-4 h-4 mr-1" />
                          Team Leader
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Role Assignment */}
                  <div className="ml-4">
                    {member.user_id === team.leader_id ? (
                      <span className="bg-modex-accent/20 text-modex-accent px-4 py-2 rounded-lg text-sm font-bold">
                        CFO
                      </span>
                    ) : isLeader ? (
                      <select
                        value={capitalizeRole(member.team_role)}
                        onChange={(e) => handleAssignRole(member.user_id, e.target.value)}
                        disabled={assigningRole === member.user_id}
                        className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none transition-colors disabled:bg-gray-200"
                      >
                        <option value="">-- Assign Role --</option>
                        <option value="Designer">Designer</option>
                        <option value="Analyst">Analyst</option>
                        <option value="Strategist">Strategist</option>
                        <option value="Communicator">Communicator</option>
                      </select>
                    ) : member.team_role ? (
                      <span className="bg-modex-secondary/10 text-modex-secondary px-4 py-2 rounded-lg text-sm font-bold">
                        {capitalizeRole(member.team_role)}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm italic">No role assigned</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Team Status Info */}
            {team.members.length < team.max_members && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 font-semibold">
                  <Users className="w-4 h-4 inline-block mr-1" />
                  Team needs {team.max_members - team.members.length} more member
                  {team.max_members - team.members.length > 1 ? 's' : ''} to be complete
                </p>
              </div>
            )}
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div>
              <TeamChat teamId={teamId} teamMembers={team.members} />
            </div>
          )}

          {/* Video Tab */}
          {activeTab === 'video' && (
            <div>
              <TeamVideo 
                teamId={teamId} 
                teamName={team.team_name}
                teamMembers={team.members} 
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamDetails;


