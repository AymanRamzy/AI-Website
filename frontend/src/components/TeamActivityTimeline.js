/**
 * TeamActivityTimeline - Activity timeline for teams
 * Phase 6: Admin Observer Mode
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Activity,
  UserPlus,
  UserCheck,
  UserX,
  UserMinus,
  Upload,
  Lock,
  Award,
  Trophy,
  MessageSquare,
  Settings,
  Loader,
  RefreshCw
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const EVENT_CONFIG = {
  team_created: { icon: Activity, color: 'bg-blue-500', label: 'Team Created' },
  member_joined: { icon: UserPlus, color: 'bg-green-500', label: 'Member Joined' },
  member_approved: { icon: UserCheck, color: 'bg-green-600', label: 'Member Approved' },
  member_rejected: { icon: UserX, color: 'bg-red-500', label: 'Member Rejected' },
  member_removed: { icon: UserMinus, color: 'bg-red-600', label: 'Member Removed' },
  member_left: { icon: UserMinus, color: 'bg-orange-500', label: 'Member Left' },
  role_changed: { icon: Settings, color: 'bg-purple-500', label: 'Role Changed' },
  submission_uploaded: { icon: Upload, color: 'bg-modex-secondary', label: 'Submission Uploaded' },
  submission_replaced: { icon: RefreshCw, color: 'bg-yellow-500', label: 'Submission Replaced' },
  submission_locked: { icon: Lock, color: 'bg-gray-600', label: 'Submission Locked' },
  scoring_started: { icon: Award, color: 'bg-indigo-500', label: 'Scoring Started' },
  scoring_completed: { icon: Award, color: 'bg-indigo-600', label: 'Scoring Completed' },
  results_published: { icon: Trophy, color: 'bg-yellow-600', label: 'Results Published' },
  chat_message: { icon: MessageSquare, color: 'bg-gray-500', label: 'Chat Message' },
  settings_changed: { icon: Settings, color: 'bg-gray-600', label: 'Settings Changed' },
  leader_transferred: { icon: UserCheck, color: 'bg-purple-600', label: 'Leadership Transferred' }
};

function TeamActivityTimeline({ teamId, isAdmin = false }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (teamId) {
      loadActivities();
    }
  }, [teamId]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const endpoint = isAdmin
        ? `${API_URL}/api/admin/teams/${teamId}/activity`
        : `${API_URL}/api/cfo/teams/${teamId}/activity`;
      
      const response = await axios.get(endpoint, { withCredentials: true });
      setActivities(response.data || []);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('Failed to load activity timeline');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-modex-secondary" />
          Activity Timeline
        </h3>
        <button
          onClick={loadActivities}
          className="text-gray-500 hover:text-modex-secondary transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No activity recorded yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          <div className="space-y-4">
            {activities.map((activity, index) => {
              const config = EVENT_CONFIG[activity.event_type] || {
                icon: Activity,
                color: 'bg-gray-500',
                label: activity.event_type
              };
              const Icon = config.icon;

              return (
                <div key={activity.id || index} className="relative flex items-start pl-10">
                  {/* Icon */}
                  <div className={`absolute left-0 w-8 h-8 rounded-full ${config.color} flex items-center justify-center`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{config.label}</span>
                      <span className="text-xs text-gray-500">{formatTime(activity.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      by {activity.actor_name || 'System'}
                    </p>
                    {activity.event_data && Object.keys(activity.event_data).length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        {activity.event_data.task_title && (
                          <span>Task: {activity.event_data.task_title}</span>
                        )}
                        {activity.event_data.applicant_name && (
                          <span>User: {activity.event_data.applicant_name}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamActivityTimeline;
