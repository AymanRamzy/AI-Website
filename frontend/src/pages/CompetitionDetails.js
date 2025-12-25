import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Trophy,
  Calendar,
  Users,
  Clock,
  Award,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  UserPlus,
  PlusCircle,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function CompetitionDetails() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { competitionId } = useParams();
  const [competition, setCompetition] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [applicationCount, setApplicationCount] = useState(0);

  useEffect(() => {
    loadCompetitionData();
  }, [competitionId]);

  // Fetch application count for admins
  useEffect(() => {
    const fetchApplicationCount = async () => {
      if (user?.role === 'admin' && competitionId) {
        try {
          const response = await axios.get(
            `${API_URL}/api/admin/competitions/${competitionId}/cfo-applications`
          );
          setApplicationCount(response.data?.total_count || 0);
        } catch (err) {
          console.error('Failed to fetch application count:', err);
        }
      }
    };
    fetchApplicationCount();
  }, [user, competitionId]);

  const loadCompetitionData = async () => {
    try {
      // Load competition details
      const compResponse = await axios.get(`${API_URL}/api/cfo/competitions/${competitionId}`);
      setCompetition(compResponse.data);

      // Check if user is registered
      try {
        const regResponse = await axios.get(
          `${API_URL}/api/cfo/competitions/${competitionId}/is-registered`
        );
        setIsRegistered(regResponse.data.is_registered);
      } catch (error) {
        console.error('Failed to check registration:', error);
      }
    } catch (error) {
      console.error('Failed to load competition:', error);
      setError('Failed to load competition details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      navigate('/signin', { state: { from: `/competitions/${competitionId}` } });
      return;
    }

    setRegistering(true);
    setError('');

    try {
      const response = await axios.post(`${API_URL}/api/cfo/competitions/${competitionId}/register`);
      if (response.data?.success) {
        setSuccessMessage('Successfully registered for competition!');
        setIsRegistered(true);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Failed to register:', error);
      if (error.response?.status === 401) {
        setError('Please sign in to register for this competition.');
        setTimeout(() => navigate('/signin', { state: { from: `/competitions/${competitionId}` } }), 2000);
      } else if (error.response?.status === 409) {
        setError('You are already registered for this competition.');
        setIsRegistered(true);
      } else if (error.response?.status === 403) {
        setError('Registration is not open for this competition.');
      } else if (error.response?.data?.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to register for competition. Please try again.');
      }
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'TBD';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isRegistrationOpen = () => {
    if (!competition) return false;
    if (competition.status !== 'open') return false;
    return true;
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800',
      open: 'bg-green-100 text-green-800',
      closed: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
      draft: 'Draft',
      open: 'open',
      closed: 'Closed',
    };

    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-bold ${
          statusColors[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
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

  if (!competition) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Competition Not Found</h2>
          <p className="text-gray-600 mb-6">
            The competition you're looking for doesn't exist.
          </p>
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
            <h1 className="text-2xl font-bold text-modex-primary">Competition Details</h1>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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

        {/* Competition Header */}
        <div className="bg-white rounded-xl p-8 border-2 border-modex-secondary/20 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-start">
              <div className="bg-gradient-to-br from-modex-secondary to-modex-accent p-4 rounded-xl mr-4">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-modex-primary mb-2">
                  {competition.title}
                </h2>
                {getStatusBadge(competition.status)}
              </div>
            </div>
            {isRegistered && (
              <div className="bg-green-50 border-2 border-green-200 px-4 py-2 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-bold">Registered</span>
              </div>
            )}
          </div>

          <p className="text-gray-700 text-lg mb-6">{competition.description}</p>

          {/* Key Info Grid */}
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-modex-light p-4 rounded-lg">
              <div className="flex items-center text-modex-primary mb-2">
                <Calendar className="w-5 h-5 mr-2" />
                <span className="font-bold">Registration Deadline</span>
              </div>
              <p className="text-gray-800 font-semibold">
                {formatDate(competition.registration_end)}
              </p>
            </div>

            <div className="bg-modex-light p-4 rounded-lg">
              <div className="flex items-center text-modex-primary mb-2">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-bold">Competition Duration</span>
              </div>
              <p className="text-gray-800 text-sm font-semibold">
                {formatDate(competition.competition_start)} - {formatDate(competition.competition_end)}
              </p>
            </div>

            <div className="bg-modex-light p-4 rounded-lg">
              <div className="flex items-center text-modex-primary mb-2">
                <Users className="w-5 h-5 mr-2" />
                <span className="font-bold">Teams</span>
              </div>
              <p className="text-gray-800 font-semibold">
                /{competition.max_teams} teams registered
              </p>
            </div>
          </div>

          {/* Competition Rules/Info */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-xl font-bold text-modex-primary mb-4 flex items-center">
              <Award className="w-6 h-6 mr-2" />
              Competition Information
            </h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start">
                <span className="text-modex-accent mr-2">•</span>
                <p>Maximum {competition.max_teams} teams allowed</p>
              </div>
              <div className="flex items-start">
                <span className="text-modex-accent mr-2">•</span>
                <p>Each team can have up to 5 members</p>
              </div>
              <div className="flex items-start">
                <span className="text-modex-accent mr-2">•</span>
                <p>Team roles: Leader, Analyst, Designer, Strategist, Communicator</p>
              </div>
              <div className="flex items-start">
                <span className="text-modex-accent mr-2">•</span>
                <p>
                  Registration closes on {formatDate(competition.registration_end)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
          {!isRegistered ? (
            <div>
              <h3 className="text-xl font-bold text-modex-primary mb-4">
                Ready to participate?
              </h3>
              <p className="text-gray-600 mb-6">
                Register for this competition to create or join a team
              </p>
              <button
                onClick={handleRegister}
                disabled={registering || !isRegistrationOpen()}
                className="w-full bg-modex-accent text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-modex-primary transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {registering ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Registering...
                  </>
                ) : !isRegistrationOpen() ? (
                  'Registration Not Open'
                ) : !user ? (
                  'Sign In to Register'
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Register for Competition
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold text-modex-primary mb-4">
                You're registered! What's next?
              </h3>
              <p className="text-gray-600 mb-6">
                Create your own team or join an existing one
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/teams/create')}
                  className="bg-modex-accent text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-modex-primary transition-colors flex items-center justify-center"
                >
                  <PlusCircle className="w-5 h-5 mr-2" />
                  Create Team
                </button>
                <button
                  onClick={() => navigate('/teams/join')}
                  className="bg-modex-secondary text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-modex-primary transition-colors flex items-center justify-center"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Join Team
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Admin Actions - Single View Applications Button - v2 */}
        {user?.role === 'admin' && (
          <div className="mt-6 bg-white rounded-xl p-6 border-2 border-modex-secondary/30">
            <h3 className="text-xl font-bold text-modex-primary mb-4 flex items-center">
              <Award className="w-6 h-6 mr-2" />
              Admin Actions
            </h3>
            <button
              onClick={() => navigate(`/competitions/${competitionId}/applications`)}
              className="w-full bg-modex-secondary text-white px-6 py-4 rounded-lg font-bold text-lg hover:bg-modex-primary transition-colors flex items-center justify-center"
            >
              <Award className="w-5 h-5 mr-2" />
              View Applications ({applicationCount})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default CompetitionDetails;
