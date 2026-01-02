/**
 * TeamLevelTasks - Participant view of level-based tasks
 * PHASE 2-4: Display tasks by level with file upload
 */
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  FileText,
  FileSpreadsheet,
  Video,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader,
  Clock,
  Lock,
  ExternalLink,
  Send
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const LEVEL_CONFIG = {
  1: { name: 'Level 1', color: 'bg-blue-500', bgLight: 'bg-blue-50' },
  2: { name: 'Level 2 - Financial Modeling', color: 'bg-green-500', bgLight: 'bg-green-50' },
  3: { name: 'Level 3 - Strategic Decision', color: 'bg-yellow-500', bgLight: 'bg-yellow-50' },
  4: { name: 'Level 4 - Video Presentation', color: 'bg-purple-500', bgLight: 'bg-purple-50' }
};

function TeamLevelTasks({ teamId, competition }) {
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRefs = useRef({});

  const currentLevel = competition?.current_level || 1;

  useEffect(() => {
    if (competition?.id && teamId) {
      loadTasks();
    }
  }, [competition?.id, teamId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const [tasksRes, submissionsRes] = await Promise.all([
        axios.get(`${API_URL}/api/cfo/competitions/${competition.id}/tasks`, { withCredentials: true }),
        axios.get(`${API_URL}/api/cfo/teams/${teamId}/submissions`, { withCredentials: true }).catch(() => ({ data: [] }))
      ]);
      
      setTasks(tasksRes.data || []);
      
      // Index submissions by task_id
      const subMap = {};
      (submissionsRes.data || []).forEach(sub => {
        subMap[sub.task_id] = sub;
      });
      setSubmissions(subMap);
    } catch (err) {
      console.error('Failed to load tasks:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (taskId, file) => {
    if (!file) return;
    
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedTypes = task.allowed_file_types || ['pdf', 'xlsx', 'docx'];
    
    if (!allowedTypes.includes(ext)) {
      setError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      return;
    }

    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit');
      return;
    }

    setUploading(prev => ({ ...prev, [taskId]: true }));
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('task_id', taskId);

      const response = await axios.post(
        `${API_URL}/api/cfo/teams/${teamId}/submissions/task`,
        formData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setSubmissions(prev => ({ ...prev, [taskId]: response.data }));
      setSuccess(`Submitted: ${task.title}`);
      
      // Clear file input
      if (fileInputRefs.current[taskId]) {
        fileInputRefs.current[taskId].value = '';
      }
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.detail || 'Failed to submit file');
    } finally {
      setUploading(prev => ({ ...prev, [taskId]: false }));
    }
  };

  const getFileIcon = (fileTypes) => {
    if (fileTypes?.includes('mp4') || fileTypes?.includes('mov')) return Video;
    if (fileTypes?.includes('xlsx') || fileTypes?.includes('xlsm')) return FileSpreadsheet;
    return FileText;
  };

  const getAcceptString = (fileTypes) => {
    return (fileTypes || ['pdf', 'xlsx', 'docx']).map(t => `.${t}`).join(',');
  };

  const formatDeadline = (deadline) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const now = new Date();
    const isPast = d < now;
    return {
      text: d.toLocaleString(),
      isPast
    };
  };

  const getTasksByLevel = (level) => tasks.filter(t => t.level === level);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader className="w-8 h-8 animate-spin text-modex-secondary mx-auto" />
        <p className="text-gray-500 mt-2">Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* Current Level Indicator */}
      <div className={`${LEVEL_CONFIG[currentLevel]?.bgLight || 'bg-gray-50'} rounded-xl p-4`}>
        <div className="flex items-center">
          <span className={`inline-block w-3 h-3 rounded-full ${LEVEL_CONFIG[currentLevel]?.color || 'bg-gray-500'} mr-3`}></span>
          <span className="font-bold text-gray-800">
            Currently Active: {LEVEL_CONFIG[currentLevel]?.name || `Level ${currentLevel}`}
          </span>
        </div>
      </div>

      {/* Tasks by Level */}
      {[2, 3, 4].map(level => {
        const levelTasks = getTasksByLevel(level);
        const isActive = level === currentLevel;
        const isLocked = level > currentLevel;

        if (levelTasks.length === 0) return null;

        return (
          <div key={level} className={`rounded-xl border-2 overflow-hidden ${
            isActive ? 'border-modex-secondary' : 'border-gray-200'
          }`}>
            {/* Level Header */}
            <div className={`px-6 py-4 ${LEVEL_CONFIG[level]?.bgLight || 'bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-gray-800 flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full ${LEVEL_CONFIG[level]?.color} mr-3`}></span>
                  {LEVEL_CONFIG[level]?.name || `Level ${level}`}
                </h3>
                {isLocked && (
                  <span className="flex items-center text-gray-500 text-sm">
                    <Lock className="w-4 h-4 mr-1" />
                    Locked
                  </span>
                )}
                {isActive && (
                  <span className="bg-modex-secondary text-white px-3 py-1 rounded-full text-sm font-bold">
                    Active
                  </span>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="p-6 space-y-4">
              {levelTasks.map(task => {
                const submission = submissions[task.id];
                const FileIcon = getFileIcon(task.allowed_file_types);
                const deadline = formatDeadline(task.deadline);
                const canSubmit = isActive && !deadline?.isPast && !submission?.is_final;

                return (
                  <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-lg">{task.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                      </div>
                      {submission && (
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Submitted
                        </span>
                      )}
                    </div>

                    {/* Task Metadata */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <FileIcon className="w-4 h-4 mr-1" />
                        Accepts: {(task.allowed_file_types || ['pdf', 'xlsx']).join(', ')}
                      </div>
                      {deadline && (
                        <div className={`flex items-center ${deadline.isPast ? 'text-red-600' : ''}`}>
                          <Clock className="w-4 h-4 mr-1" />
                          Deadline: {deadline.text}
                        </div>
                      )}
                    </div>

                    {/* Level 3: Constraints & Assumptions */}
                    {task.level === 3 && (task.constraints_text || task.assumptions_policy) && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                        {task.constraints_text && (
                          <div className="mb-2">
                            <span className="font-semibold text-yellow-800">Constraints:</span>
                            <p className="text-yellow-700 text-sm">{task.constraints_text}</p>
                          </div>
                        )}
                        {task.assumptions_policy && (
                          <div>
                            <span className="font-semibold text-yellow-800">Assumptions Policy:</span>
                            <p className="text-yellow-700 text-sm">{task.assumptions_policy}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Level 4: Video Requirements */}
                    {task.level === 4 && task.requirements_text && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                        <span className="font-semibold text-purple-800">Video Requirements (5-10 min):</span>
                        <p className="text-purple-700 text-sm whitespace-pre-line">{task.requirements_text}</p>
                      </div>
                    )}

                    {/* Submission Status */}
                    {submission && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileIcon className="w-5 h-5 text-modex-secondary mr-2" />
                            <span className="text-sm text-gray-700">{submission.file_name || 'Submitted file'}</span>
                          </div>
                          {submission.file_url && (
                            <a
                              href={submission.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-modex-secondary hover:text-modex-primary flex items-center text-sm"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted: {new Date(submission.submitted_at).toLocaleString()}
                        </p>
                      </div>
                    )}

                    {/* Upload Section */}
                    {canSubmit ? (
                      <div>
                        <input
                          ref={el => fileInputRefs.current[task.id] = el}
                          type="file"
                          accept={getAcceptString(task.allowed_file_types)}
                          onChange={(e) => handleFileSelect(task.id, e.target.files?.[0])}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRefs.current[task.id]?.click()}
                          disabled={uploading[task.id]}
                          className="w-full py-3 bg-modex-secondary text-white rounded-lg font-semibold hover:bg-modex-primary disabled:opacity-50 flex items-center justify-center"
                        >
                          {uploading[task.id] ? (
                            <><Loader className="w-5 h-5 mr-2 animate-spin" /> Uploading...</>
                          ) : submission ? (
                            <><Upload className="w-5 h-5 mr-2" /> Replace Submission</>
                          ) : (
                            <><Send className="w-5 h-5 mr-2" /> Submit</>
                          )}
                        </button>
                      </div>
                    ) : isLocked ? (
                      <div className="text-center py-3 bg-gray-100 rounded-lg text-gray-500">
                        <Lock className="w-5 h-5 inline-block mr-2" />
                        Complete previous levels to unlock
                      </div>
                    ) : deadline?.isPast ? (
                      <div className="text-center py-3 bg-red-50 rounded-lg text-red-600">
                        <AlertCircle className="w-5 h-5 inline-block mr-2" />
                        Submission deadline passed
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No tasks available yet</p>
        </div>
      )}
    </div>
  );
}

export default TeamLevelTasks;
