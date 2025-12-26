import { useState, useEffect } from 'react';
import { FileText, Download, Eye, ExternalLink, AlertCircle, Loader, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * TeamCase - Case Tab Component (READ-ONLY)
 * Fetches case files from backend with timer enforcement.
 * Shows countdown if case not yet released.
 * Also shows submission deadline countdown when case is available.
 */
function TeamCase({ teamId, competition }) {
  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(null);
  const [deadlineCountdown, setDeadlineCountdown] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

  const loadCaseFiles = async () => {
    if (!teamId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`${API_URL}/api/cfo/teams/${teamId}/case-files`);
      setCaseData(response.data);
      
      // If case not released, start countdown
      if (!response.data.case_released && response.data.time_until_release) {
        setCountdown(Math.floor(response.data.time_until_release));
      } else {
        setCountdown(null);
      }
      
      // Calculate deadline countdown
      const deadline = response.data.submission_deadline_at || competition?.submission_deadline_at;
      if (deadline) {
        try {
          const deadlineDt = new Date(deadline);
          const now = new Date();
          if (now < deadlineDt) {
            const diff = Math.floor((deadlineDt - now) / 1000);
            setDeadlineCountdown(diff);
          } else {
            setDeadlineCountdown(0);
          }
        } catch (e) {
          console.error('Invalid deadline format:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load case files:', err);
      if (err.response?.status === 403) {
        setError('You do not have access to this team.');
      } else if (err.response?.status === 404) {
        setError('Team or competition not found.');
      } else {
        setError('Failed to load case files. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Countdown timer effect for case release
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Reload case files when timer reaches 0
          loadCaseFiles();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  // Countdown timer effect for submission deadline
  useEffect(() => {
    if (deadlineCountdown === null || deadlineCountdown <= 0) return;
    
    const timer = setInterval(() => {
      setDeadlineCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [deadlineCountdown]);

  const formatCountdown = (seconds) => {
    if (seconds === null || seconds === undefined) return '';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${mins}m ${secs}s`;
    } else if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    } else {
      return `${mins}m ${secs}s`;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const canPreview = (fileName) => {
    return fileName?.toLowerCase().endsWith('.pdf');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="text-center py-12">
          <Loader className="w-8 h-8 animate-spin text-modex-secondary mx-auto mb-4" />
          <p className="text-gray-600">Loading case files...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadCaseFiles}
            className="mt-4 text-modex-secondary hover:text-modex-primary font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Case not yet released - show countdown
  if (caseData && !caseData.case_released) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Case Not Yet Released</h3>
              <p className="text-sm opacity-90">Check back when the timer ends</p>
            </div>
            <Clock className="w-8 h-8 opacity-80" />
          </div>
        </div>
        
        <div className="p-8 text-center">
          <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h4 className="text-xl font-bold text-gray-800 mb-2">Case Release Countdown</h4>
          <p className="text-gray-600 mb-6">The case file will be available in:</p>
          
          <div className="bg-gray-100 rounded-xl py-6 px-8 inline-block">
            <span className="text-4xl font-mono font-bold text-modex-primary">
              {countdown ? formatCountdown(countdown) : 'Soon...'}
            </span>
          </div>
          
          {caseData.case_release_at && (
            <p className="text-sm text-gray-500 mt-4">
              Release time: {new Date(caseData.case_release_at).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  }

  // No case files uploaded yet (but case is released or no timer set)
  if (!caseData?.files || caseData.files.length === 0) {
    const deadline = caseData?.submission_deadline_at || competition?.submission_deadline_at;
    
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-modex-secondary to-modex-primary text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">Competition Case</h3>
              <p className="text-sm opacity-90">Read-only • Download available when uploaded</p>
            </div>
            <FileText className="w-8 h-8 opacity-80" />
          </div>
        </div>

        {/* Big Deadline Countdown - Same style as case release countdown */}
        {deadline && deadlineCountdown !== null && deadlineCountdown > 0 && (
          <div className="p-8 text-center bg-orange-50 border-b border-orange-200">
            <Clock className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <h4 className="text-lg font-bold text-gray-800 mb-2">Submission Deadline Countdown</h4>
            <p className="text-gray-600 mb-4">Submit your solution before time runs out:</p>
            
            <div className="bg-white rounded-xl py-6 px-8 inline-block shadow-sm border border-orange-200">
              <span className="text-4xl font-mono font-bold text-orange-600">
                {formatCountdown(deadlineCountdown)}
              </span>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Deadline: {new Date(deadline).toLocaleString()}
            </p>
          </div>
        )}

        {/* Deadline passed */}
        {deadline && deadlineCountdown === 0 && (
          <div className="p-6 text-center bg-red-50 border-b border-red-200">
            <div className="bg-red-100 rounded-xl py-4 px-8 inline-block">
              <span className="text-2xl font-bold text-red-600">SUBMISSION CLOSED</span>
            </div>
            <p className="text-sm text-red-600 mt-2">
              Deadline was: {new Date(deadline).toLocaleString()}
            </p>
          </div>
        )}

        <div className="p-8 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Case Files Available</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            The competition case files have not been uploaded yet.
            Please check back later or contact the organizers.
          </p>
        </div>
      </div>
    );
  }

  // Case files are available
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-modex-secondary to-modex-primary text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Competition Case</h3>
            <p className="text-sm opacity-90">
              {caseData.files.length} file{caseData.files.length !== 1 ? 's' : ''} • Read-only
            </p>
          </div>
          <FileText className="w-8 h-8 opacity-80" />
        </div>
      </div>

      {/* Deadline Info - Always show */}
      {(caseData.submission_deadline_at || competition?.submission_deadline_at) && (
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-orange-800">
              <Clock className="w-4 h-4 inline-block mr-2" />
              <strong>Submission Deadline:</strong>{' '}
              {new Date(caseData.submission_deadline_at || competition?.submission_deadline_at).toLocaleString()}
            </p>
            {deadlineCountdown !== null && deadlineCountdown > 0 && (
              <span className="text-sm font-mono font-bold text-orange-700 bg-orange-100 px-3 py-1 rounded">
                {formatCountdown(deadlineCountdown)} remaining
              </span>
            )}
            {deadlineCountdown === 0 && (
              <span className="text-sm font-bold text-red-700 bg-red-100 px-3 py-1 rounded">
                CLOSED
              </span>
            )}
          </div>
        </div>
      )}

      {/* Case Files */}
      <div className="p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-4">Case Files</h4>
        
        <div className="space-y-3">
          {caseData.files.map((file, index) => (
            <div
              key={index}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-red-100 p-3 rounded-lg mr-4">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{file.name}</p>
                    {file.size > 0 && (
                      <p className="text-xs text-gray-500">
                        Size: {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {canPreview(file.name) && (
                    <button
                      onClick={() => setPreviewFile(previewFile === file ? null : file)}
                      className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {previewFile === file ? 'Hide' : 'Preview'}
                    </button>
                  )}
                  {file.download_url && (
                    <a
                      href={file.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-modex-secondary hover:bg-modex-primary text-white rounded-lg font-semibold text-sm transition-colors"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  )}
                </div>
              </div>
              
              {/* PDF Preview */}
              {previewFile === file && canPreview(file.name) && file.download_url && (
                <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
                    <span className="text-sm font-medium text-gray-700">Document Preview</span>
                    <a
                      href={file.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-modex-secondary hover:text-modex-primary text-sm flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Open in New Tab
                    </a>
                  </div>
                  <iframe
                    src={file.download_url}
                    className="w-full h-[500px] bg-white"
                    title={`Preview: ${file.name}`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Read-only Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> These case files are read-only. Review the materials carefully and prepare your team&apos;s solution for submission in the &quot;Submission&quot; tab.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeamCase;
