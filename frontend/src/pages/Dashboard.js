import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trophy, Users, Calendar, LogOut, Plus, ArrowRight, Clock, CheckCircle, Edit3, User } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [myTeam, setMyTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('competitions');

  useEffect(() => {
    loadData();
    
    // Reload data when user returns to dashboard
    const handleFocus = () => {
      loadData();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const loadData = async () => {
    try {
      // Load competitions
      const compResponse = await axios.get(`${API_URL}/api/cfo/competitions`);
      setCompetitions(compResponse.data);

      // Load my team
      try {
        const teamResponse = await axios.get(`${API_URL}/api/cfo/teams/my-team`);
        setMyTeam(teamResponse.data);
      } catch (error) {
        // No team yet
        setMyTeam(null);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      upcoming: 'bg-blue-100 text-blue-800',
      registration_open: 'bg-green-100 text-green-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-gray-100 text-gray-800',
    };

    const statusLabels = {
      upcoming: 'Upcoming',
      registration_open: 'Open for Registration',
      in_progress: 'In Progress',
      completed: 'Completed',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-modex-primary">
                Mod<span className="text-modex-secondary">EX</span> <span className="text-xl font-bold text-gray-600">Dashboard</span>
              </h1>
              {user?.role === 'admin' && (
                <button onClick={() => navigate('/admin')} className="ml-4 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700">
                  Admin Dashboard
                </button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-bold text-modex-primary">{user?.full_name}</p>
              </div>
              {/* Edit Profile Button */}
              <button
                onClick={() => navigate('/profile', { state: { editMode: true } })}
                className="bg-modex-secondary/10 hover:bg-modex-secondary/20 text-modex-secondary px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
                data-testid="edit-profile-btn"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('competitions')}
            className={`px-6 py-3 font-bold transition-colors border-b-2 ${
              activeTab === 'competitions'
                ? 'border-modex-secondary text-modex-secondary'
                : 'border-transparent text-gray-600 hover:text-modex-primary'
            }`}
          >
            <Trophy className="w-5 h-5 inline-block mr-2" />
            Competitions
          </button>
          <button
            onClick={() => {
              setActiveTab('my-team');
              loadData(); // Refresh team data when switching to My Team tab
            }}
            className={`px-6 py-3 font-bold transition-colors border-b-2 ${
              activeTab === 'my-team'
                ? 'border-modex-secondary text-modex-secondary'
                : 'border-transparent text-gray-600 hover:text-modex-primary'
            }`}
          >
            <Users className="w-5 h-5 inline-block mr-2" />
            My Team
          </button>
        </div>

        {/* Competitions Tab */}
        {activeTab === 'competitions' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-modex-primary">All Competitions</h2>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin/competitions/create')}
                  className="bg-modex-accent text-white px-6 py-3 rounded-lg font-bold hover:bg-modex-primary transition-all flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Competition
                </button>
              )}
            </div>

            {competitions.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No competitions available yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {competitions.map((competition) => (
                  <div
                    key={competition.id}
                    className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-modex-secondary transition-all hover:shadow-lg cursor-pointer"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <Trophy className="w-10 h-10 text-modex-accent" />
                      {getStatusBadge(competition.status)}
                    </div>
                    <h3 className="text-xl font-bold text-modex-primary mb-2">{competition.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{competition.description}</p>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Registration: {formatDate(competition.registration_deadline)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{formatDate(competition.start_date)} - {formatDate(competition.end_date)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{competition.registered_teams}/{competition.max_teams} teams registered</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate(`/competitions/${competition.id}`)}
                      className="mt-4 w-full bg-modex-secondary text-white py-2 rounded-lg font-bold hover:bg-modex-primary transition-colors flex items-center justify-center"
                    >
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* My Team Tab */}
        {activeTab === 'my-team' && (
          <div>
            <h2 className="text-2xl font-bold text-modex-primary mb-6">My Team</h2>
            
            {!myTeam ? (
              <div className="bg-white rounded-xl p-12 text-center border-2 border-gray-200">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-6">You&apos;re not in any team yet</p>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => navigate('/teams/create')}
                    className="bg-modex-accent text-white px-6 py-3 rounded-lg font-bold hover:bg-modex-primary transition-all"
                  >
                    <Plus className="w-5 h-5 inline-block mr-2" />
                    Create Team
                  </button>
                  <button
                    onClick={() => navigate('/teams/join')}
                    className="bg-modex-secondary text-white px-6 py-3 rounded-lg font-bold hover:bg-modex-primary transition-all"
                  >
                    Join Team
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-8 border-2 border-modex-secondary/20">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-modex-primary mb-2">{myTeam.team_name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      myTeam.status === 'complete' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {myTeam.status === 'complete' ? 'Complete' : 'Forming'}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/teams/${myTeam.id}`)}
                    className="bg-modex-secondary text-white px-4 py-2 rounded-lg font-bold hover:bg-modex-primary transition-colors"
                  >
                    Manage Team
                  </button>
                </div>

                <div className="mb-6">
                  <h4 className="font-bold text-modex-primary mb-3">Team Members ({myTeam.members.length}/{myTeam.max_members})</h4>
                  <div className="space-y-3">
                    {myTeam.members.map((member) => {
                      // Helper to capitalize role
                      const displayRole = member.team_role 
                        ? member.team_role.charAt(0).toUpperCase() + member.team_role.slice(1).toLowerCase()
                        : '';
                      
                      return (
                      <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="bg-gradient-to-br from-modex-secondary to-modex-accent w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {member.user_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-modex-primary">{member.user_name}</p>
                            {member.user_id === myTeam.leader_id && (
                              <span className="text-xs text-modex-accent font-bold">Team Leader</span>
                            )}
                          </div>
                        </div>
                        {member.user_id === myTeam.leader_id ? (
                          <span className="bg-modex-accent/20 text-modex-accent px-3 py-1 rounded-full text-sm font-bold">
                            CFO
                          </span>
                        ) : member.team_role ? (
                          <span className="bg-modex-secondary/10 text-modex-secondary px-3 py-1 rounded-full text-sm font-bold">
                            {displayRole}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm italic">No role assigned</span>
                        )}
                      </div>
                      );
                    })}
                  </div>
                </div>

                {myTeam.members.length < myTeam.max_members && (
                  <div className="bg-modex-light p-4 rounded-lg">
                    <p className="text-sm text-modex-primary font-semibold mb-2">
                      <Users className="w-4 h-4 inline-block mr-1" />
                      Team needs {myTeam.max_members - myTeam.members.length} more member{myTeam.max_members - myTeam.members.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-600">Share your team ID with others: <span className="font-mono bg-white px-2 py-1 rounded">{myTeam.id}</span></p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
