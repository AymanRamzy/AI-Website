/**
 * TeamAppealsView - View team's score appeals
 * Phase 8: Judging & Fairness
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Scale,
  RefreshCw,
  Loader,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    label: 'Pending Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    bgGradient: 'from-yellow-500 to-orange-500'
  },
  under_review: {
    icon: Scale,
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    bgGradient: 'from-blue-500 to-indigo-500'
  },
  upheld: {
    icon: CheckCircle,
    label: 'Upheld (Score Maintained)',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    bgGradient: 'from-gray-500 to-gray-600'
  },
  adjusted: {
    icon: CheckCircle,
    label: 'Adjusted',
    color: 'bg-green-100 text-green-800 border-green-200',
    bgGradient: 'from-green-500 to-emerald-500'
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    bgGradient: 'from-red-500 to-rose-500'
  }
};

function TeamAppealsView({ teamId, competitionId }) {
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedAppeal, setExpandedAppeal] = useState(null);

  useEffect(() => {
    if (teamId && competitionId) {
      loadAppeals();
    }
  }, [teamId, competitionId]);

  const loadAppeals = async () => {
    setLoading(true);
    try {
      // Using the admin endpoint but filtering by team - in production you'd have a team-specific endpoint
      const response = await axios.get(
        `${API_URL}/api/cfo/teams/${teamId}/appeals`,
        { withCredentials: true }
      );
      setAppeals(response.data || []);
    } catch (err) {
      console.error('Failed to load appeals:', err);
      // Try alternative endpoint
      try {
        const altResponse = await axios.get(
          `${API_URL}/api/admin/competitions/${competitionId}/appeals`,
          { withCredentials: true }
        );
        // Filter by team
        const teamAppeals = (altResponse.data || []).filter(a => a.team_id === teamId);
        setAppeals(teamAppeals);
      } catch (e) {
        setError('Unable to load appeals');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (appealId) => {
    setExpandedAppeal(expandedAppeal === appealId ? null : appealId);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader className="w-6 h-6 animate-spin text-modex-secondary mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (appeals.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <Scale className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No appeals submitted</p>
        <p className="text-sm text-gray-400 mt-2">
          Appeals can be submitted for scored submissions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center">
          <Scale className="w-5 h-5 mr-2 text-modex-secondary" />
          Score Appeals ({appeals.length})
        </h3>
        <button
          onClick={loadAppeals}
          className="text-gray-500 hover:text-modex-secondary transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {appeals.map(appeal => {
        const config = STATUS_CONFIG[appeal.appeal_status] || STATUS_CONFIG.pending;
        const StatusIcon = config.icon;
        const isExpanded = expandedAppeal === appeal.id;

        return (
          <div
            key={appeal.id}
            className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden"
          >
            {/* Appeal Header */}
            <button
              onClick={() => toggleExpand(appeal.id)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${config.bgGradient} flex items-center justify-center mr-4`}>
                  <StatusIcon className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-800">
                    Submission Appeal
                  </p>
                  <p className="text-sm text-gray-500">
                    Submitted {formatDate(appeal.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                  {config.label}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-6 pb-6 border-t border-gray-200">
                {/* Score Info */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Original Score</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {appeal.original_score?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                  {appeal.adjusted_score && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm text-green-600">Adjusted Score</p>
                      <p className="text-2xl font-bold text-green-700">
                        {appeal.adjusted_score.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Appeal Reason */}
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-600 mb-2">Your Appeal Reason:</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {appeal.appeal_reason}
                    </p>
                  </div>
                </div>

                {/* Review Notes (if reviewed) */}
                {appeal.review_notes && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">Review Notes:</p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 whitespace-pre-wrap">
                        {appeal.review_notes}
                      </p>
                      {appeal.reviewed_at && (
                        <p className="text-xs text-blue-600 mt-2">
                          Reviewed on {formatDate(appeal.reviewed_at)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Explanation */}
                {['pending', 'under_review'].includes(appeal.appeal_status) && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                      <Clock className="w-4 h-4 inline-block mr-1" />
                      Your appeal is being reviewed. You will be notified once a decision is made.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default TeamAppealsView;
