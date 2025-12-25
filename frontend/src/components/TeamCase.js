import { useState, useEffect } from 'react';
import { FileText, Download, Eye, ExternalLink, AlertCircle, Loader } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

/**
 * TeamCase - Case Tab Component (READ-ONLY)
 * Displays competition case file & instructions for team viewing
 * - Preview (iframe or embedded viewer)
 * - Download button
 * - File is read-only - no editing or re-upload by team
 */
function TeamCase({ teamId, competition }) {
  const [loading, setLoading] = useState(true);
  const [caseFile, setCaseFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCaseFile();
  }, [competition]);

  const loadCaseFile = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Case file data expected from competition object
      // Admin uploads case file and it's stored in competition record
      if (competition?.case_file_url) {
        setCaseFile({
          url: competition.case_file_url,
          name: competition.case_file_name || 'Competition Case File',
          title: competition.case_title || competition.title || 'Competition Case',
          instructions: competition.case_instructions || competition.description || '',
          uploaded_at: competition.case_uploaded_at
        });
      } else {
        // No case file uploaded yet
        setCaseFile(null);
      }
    } catch (err) {
      console.error('Failed to load case file:', err);
      setError('Failed to load case file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!caseFile?.url) return;
    
    try {
      // Open in new tab for download
      window.open(caseFile.url, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
      setError('Failed to download file. Please try again.');
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Determine if file can be previewed (PDF)
  const canPreview = caseFile?.url?.toLowerCase().includes('.pdf') || 
                     caseFile?.name?.toLowerCase().includes('.pdf');

  if (loading) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="text-center py-12">
          <Loader className="w-8 h-8 animate-spin text-modex-secondary mx-auto mb-4" />
          <p className="text-gray-600">Loading case file...</p>
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
            onClick={loadCaseFile}
            className="mt-4 text-modex-secondary hover:text-modex-primary font-semibold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!caseFile) {
    return (
      <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Case File Available</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            The competition case file has not been uploaded yet.
            Please check back later or contact the organizers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-modex-secondary to-modex-primary text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Competition Case</h3>
            <p className="text-sm opacity-90">Read-only • Download available</p>
          </div>
          <FileText className="w-8 h-8 opacity-80" />
        </div>
      </div>

      {/* Case Info */}
      <div className="p-6">
        {/* Case Title */}
        <div className="mb-6">
          <h4 className="text-xl font-bold text-modex-primary mb-2">
            {caseFile.title}
          </h4>
          {caseFile.instructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
              <h5 className="font-semibold text-blue-900 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Instructions
              </h5>
              <p className="text-blue-800 text-sm whitespace-pre-wrap">
                {caseFile.instructions}
              </p>
            </div>
          )}
        </div>

        {/* File Card */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg mr-4">
                <FileText className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{caseFile.name}</p>
                {caseFile.uploaded_at && (
                  <p className="text-xs text-gray-500">
                    Uploaded: {new Date(caseFile.uploaded_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canPreview && (
                <button
                  onClick={togglePreview}
                  className="flex items-center px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-semibold text-sm transition-colors"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {showPreview ? 'Hide Preview' : 'Preview'}
                </button>
              )}
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-modex-secondary hover:bg-modex-primary text-white rounded-lg font-semibold text-sm transition-colors"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
            </div>
          </div>
        </div>

        {/* PDF Preview */}
        {showPreview && canPreview && caseFile.url && (
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 flex items-center justify-between border-b">
              <span className="text-sm font-medium text-gray-700">Document Preview</span>
              <a
                href={caseFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-modex-secondary hover:text-modex-primary text-sm flex items-center"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Open in New Tab
              </a>
            </div>
            <iframe
              src={caseFile.url}
              className="w-full h-[600px] bg-white"
              title="Case File Preview"
            />
          </div>
        )}

        {/* Read-only Notice */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> This case file is read-only. Review the case carefully and prepare your team&apos;s solution for submission in the &quot;Submission&quot; tab.
          </p>
        </div>
      </div>
    </div>
  );
}

export default TeamCase;
