import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Award,
  User,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader,
  Shield,
  Brain,
  TrendingUp,
  Flag,
  FileText,
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

function CFOApplicationDetail() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { competitionId, applicationId } = useParams();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadApplication();
  }, [competitionId, applicationId]);

  const loadApplication = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/admin/competitions/${competitionId}/cfo-applications/${applicationId}`
      );
      setApplication(response.data);
    } catch (err) {
      console.error('Failed to load application:', err);
      setError('Failed to load application details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus) => {
    setUpdating(true);
    setError('');
    setSuccessMessage('');

    try {
      await axios.put(
        `${API_URL}/api/admin/competitions/${competitionId}/cfo-applications/${applicationId}/status`,
        null,
        { params: { new_status: newStatus } }
      );
      setSuccessMessage(`Status updated to ${newStatus}`);
      setApplication(prev => ({ ...prev, status: newStatus }));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const downloadCV = async () => {
    setDownloadingCV(true);
    setError('');

    try {
      const response = await axios.get(
        `${API_URL}/api/admin/competitions/${competitionId}/cfo-applications/${applicationId}/cv`
      );
      
      if (response.data?.download_url) {
        // Open signed URL in new tab for download
        window.open(response.data.download_url, '_blank');
      } else {
        setError('Failed to get download URL');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to download CV');
    } finally {
      setDownloadingCV(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      qualified: 'bg-green-100 text-green-800 border-green-200',
      reserve: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      not_selected: 'bg-gray-100 text-gray-800 border-gray-200',
      excluded: 'bg-red-100 text-red-800 border-red-200',
    };

    const labels = {
      qualified: 'Qualified (Top 100)',
      reserve: 'Reserve (101-150)',
      pending: 'Pending Review',
      not_selected: 'Not Selected',
      excluded: 'Excluded',
    };

    return (
      <span className={`px-4 py-2 rounded-lg text-sm font-bold border ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatAnswer = (value) => {
    if (!value) return <span className="text-gray-400 italic">Not provided</span>;
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-modex-secondary mx-auto mb-4" />
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to={`/competitions/${competitionId}/applications`}
            className="inline-block bg-modex-secondary text-white px-6 py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors"
          >
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                to={`/competitions/${competitionId}/applications`}
                className="text-modex-secondary hover:text-modex-primary transition-colors mr-4"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-modex-primary">Application Review</h1>
                <p className="text-sm text-gray-600">
                  {application?.user_profiles?.full_name || 'Applicant'}
                </p>
              </div>
            </div>
            {getStatusBadge(application?.status)}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Applicant Info */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-modex-primary mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Applicant Information
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-semibold">{application?.user_profiles?.full_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold">{application?.user_profiles?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="font-semibold">
                    {application?.submitted_at
                      ? new Date(application.submitted_at).toLocaleString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Application ID</p>
                  <p className="font-mono text-sm">{application?.id?.substring(0, 8)}...</p>
                </div>
              </div>
            </div>

            {/* Step 1: Leadership Profile */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-modex-primary mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2" />
                Step 1: Leadership Profile
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Experience Years</p>
                    <p className="font-semibold">{formatAnswer(application?.experience_years)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Leadership Exposure</p>
                    <p className="font-semibold">{formatAnswer(application?.leadership_exposure)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Decision Ownership</p>
                    <p className="font-semibold">{formatAnswer(application?.decision_ownership)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Leadership Willingness</p>
                    <p className="font-semibold">{formatAnswer(application?.leadership_willingness)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg col-span-2">
                    <p className="text-xs text-gray-500 mb-1">Commitment Level</p>
                    <p className="font-semibold">{formatAnswer(application?.commitment_level)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Judgment & Capital */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-modex-primary mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Step 2: Judgment & Capital Allocation
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Capital Allocation Choice</p>
                  <p className="font-semibold">{formatAnswer(application?.capital_allocation)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Capital Justification</p>
                  <p className="text-sm">{application?.capital_justification || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Cash vs Profit</p>
                  <p className="text-sm">{application?.cash_vs_profit || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">KPI Prioritization</p>
                  <p className="text-sm">{application?.kpi_prioritization || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Step 3: Financial Reality */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-modex-primary mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Step 3: Financial Reality Under Pressure
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">DSCR Choice</p>
                    <p className="font-semibold">{formatAnswer(application?.dscr_choice)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Cost Priority</p>
                    <p className="font-semibold">{formatAnswer(application?.cost_priority)}</p>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">DSCR Impact</p>
                  <p className="text-sm">{application?.dscr_impact || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">CFO Mindset</p>
                  <p className="font-semibold">{formatAnswer(application?.cfo_mindset)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Mindset Explanation</p>
                  <p className="text-sm">{application?.mindset_explanation || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Step 4: Ethics */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-modex-primary mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Step 4: Ethics & Final Ownership
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-3 rounded-lg ${
                    application?.ethics_choice === 'adjust_quietly' || application?.ethics_choice === 'do_nothing'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50'
                  }`}>
                    <p className="text-xs text-gray-500 mb-1">Ethics Choice</p>
                    <p className="font-semibold">{formatAnswer(application?.ethics_choice)}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Culture vs Results</p>
                    <p className="font-semibold">{formatAnswer(application?.culture_vs_results)}</p>
                  </div>
                </div>
                <div className="bg-modex-light p-4 rounded-lg border border-modex-accent/30">
                  <p className="text-xs text-modex-primary font-semibold mb-2">Why Top 100?</p>
                  <p className="text-sm">{application?.why_top_100 || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Score Card */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-modex-primary mb-4">Scoring</h3>
              <div className="text-center mb-6">
                <div className="text-5xl font-black text-modex-secondary">
                  {application?.total_score?.toFixed(1) || '0.0'}
                </div>
                <p className="text-sm text-gray-500">Total Score</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Leadership</span>
                  <span className="font-semibold">{application?.leadership_score?.toFixed(1) || '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Ethics</span>
                  <span className="font-semibold">{application?.ethics_score?.toFixed(1) || '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Capital</span>
                  <span className="font-semibold">{application?.capital_score?.toFixed(1) || '0'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Judgment</span>
                  <span className="font-semibold">{application?.judgment_score?.toFixed(1) || '0'}</span>
                </div>
              </div>
              {application?.red_flag_count > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center text-red-600">
                    <Flag className="w-4 h-4 mr-2" />
                    <span className="font-semibold">{application.red_flag_count} Red Flags</span>
                  </div>
                  {application?.red_flags && (
                    <ul className="mt-2 text-xs text-red-600 space-y-1">
                      {application.red_flags.map((flag, i) => (
                        <li key={i}>• {flag.replace(/_/g, ' ')}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {application?.auto_excluded && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-800">Auto-Excluded</p>
                  <p className="text-xs text-red-600">{application?.exclusion_reason || 'Ethics or commitment failure'}</p>
                </div>
              )}
            </div>

            {/* Admin Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-modex-primary mb-4">Admin Actions</h3>
              <div className="space-y-3">
                {/* CV Download Button - Admin Only */}
                {application?.cv_url && (
                  <button
                    onClick={downloadCV}
                    disabled={downloadingCV}
                    className="w-full py-2.5 px-4 bg-modex-secondary text-white rounded-lg font-semibold hover:bg-modex-primary transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {downloadingCV ? 'Preparing...' : '📄 Download CV'}
                  </button>
                )}
                
                <button
                  onClick={() => updateStatus('qualified')}
                  disabled={updating || application?.status === 'qualified'}
                  className="w-full py-2.5 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Qualify (Top 100)
                </button>
                <button
                  onClick={() => updateStatus('reserve')}
                  disabled={updating || application?.status === 'reserve'}
                  className="w-full py-2.5 px-4 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Reserve (101-150)
                </button>
                <button
                  onClick={() => updateStatus('excluded')}
                  disabled={updating || application?.status === 'excluded'}
                  className="w-full py-2.5 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Exclude
                </button>
              </div>
              {application?.admin_override && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Status manually overridden
                    {application?.override_at && (
                      <> on {new Date(application.override_at).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CFOApplicationDetail;
