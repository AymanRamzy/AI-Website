import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader,
  X,
  Send,
  FileSpreadsheet,
  Archive,
  Clock,
  Shield,
  Ban
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

/**
 * TeamSubmission - Submission Tab Component
 * Allows teams to upload and submit their solution
 * Enforces deadline from competition data
 */
function TeamSubmission({ teamId, competition, team }) {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadExistingSubmission();
    checkDeadline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, competition]);

  // Countdown timer for deadline
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setDeadlinePassed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown]);

  const checkDeadline = () => {
    const deadline = competition?.submission_deadline_at;
    if (deadline) {
      try {
        const deadlineDt = new Date(deadline);
        const now = new Date();
        if (now > deadlineDt) {
          setDeadlinePassed(true);
        } else {
          setDeadlinePassed(false);
          const diff = Math.floor((deadlineDt - now) / 1000);
          setCountdown(diff);
        }
      } catch (e) {
        console.error('Invalid deadline format:', e);
      }
    }
  };

  const loadExistingSubmission = async () => {
    if (!teamId) return;
    
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_URL}/api/cfo/teams/${teamId}/submission`,
        { params: { competition_id: competition?.id } }
      );
      
      if (response.data && response.data.submitted) {
        setSubmission(response.data);
      }
    } catch (err) {
      // No existing submission - that's OK
      if (err.response?.status !== 404) {
        console.error('Failed to load submission:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatCountdown = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else {
      return `${mins}m ${secs}s`;
    }
  };

  const getFileIcon = (file) => {
    const ext = file?.name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return FileText;
    if (ext === 'xls' || ext === 'xlsx') return FileSpreadsheet;
    if (ext === 'zip') return Archive;
    return FileText;
  };

  const getFileColor = (file) => {
    const ext = file?.name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'text-red-600 bg-red-100';
    if (ext === 'xls' || ext === 'xlsx') return 'text-green-600 bg-green-100';
    if (ext === 'zip') return 'text-purple-600 bg-purple-100';
    return 'text-gray-600 bg-gray-100';
  };

  const validateFile = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = ['pdf', 'xls', 'xlsx', 'zip'];
    
    if (!acceptedExtensions.includes(ext)) {
      return 'Invalid file type. Only PDF, Excel (.xls, .xlsx), and ZIP files are accepted.';
    }

    if (file.size > MAX_FILE_SIZE) {
      return `File size (${formatFileSize(file.size)}) exceeds the 25MB limit.`;
    }

    return null;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (deadlinePassed || submission) return;

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file to submit.');
      return;
    }

    if (deadlinePassed) {
      setError('Submission deadline has passed.');
      return;
    }

    if (!window.confirm('Are you sure you want to submit this as your final solution? This action cannot be undone.')) {
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('team_id', teamId);
      if (competition?.id) {
        formData.append('competition_id', competition.id);
      }

      const response = await axios.post(
        `${API_URL}/api/cfo/teams/${teamId}/submission`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      setSubmission(response.data);
      setSelectedFile(null);
      setSuccess('Your solution has been submitted successfully!');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Submission failed:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to submit your solution. Please try again.';
      setError(errorMsg);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const FileIcon = selectedFile ? getFileIcon(selectedFile) : FileText;
  const fileColor = selectedFile ? getFileColor(selectedFile) : '';

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="text-center py-12">
          <Loader className="w-8 h-8 animate-spin text-modex-secondary mx-auto mb-4" />
          <p className="text-gray-600">Loading submission status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`text-white px-6 py-4 ${deadlinePassed ? 'bg-gradient-to-r from-gray-500 to-gray-600' : 'bg-gradient-to-r from-modex-accent to-modex-secondary'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Team Submission</h3>
            <p className="text-sm opacity-90">
              {submission ? 'Submission received' : deadlinePassed ? 'Deadline passed' : 'Upload your final solution'}
            </p>
          </div>
          {deadlinePassed ? <Ban className="w-8 h-8 opacity-80" /> : <Send className="w-8 h-8 opacity-80" />}
        </div>
      </div>

      {/* Deadline Timer */}
      {competition?.submission_deadline_at && !submission && (
        <div className={`px-6 py-3 border-b ${deadlinePassed ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
          <div className="flex items-center justify-between">
            <p className={`text-sm ${deadlinePassed ? 'text-red-800' : 'text-orange-800'}`}>
              <Clock className="w-4 h-4 inline-block mr-2" />
              <strong>Deadline:</strong> {new Date(competition.submission_deadline_at).toLocaleString()}
            </p>
            {!deadlinePassed && countdown && (
              <span className="text-sm font-mono font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded">
                {formatCountdown(countdown)} remaining
              </span>
            )}
            {deadlinePassed && (
              <span className="text-sm font-bold text-red-700 bg-red-100 px-3 py-1 rounded">
                CLOSED
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Deadline Passed Message */}
        {deadlinePassed && !submission && (
          <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="bg-red-100 p-3 rounded-lg mr-4">
                <Ban className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h4 className="font-bold text-red-900 text-lg">Submission Closed</h4>
                <p className="text-red-700 text-sm mt-1">
                  The submission deadline has passed. No more submissions are being accepted.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Existing Submission */}
        {submission && (
          <div className="mb-6 bg-green-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-start">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-green-900 text-lg">Submission Received</h4>
                <p className="text-green-700 text-sm mt-1">Your team has successfully submitted a solution.</p>
                
                <div className="mt-4 bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {submission.file_name || 'Submitted Solution'}
                      </p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                      </div>
                      {submission.submitted_by_name && (
                        <p className="text-xs text-gray-500 mt-1">
                          By: {submission.submitted_by_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-green-700 mt-4">
                  <Shield className="w-4 h-4 inline-block mr-1" />
                  Your submission is locked and cannot be modified.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area (Only show if no submission and deadline not passed) */}
        {!submission && !deadlinePassed && (
          <>
            {/* Drag & Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-modex-secondary hover:bg-modex-light/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.xls,.xlsx,.zip"
                className="hidden"
              />

              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className={`p-4 rounded-full mb-4 ${fileColor}`}>
                    <FileIcon className="w-10 h-10" />
                  </div>
                  <p className="font-bold text-gray-800 text-lg">{selectedFile.name}</p>
                  <p className="text-gray-500 text-sm mt-1">
                    {formatFileSize(selectedFile.size)}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="mt-4 text-red-500 hover:text-red-700 font-semibold text-sm flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="bg-modex-light p-4 rounded-full mb-4">
                    <Upload className="w-10 h-10 text-modex-secondary" />
                  </div>
                  <p className="font-bold text-gray-800 text-lg">Drop your file here</p>
                  <p className="text-gray-500 text-sm mt-1">or click to browse</p>
                  <p className="text-gray-400 text-xs mt-4">
                    Accepted formats: PDF, Excel (.xls, .xlsx), ZIP • Max 25MB
                  </p>
                </div>
              )}
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-modex-secondary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center ${
                selectedFile && !uploading
                  ? 'bg-modex-accent hover:bg-modex-primary text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {uploading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Final Solution
                </>
              )}
            </button>

            {/* Important Notice */}
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h5 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Important
              </h5>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Ensure your team has reviewed the solution before submitting</li>
                <li>• Only one submission per team is allowed</li>
                <li>• Submissions cannot be modified after final submission</li>
                <li>• Include all required files in a single ZIP if submitting multiple documents</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default TeamSubmission;
