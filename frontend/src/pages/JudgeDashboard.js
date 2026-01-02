/**
 * JudgeDashboard - Judge interface for scoring submissions
 * PHASE 2-4: Criteria-based weighted scoring system
 * PHASE 8: Blind judging, lock state, enhanced scoring
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ClipboardList,
  Star,
  CheckCircle,
  AlertCircle,
  Loader,
  ArrowLeft,
  FileText,
  Users,
  Award,
  Save,
  Send,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Lock,
  Unlock,
  EyeOff,
  Eye
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function JudgeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState([]);
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [scores, setScores] = useState({});
  const [feedback, setFeedback] = useState({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedSubmissions, setExpandedSubmissions] = useState({});
  const [blindJudging, setBlindJudging] = useState(false);
  const [scoringLocked, setScoringLocked] = useState(false);

  useEffect(() => {
    // Verify judge role
    if (user && user.role !== 'judge' && user.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadAssignedCompetitions();
  }, [user, navigate]);

  const loadAssignedCompetitions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/cfo/judge/competitions`, {
        withCredentials: true
      });
      setCompetitions(response.data || []);
    } catch (err) {
      console.error('Failed to load competitions:', err);
      // Fallback: load all competitions for admin
      if (user?.role === 'admin') {
        try {
          const fallback = await axios.get(`${API_URL}/api/admin/competitions`, {
            withCredentials: true
          });
          setCompetitions(fallback.data || []);
        } catch (e) {
          setError('Failed to load competitions');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async (competitionId) => {
    setLoading(true);
    try {
      const [subResponse, criteriaResponse] = await Promise.all([
        axios.get(`${API_URL}/api/cfo/judge/competitions/${competitionId}/submissions`, {
          withCredentials: true
        }),
        axios.get(`${API_URL}/api/cfo/judge/competitions/${competitionId}/criteria`, {
          withCredentials: true
        })
      ]);
      setSubmissions(subResponse.data || []);
      setCriteria(criteriaResponse.data || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const selectCompetition = (comp) => {
    setSelectedCompetition(comp);
    setSelectedSubmission(null);
    setScores({});
    setFeedback({});
    setOverallFeedback('');
    // Check for blind judging and scoring lock settings
    setBlindJudging(comp.blind_judging_enabled || false);
    setScoringLocked(comp.scoring_locked || comp.submissions_locked || false);
    loadSubmissions(comp.id);
  };

  const selectSubmission = async (submission) => {
    setSelectedSubmission(submission);
    setError('');
    setSuccess('');
    
    // Load existing scores if any
    try {
      const response = await axios.get(
        `${API_URL}/api/cfo/judge/submissions/${submission.id}/my-scores`,
        { withCredentials: true }
      );
      if (response.data) {
        const existingScores = {};
        const existingFeedback = {};
        (response.data.criteria_scores || []).forEach(s => {
          existingScores[s.criterion_id] = s.score;
          existingFeedback[s.criterion_id] = s.feedback || '';
        });
        setScores(existingScores);
        setFeedback(existingFeedback);
        setOverallFeedback(response.data.overall_feedback || '');
      }
    } catch (err) {
      // No existing scores - start fresh
      setScores({});
      setFeedback({});
      setOverallFeedback('');
    }
  };

  const updateScore = (criterionId, value) => {
    const numValue = Math.max(0, Math.min(100, Number(value) || 0));
    setScores(prev => ({ ...prev, [criterionId]: numValue }));
  };

  const updateFeedback = (criterionId, text) => {
    setFeedback(prev => ({ ...prev, [criterionId]: text }));
  };

  const calculateWeightedTotal = () => {
    let total = 0;
    criteria.forEach(c => {
      const score = scores[c.id] || 0;
      total += score * (c.weight / 100);
    });
    return total.toFixed(2);
  };

  const handleSaveScores = async (isFinal = false) => {
    if (!selectedSubmission) return;
    
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const criteriaScores = criteria.map(c => ({
        criterion_id: c.id,
        score: scores[c.id] || 0,
        feedback: feedback[c.id] || ''
      }));

      await axios.post(
        `${API_URL}/api/cfo/judge/submissions/${selectedSubmission.id}/scores`,
        {
          criteria_scores: criteriaScores,
          overall_feedback: overallFeedback,
          is_final: isFinal
        },
        { withCredentials: true }
      );

      setSuccess(isFinal ? 'Final scores submitted!' : 'Scores saved as draft');
      
      // Refresh submissions to update status
      if (selectedCompetition) {
        loadSubmissions(selectedCompetition.id);
      }
    } catch (err) {
      console.error('Failed to save scores:', err);
      setError(err.response?.data?.detail || 'Failed to save scores');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpanded = (submissionId) => {
    setExpandedSubmissions(prev => ({
      ...prev,
      [submissionId]: !prev[submissionId]
    }));
  };

  const getSubmissionStatusBadge = (submission) => {
    if (submission.my_score_status === 'final') {
      return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">Scored</span>;
    }
    if (submission.my_score_status === 'draft') {
      return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Draft</span>;
    }
    return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">Pending</span>;
  };

  if (loading && competitions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader className="w-8 h-8 animate-spin text-modex-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-modex-secondary hover:text-modex-primary mr-4">
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <h1 className="text-2xl font-bold text-modex-primary">
                Mod<span className="text-modex-secondary">EX</span> Judge Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">{user?.full_name}</span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                Judge
              </span>
              <button onClick={logout} className="text-gray-500 hover:text-gray-700">Logout</button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Left Panel - Competition & Submissions List */}
          <div className="col-span-4">
            {/* Competition Selector */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-4 mb-4">
              <h3 className="font-bold text-gray-800 mb-3">Assigned Competitions</h3>
              {competitions.length === 0 ? (
                <p className="text-gray-500 text-sm">No competitions assigned</p>
              ) : (
                <div className="space-y-2">
                  {competitions.map(comp => (
                    <button
                      key={comp.id}
                      onClick={() => selectCompetition(comp)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedCompetition?.id === comp.id
                          ? 'bg-modex-secondary text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="font-semibold">{comp.title}</div>
                      <div className={`text-xs ${selectedCompetition?.id === comp.id ? 'opacity-80' : 'text-gray-500'}`}>
                        Level {comp.current_level || 1}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Submissions List */}
            {selectedCompetition && (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-4">
                <h3 className="font-bold text-gray-800 mb-3">Submissions to Review</h3>
                {loading ? (
                  <div className="text-center py-4">
                    <Loader className="w-6 h-6 animate-spin text-modex-secondary mx-auto" />
                  </div>
                ) : submissions.length === 0 ? (
                  <p className="text-gray-500 text-sm">No submissions to review</p>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {submissions.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => selectSubmission(sub)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors border ${
                          selectedSubmission?.id === sub.id
                            ? 'border-modex-secondary bg-modex-secondary/5'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-gray-800">{sub.team_name || 'Team'}</div>
                            <div className="text-xs text-gray-500">
                              {sub.task_title || `Task ${sub.task_id?.slice(0, 8)}`}
                            </div>
                          </div>
                          {getSubmissionStatusBadge(sub)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Scoring Form */}
          <div className="col-span-8">
            {!selectedSubmission ? (
              <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center">
                <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-600 mb-2">Select a Submission</h3>
                <p className="text-gray-500">
                  Choose a competition and submission from the left panel to start scoring
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                {/* Submission Header */}
                <div className="bg-gradient-to-r from-modex-secondary to-modex-accent text-white px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{selectedSubmission.team_name || 'Team Submission'}</h3>
                      <p className="text-sm opacity-90">{selectedSubmission.task_title || 'Task'}</p>
                    </div>
                    {selectedSubmission.file_url && (
                      <a
                        href={selectedSubmission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View File
                      </a>
                    )}
                  </div>
                </div>

                {/* Scoring Form */}
                <div className="p-6">
                  {/* Weighted Total Display */}
                  <div className="bg-modex-light rounded-xl p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">Weighted Total Score</span>
                      <span className="text-3xl font-bold text-modex-secondary">
                        {calculateWeightedTotal()}
                        <span className="text-lg text-gray-500">/100</span>
                      </span>
                    </div>
                  </div>

                  {/* Criteria Scoring */}
                  <div className="space-y-4 mb-6">
                    {criteria.map(c => (
                      <div key={c.id} className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleExpanded(c.id)}
                          className="w-full px-4 py-3 bg-gray-50 flex justify-between items-center hover:bg-gray-100"
                        >
                          <div className="flex items-center">
                            <Star className="w-5 h-5 text-yellow-500 mr-2" />
                            <span className="font-semibold text-gray-800">{c.name}</span>
                            <span className="ml-2 text-sm text-gray-500">({c.weight}%)</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-lg font-bold text-modex-secondary mr-3">
                              {scores[c.id] || 0}
                            </span>
                            {expandedSubmissions[c.id] ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </button>
                        
                        {expandedSubmissions[c.id] && (
                          <div className="p-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-3">{c.description}</p>
                            <div className="mb-3">
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Score (0-100)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={scores[c.id] || ''}
                                onChange={(e) => updateScore(c.id, e.target.value)}
                                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-700 block mb-1">
                                Feedback (optional)
                              </label>
                              <textarea
                                value={feedback[c.id] || ''}
                                onChange={(e) => updateFeedback(c.id, e.target.value)}
                                placeholder="Provide specific feedback for this criterion..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none resize-none"
                                rows="2"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Overall Feedback */}
                  <div className="mb-6">
                    <label className="font-semibold text-gray-700 block mb-2">
                      Overall Feedback
                    </label>
                    <textarea
                      value={overallFeedback}
                      onChange={(e) => setOverallFeedback(e.target.value)}
                      placeholder="Provide overall comments and recommendations for the team..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none resize-none"
                      rows="4"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => handleSaveScores(false)}
                      disabled={submitting}
                      className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 flex items-center"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </button>
                    <button
                      onClick={() => handleSaveScores(true)}
                      disabled={submitting}
                      className="px-6 py-3 bg-modex-secondary text-white rounded-lg font-semibold hover:bg-modex-primary disabled:opacity-50 flex items-center"
                    >
                      {submitting ? (
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Submit Final Scores
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default JudgeDashboard;
