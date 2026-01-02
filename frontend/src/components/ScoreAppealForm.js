/**
 * ScoreAppealForm - Submit score appeal for a submission
 * Phase 8: Judging & Fairness
 */
import { useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle,
  Send,
  Loader,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function ScoreAppealForm({ submissionId, originalScore, onAppealSubmitted, onCancel }) {
  const [appealReason, setAppealReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!appealReason.trim()) {
      setError('Please provide a reason for your appeal');
      return;
    }

    if (appealReason.trim().length < 50) {
      setError('Please provide a more detailed reason (at least 50 characters)');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_URL}/api/cfo/submissions/${submissionId}/appeal`,
        { appeal_reason: appealReason },
        { withCredentials: true }
      );

      setSuccess(true);
      if (onAppealSubmitted) {
        onAppealSubmitted(response.data.appeal);
      }
    } catch (err) {
      console.error('Failed to submit appeal:', err);
      setError(err.response?.data?.detail || 'Failed to submit appeal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-green-800 mb-2">Appeal Submitted</h3>
        <p className="text-green-700 mb-4">
          Your appeal has been submitted for review. You'll be notified once a decision is made.
        </p>
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-white">
        <div className="flex items-center">
          <AlertTriangle className="w-6 h-6 mr-3" />
          <div>
            <h3 className="font-bold text-lg">Submit Score Appeal</h3>
            <p className="text-sm opacity-90">
              Current Score: {originalScore?.toFixed(2) || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <Info className="w-5 h-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Before submitting an appeal:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Review the scoring criteria carefully</li>
                <li>Provide specific evidence or reasoning</li>
                <li>Appeals are final and cannot be modified</li>
                <li>Decision will be made within 48-72 hours</li>
              </ul>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <XCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Appeal Reason */}
        <div className="mb-6">
          <label className="block font-semibold text-gray-700 mb-2">
            Reason for Appeal <span className="text-red-500">*</span>
          </label>
          <textarea
            value={appealReason}
            onChange={(e) => setAppealReason(e.target.value)}
            placeholder="Explain why you believe your score should be reviewed. Include specific points about your submission that you feel were not properly evaluated..."
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none resize-none"
            rows="6"
            required
            minLength={50}
          />
          <p className="mt-2 text-sm text-gray-500">
            {appealReason.length}/50 characters minimum
            {appealReason.length >= 50 && (
              <CheckCircle className="w-4 h-4 inline-block ml-2 text-green-500" />
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || appealReason.trim().length < 50}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-bold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {submitting ? (
              <>
                <Loader className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit Appeal
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ScoreAppealForm;
