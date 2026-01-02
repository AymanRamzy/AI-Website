/**
 * AdminAppealsPanel - Admin panel to view and resolve score appeals
 * Phase 8: Judging & Fairness
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Scale,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Loader,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  Search,
  Award,
  FileText,
  User,
  Calendar
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
  },
  under_review: {
    icon: Scale,
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    buttonColor: 'bg-blue-500 hover:bg-blue-600'
  },
  upheld: {
    icon: CheckCircle,
    label: 'Upheld',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    buttonColor: 'bg-gray-500'
  },
  adjusted: {
    icon: CheckCircle,
    label: 'Adjusted',
    color: 'bg-green-100 text-green-800 border-green-300',
    buttonColor: 'bg-green-500'
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-300',
    buttonColor: 'bg-red-500'
  }
};

function AdminAppealsPanel({ competitionId }) {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAppeal, setExpandedAppeal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Review modal state
  const [reviewingAppeal, setReviewingAppeal] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('upheld');
  const [adjustedScore, setAdjustedScore] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (competitionId) {
      loadAppeals();
    }
  }, [competitionId]);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/competitions/${competitionId}/appeals`,
        { withCredentials: true }
      );
      setAppeals(response.data || []);
    } catch (err) {
      console.error('Failed to load appeals:', err);
      setError('Failed to load appeals');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewAppeal = async () => {
    if (!reviewingAppeal) return;
    
    setSubmitting(true);
    try {
      const payload = {
        status: reviewDecision,
        review_notes: reviewNotes
      };
      
      if (reviewDecision === 'adjusted' && adjustedScore) {
        payload.adjusted_score = parseFloat(adjustedScore);
      }

      await axios.post(
        `${API_URL}/api/admin/appeals/${reviewingAppeal.id}/review`,
        payload,
        { withCredentials: true }
      );

      // Refresh appeals
      await loadAppeals();
      closeReviewModal();
    } catch (err) {
      console.error('Failed to review appeal:', err);
      setError(err.response?.data?.detail || 'Failed to review appeal');
    } finally {
      setSubmitting(false);
    }
  };

  const openReviewModal = (appeal) => {
    setReviewingAppeal(appeal);
    setReviewDecision('upheld');
    setAdjustedScore(appeal.original_score?.toString() || '');
    setReviewNotes('');
  };

  const closeReviewModal = () => {
    setReviewingAppeal(null);
    setReviewDecision('upheld');
    setAdjustedScore('');
    setReviewNotes('');
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  const filteredAppeals = appeals.filter(appeal => {
    // Status filter
    if (statusFilter !== 'all' && appeal.appeal_status !== statusFilter) {
      return false;
    }
    // Search filter
    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        appeal.team_name?.toLowerCase().includes(search) ||
        appeal.appeal_reason?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const pendingCount = appeals.filter(a => a.appeal_status === 'pending').length;
  const underReviewCount = appeals.filter(a => a.appeal_status === 'under_review').length;

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <Loader className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
        <p className="text-gray-400">Loading appeals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Appeals</div>
          <div className="text-2xl font-bold text-white">{appeals.length}</div>
        </div>
        <div className="bg-yellow-900/30 rounded-lg p-4 border border-yellow-700">
          <div className="text-sm text-yellow-400">Pending</div>
          <div className="text-2xl font-bold text-yellow-300">{pendingCount}</div>
        </div>
        <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-700">
          <div className="text-sm text-blue-400">Under Review</div>
          <div className="text-2xl font-bold text-blue-300">{underReviewCount}</div>
        </div>
        <div className="bg-green-900/30 rounded-lg p-4 border border-green-700">
          <div className="text-sm text-green-400">Resolved</div>
          <div className="text-2xl font-bold text-green-300">
            {appeals.length - pendingCount - underReviewCount}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search by team or reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="upheld">Upheld</option>
              <option value="adjusted">Adjusted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={loadAppeals}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Appeals List */}
      {filteredAppeals.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-12 text-center">
          <Scale className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2">No Appeals Found</h3>
          <p className="text-gray-500">
            {statusFilter !== 'all' 
              ? `No ${statusFilter} appeals to display`
              : 'No appeals have been submitted yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppeals.map(appeal => {
            const config = STATUS_CONFIG[appeal.appeal_status] || STATUS_CONFIG.pending;
            const StatusIcon = config.icon;
            const isExpanded = expandedAppeal === appeal.id;
            const canReview = ['pending', 'under_review'].includes(appeal.appeal_status);

            return (
              <div
                key={appeal.id}
                className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700"
              >
                {/* Appeal Header */}
                <div
                  className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-750"
                  onClick={() => setExpandedAppeal(isExpanded ? null : appeal.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full ${config.buttonColor} flex items-center justify-center`}>
                      <StatusIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white">{appeal.team_name || 'Team'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatDate(appeal.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-400">Original Score</div>
                      <div className="font-bold text-white">{appeal.original_score?.toFixed(2) || 'N/A'}</div>
                    </div>
                    {appeal.adjusted_score && (
                      <div className="text-right">
                        <div className="text-sm text-green-400">Adjusted</div>
                        <div className="font-bold text-green-300">{appeal.adjusted_score.toFixed(2)}</div>
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-700">
                    {/* Appeal Reason */}
                    <div className="mt-4">
                      <div className="text-sm font-medium text-gray-400 mb-2">Appeal Reason:</div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-300 whitespace-pre-wrap">{appeal.appeal_reason}</p>
                      </div>
                    </div>

                    {/* Review Notes (if exists) */}
                    {appeal.review_notes && (
                      <div className="mt-4">
                        <div className="text-sm font-medium text-blue-400 mb-2">Review Notes:</div>
                        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
                          <p className="text-blue-300 whitespace-pre-wrap">{appeal.review_notes}</p>
                          {appeal.reviewed_at && (
                            <p className="text-xs text-blue-400 mt-2">
                              Reviewed on {formatDate(appeal.reviewed_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {canReview && (
                      <div className="mt-6 flex justify-end space-x-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openReviewModal(appeal);
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium flex items-center"
                        >
                          <Scale className="w-4 h-4 mr-2" />
                          Review Appeal
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      {reviewingAppeal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Scale className="w-6 h-6 mr-3" />
                Review Appeal
              </h3>
              <p className="text-purple-200 text-sm mt-1">
                Team: {reviewingAppeal.team_name || 'Unknown'} • Original Score: {reviewingAppeal.original_score?.toFixed(2) || 'N/A'}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Appeal Summary */}
              <div className="bg-gray-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-2">Appeal Reason:</div>
                <p className="text-gray-300">{reviewingAppeal.appeal_reason}</p>
              </div>

              {/* Decision */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Decision</label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setReviewDecision('upheld')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      reviewDecision === 'upheld'
                        ? 'border-gray-400 bg-gray-700'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <CheckCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-300">Uphold</div>
                    <div className="text-xs text-gray-500">Keep original score</div>
                  </button>
                  <button
                    onClick={() => setReviewDecision('adjusted')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      reviewDecision === 'adjusted'
                        ? 'border-green-400 bg-green-900/30'
                        : 'border-gray-600 hover:border-green-500'
                    }`}
                  >
                    <Award className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <div className="text-sm font-medium text-green-300">Adjust</div>
                    <div className="text-xs text-gray-500">Modify the score</div>
                  </button>
                  <button
                    onClick={() => setReviewDecision('rejected')}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      reviewDecision === 'rejected'
                        ? 'border-red-400 bg-red-900/30'
                        : 'border-gray-600 hover:border-red-500'
                    }`}
                  >
                    <XCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <div className="text-sm font-medium text-red-300">Reject</div>
                    <div className="text-xs text-gray-500">Invalid appeal</div>
                  </button>
                </div>
              </div>

              {/* Adjusted Score (if adjusting) */}
              {reviewDecision === 'adjusted' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Adjusted Score <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={adjustedScore}
                    onChange={(e) => setAdjustedScore(e.target.value)}
                    placeholder="Enter new score (0-100)"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Review Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Review Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide explanation for your decision..."
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none resize-none"
                  rows="4"
                  required
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700">
                <button
                  onClick={closeReviewModal}
                  className="px-6 py-3 text-gray-400 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReviewAppeal}
                  disabled={submitting || !reviewNotes.trim() || (reviewDecision === 'adjusted' && !adjustedScore)}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitting ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAppealsPanel;
