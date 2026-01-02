/**
 * TeamApprovalManager - Team member approval workflow
 * Phase 6: Team Governance
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader,
  Mail
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function TeamApprovalManager({ teamId, isLeader }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (teamId && isLeader) {
      loadRequests();
    }
  }, [teamId, isLeader]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/cfo/teams/${teamId}/join-requests?status=pending`,
        { withCredentials: true }
      );
      setRequests(response.data || []);
    } catch (err) {
      console.error('Failed to load requests:', err);
      setError('Failed to load join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (requestId, status, notes = '') => {
    setProcessing(prev => ({ ...prev, [requestId]: true }));
    setError('');
    setSuccess('');

    try {
      await axios.post(
        `${API_URL}/api/cfo/teams/${teamId}/join-requests/${requestId}/review`,
        { status, review_notes: notes },
        { withCredentials: true }
      );
      
      setSuccess(`Request ${status}`);
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to ${status} request`);
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (!isLeader) {
    return null;
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <Loader className="w-6 h-6 animate-spin text-modex-secondary mx-auto" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
        <UserPlus className="w-5 h-5 mr-2 text-modex-secondary" />
        Pending Join Requests
        {requests.length > 0 && (
          <span className="ml-2 bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-sm">
            {requests.length}
          </span>
        )}
      </h3>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No pending join requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(request => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  {request.user_profiles?.avatar_url ? (
                    <img
                      src={request.user_profiles.avatar_url}
                      alt=""
                      className="w-12 h-12 rounded-full mr-4"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-modex-secondary/20 flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-modex-secondary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-800">
                      {request.user_profiles?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {request.user_profiles?.email}
                    </p>
                    <p className="text-xs text-gray-400 flex items-center mt-1">
                      <Clock className="w-3 h-3 mr-1" />
                      Requested {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleReview(request.id, 'approved')}
                    disabled={processing[request.id]}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50"
                  >
                    {processing[request.id] ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <><UserCheck className="w-4 h-4 mr-1" /> Approve</>
                    )}
                  </button>
                  <button
                    onClick={() => handleReview(request.id, 'rejected')}
                    disabled={processing[request.id]}
                    className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                  >
                    {processing[request.id] ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <><UserX className="w-4 h-4 mr-1" /> Reject</>
                    )}
                  </button>
                </div>
              </div>

              {request.message && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 italic">"{request.message}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TeamApprovalManager;
