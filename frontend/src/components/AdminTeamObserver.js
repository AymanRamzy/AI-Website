/**
 * AdminTeamObserver - Admin read-only view of team details
 * Phase 6: Admin Observer Mode
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Eye,
  Users,
  FileText,
  MessageSquare,
  Activity,
  Award,
  AlertCircle,
  Loader,
  ExternalLink,
  Shield,
  Clock
} from 'lucide-react';
import TeamActivityTimeline from './TeamActivityTimeline';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function AdminTeamObserver({ teamId, onClose }) {
  const [teamData, setTeamData] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (teamId) {
      loadTeamData();
    }
  }, [teamId]);

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/teams/${teamId}/full-view`,
        { withCredentials: true }
      );
      setTeamData(response.data);
    } catch (err) {
      console.error('Failed to load team data:', err);
      setError('Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const loadChat = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/teams/${teamId}/chat`,
        { withCredentials: true }
      );
      setChatMessages(response.data.messages || []);
    } catch (err) {
      console.error('Failed to load chat:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'chat' && teamId) {
      loadChat();
    }
  }, [activeTab, teamId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8">
          <Loader className="w-8 h-8 animate-spin text-modex-secondary mx-auto" />
          <p className="mt-4 text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-800">{error}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Users },
    { id: 'submissions', label: 'Submissions', icon: FileText },
    { id: 'chat', label: 'Chat (Read-Only)', icon: MessageSquare },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'scores', label: 'Scores', icon: Award }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-6 h-6 mr-3" />
              <div>
                <h2 className="font-bold text-lg">
                  Admin Observer: {teamData?.team?.team_name}
                </h2>
                <p className="text-sm opacity-80">
                  {teamData?.team?.competitions?.title || 'Competition'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="bg-white/20 px-3 py-1 rounded-full text-sm flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                View Logged
              </span>
              <button
                onClick={onClose}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 px-4 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-medium flex items-center whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Members</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {teamData?.members?.length || 0}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600 font-medium">Submissions</p>
                  <p className="text-2xl font-bold text-green-800">
                    {(teamData?.submissions?.task_based?.length || 0) +
                      (teamData?.submissions?.legacy?.length || 0)}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600 font-medium">Scores</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {teamData?.scores?.length || 0}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 mb-3">Team Members</h4>
                <div className="space-y-2">
                  {(teamData?.members || []).map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-modex-secondary/20 flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-modex-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">
                            {member.user_profiles?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.user_profiles?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          member.role === 'leader'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {member.role}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          member.approval_status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {member.approval_status || 'approved'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Submissions Tab */}
          {activeTab === 'submissions' && (
            <div className="space-y-4">
              <h4 className="font-bold text-gray-800">Task Submissions</h4>
              {(teamData?.submissions?.task_based || []).length === 0 ? (
                <p className="text-gray-500 py-4">No task submissions</p>
              ) : (
                <div className="space-y-3">
                  {(teamData?.submissions?.task_based || []).map(sub => (
                    <div key={sub.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            {sub.tasks?.title || `Task (Level ${sub.level})`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {sub.file_name}
                          </p>
                          <p className="text-xs text-gray-400 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(sub.submitted_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            sub.status === 'locked'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {sub.status}
                          </span>
                          {sub.file_url && (
                            <a
                              href={sub.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Chat Tab (Read-Only) */}
          {activeTab === 'chat' && (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center">
                <Eye className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 text-sm">
                  This is a read-only view. Admin cannot send messages.
                </span>
              </div>
              
              <div className="border border-gray-200 rounded-lg h-[400px] overflow-y-auto p-4">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No messages</p>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className="flex items-start">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3 flex-shrink-0">
                          <Users className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800 text-sm">
                              {msg.user_profiles?.full_name || 'User'}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              {new Date(msg.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mt-1">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <TeamActivityTimeline teamId={teamId} isAdmin={true} />
          )}

          {/* Scores Tab */}
          {activeTab === 'scores' && (
            <div className="space-y-4">
              <h4 className="font-bold text-gray-800">Submission Scores</h4>
              {(teamData?.scores || []).length === 0 ? (
                <p className="text-gray-500 py-4">No scores recorded</p>
              ) : (
                <div className="space-y-3">
                  {(teamData?.scores || []).map((score, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800">Submission Score</span>
                        <span className="text-2xl font-bold text-modex-secondary">
                          {score.weighted_total?.toFixed(2) || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminTeamObserver;
