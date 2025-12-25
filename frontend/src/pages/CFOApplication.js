import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader,
  Award,
  Brain,
  TrendingUp,
  Shield,
  Send,
  Upload,
  FileText,
  X
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';

// Post-submission feedback messages (random selection)
const MICRO_FEEDBACK = [
  "Your leadership intent was clearly expressed.",
  "Your ethics decision showed ownership.",
  "Your judgment under uncertainty stood out."
];

// Step configurations
const STEPS = [
  { id: 1, title: 'Leadership Profile', icon: Award, description: 'Your experience and leadership readiness' },
  { id: 2, title: 'Judgment & Capital', icon: TrendingUp, description: 'Capital allocation and business judgment' },
  { id: 3, title: 'Financial Reality', icon: Brain, description: 'Decision-making under pressure' },
  { id: 4, title: 'Ethics & Ownership', icon: Shield, description: 'Values and final commitment' }
];

// Reusable RadioOption component
const RadioOption = ({ name, value, label, description, selected, onChange }) => (
  <label className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
    selected ? 'border-modex-secondary bg-modex-secondary/5' : 'border-gray-200 hover:border-gray-300'
  }`}>
    <div className="flex items-start">
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        className="mt-1 text-modex-secondary focus:ring-modex-secondary"
      />
      <div className="ml-3">
        <span className="font-semibold text-gray-800">{label}</span>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
    </div>
  </label>
);

// Reusable TextArea component
const TextAreaField = ({ label, value, onChange, maxLength, minLength, placeholder, rows = 3 }) => (
  <div>
    <label className="block font-semibold text-gray-800 mb-2">{label}</label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={maxLength}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-modex-secondary focus:outline-none resize-none"
    />
    <div className="flex justify-between mt-1 text-xs text-gray-500">
      <span>{value.length < minLength ? `Minimum ${minLength} characters required` : ''}</span>
      <span>{value.length}/{maxLength}</span>
    </div>
  </div>
);

function CFOApplication() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { competitionId } = useParams();
  const fileInputRef = useRef(null);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligibility, setEligibility] = useState(null);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  // CV Upload state
  const [cvFile, setCvFile] = useState(null);
  const [cvUploading, setCvUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState('');
  const [cvError, setCvError] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1
    experience_years: '',
    leadership_exposure: '',
    decision_ownership: '',
    leadership_willingness: '',
    commitment_level: '',
    cfo_readiness_commitment: '', // NEW: Merged question
    // Step 2
    capital_allocation: '',
    capital_justification: '',
    cash_vs_profit: '',
    kpi_prioritization: '',
    // Step 3
    dscr_choice: '',
    dscr_impact: '',
    cost_priority: '',
    cfo_mindset: '',
    mindset_explanation: '',
    // Step 4
    ethics_choice: '',
    culture_vs_results: '',
    why_top_100: ''
  });

  const checkEligibility = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/cfo/applications/eligibility`, {
        params: { competition_id: competitionId }
      });
      setEligibility(response.data);
    } catch (err) {
      setError('Failed to check eligibility');
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // CV Upload handler
  const handleCVUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type (also accept by extension as browsers may report different types)
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      setCvError('Please upload a PDF, DOC, or DOCX file');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setCvError('File size must be less than 5MB');
      return;
    }
    
    setCvFile(file);
    setCvError('');
    setCvUploading(true);
    
    try {
      // Create FormData and send to backend
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      // Send to backend endpoint (backend uses service role key to upload to Supabase)
      const uploadResponse = await axios.post(
        `${API_URL}/api/cfo/applications/upload-cv?competition_id=${competitionId}`,
        formDataUpload,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (uploadResponse.data?.success && uploadResponse.data?.cv_url) {
        setCvUrl(uploadResponse.data.cv_url);
      } else {
        throw new Error(uploadResponse.data?.detail || 'Upload failed');
      }
    } catch (err) {
      console.error('CV upload error:', err);
      // Show backend error message verbatim
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to upload CV. Please try again.';
      setCvError(errorMessage);
      setCvFile(null);
    } finally {
      setCvUploading(false);
    }
  };

  const removeCv = () => {
    setCvFile(null);
    setCvUrl('');
    setCvError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.experience_years && formData.leadership_exposure && 
               formData.decision_ownership && formData.leadership_willingness && 
               formData.commitment_level && formData.cfo_readiness_commitment;
      case 2:
        return formData.capital_allocation && formData.capital_justification.length >= 50 &&
               formData.cash_vs_profit.length >= 50 && formData.kpi_prioritization.length >= 50;
      case 3:
        return formData.dscr_choice && formData.dscr_impact.length >= 30 &&
               formData.cost_priority && formData.cfo_mindset && 
               formData.mindset_explanation.length >= 30;
      case 4:
        // CV is required for final step
        return formData.ethics_choice && formData.culture_vs_results && 
               formData.why_top_100.length >= 100 && cvUrl;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Final validation before submit
    if (!isStepValid(1) || !isStepValid(2) || !isStepValid(3) || !isStepValid(4)) {
      setError('Please complete all required fields before submitting');
      return;
    }
    
    // CV required validation
    if (!cvUrl) {
      setError('Please upload your CV before submitting');
      return;
    }
    
    // Hard gate: not_ready check
    if (formData.cfo_readiness_commitment === 'not_ready') {
      setError('You have indicated you are not ready for CFO responsibilities. This application requires readiness to proceed.');
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const applicationData = {
        competition_id: competitionId,
        step1: {
          experience_years: formData.experience_years,
          leadership_exposure: formData.leadership_exposure,
          decision_ownership: formData.decision_ownership,
          leadership_willingness: formData.leadership_willingness,
          commitment_level: formData.commitment_level,
          cfo_readiness_commitment: formData.cfo_readiness_commitment
        },
        step2: {
          capital_allocation: formData.capital_allocation,
          capital_justification: formData.capital_justification.trim(),
          cash_vs_profit: formData.cash_vs_profit.trim(),
          kpi_prioritization: formData.kpi_prioritization.trim()
        },
        step3: {
          dscr_choice: formData.dscr_choice,
          dscr_impact: formData.dscr_impact.trim(),
          cost_priority: formData.cost_priority,
          cfo_mindset: formData.cfo_mindset,
          mindset_explanation: formData.mindset_explanation.trim()
        },
        step4: {
          ethics_choice: formData.ethics_choice,
          culture_vs_results: formData.culture_vs_results,
          why_top_100: formData.why_top_100.trim()
        },
        cv_url: cvUrl,
        cv_uploaded_at: new Date().toISOString()
      };

      const response = await axios.post(`${API_URL}/api/cfo/applications/submit`, applicationData);
      
      if (response.data?.success) {
        // Select random micro feedback
        const randomFeedback = MICRO_FEEDBACK[Math.floor(Math.random() * MICRO_FEEDBACK.length)];
        setFeedbackMessage(randomFeedback);
        setSubmitted(true);
      } else {
        setError(response.data?.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      
      // Extract user-friendly error message
      const errorDetail = err.response?.data?.detail;
      let errorMessage = 'Failed to submit application. Please try again.';
      
      if (typeof errorDetail === 'string') {
        if (errorDetail.includes('already submitted')) {
          errorMessage = 'You have already submitted an application for this competition.';
        } else if (errorDetail.includes('Validation failed')) {
          errorMessage = 'Some answers are incomplete. Please review all fields.';
        } else if (errorDetail.includes('Not eligible')) {
          errorMessage = 'You are not eligible to apply. Please check eligibility requirements.';
        } else if (errorDetail.includes('CV')) {
          errorMessage = 'Please upload your CV before submitting.';
        } else if (errorDetail.includes('not ready')) {
          errorMessage = errorDetail;
        } else {
          errorMessage = errorDetail;
        }
      } else if (typeof errorDetail === 'object' && errorDetail !== null) {
        errorMessage = errorDetail.message || errorDetail.msg || 'An error occurred. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Success Screen with Micro Feedback
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-modex-primary mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-4">
            Your CFO leadership application has been received and is now under review.
          </p>
          {/* POST-SUBMISSION MICRO FEEDBACK */}
          <div className="bg-modex-light border-l-4 border-modex-secondary p-4 rounded-r-lg mb-6">
            <p className="text-modex-primary font-medium italic">&quot;{feedbackMessage}&quot;</p>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            We will notify you once the evaluation is complete.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-modex-secondary text-white py-3 rounded-lg font-bold hover:bg-modex-primary transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-modex-secondary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Checking eligibility...</p>
        </div>
      </div>
    );
  }

  // Not Eligible
  if (eligibility && !eligibility.eligible) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Not Eligible</h2>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <ul className="text-red-700 text-sm text-left space-y-1">
              {eligibility.reasons?.map((reason, idx) => (
                <li key={idx}>• {reason}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => navigate('/competitions')}
            className="text-modex-secondary font-semibold hover:underline"
          >
            ← Back to Competitions
          </button>
        </div>
      </div>
    );
  }

  // Step content renderer
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Experience Years */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Years of relevant experience in finance/business?</h3>
              <div className="space-y-2">
                {[
                  { value: 'less_than_2', label: 'Less than 2 years' },
                  { value: '2_to_5', label: '2-5 years' },
                  { value: '5_to_10', label: '5-10 years' },
                  { value: 'more_than_10', label: 'More than 10 years' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="experience_years"
                    value={opt.value}
                    label={opt.label}
                    selected={formData.experience_years === opt.value}
                    onChange={(v) => handleInputChange('experience_years', v)}
                  />
                ))}
              </div>
            </div>

            {/* Leadership Exposure */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">What level of leadership exposure have you had?</h3>
              <div className="space-y-2">
                {[
                  { value: 'none', label: 'Individual Contributor', description: 'No direct reports' },
                  { value: 'team_lead', label: 'Team Lead', description: 'Managing small teams' },
                  { value: 'department_head', label: 'Department Head', description: 'Leading departments/divisions' },
                  { value: 'c_suite', label: 'C-Suite / Executive', description: 'Executive leadership experience' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="leadership_exposure"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.leadership_exposure === opt.value}
                    onChange={(v) => handleInputChange('leadership_exposure', v)}
                  />
                ))}
              </div>
            </div>

            {/* Decision Ownership */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">Have you owned significant financial decisions?</h3>
              <div className="space-y-2">
                {[
                  { value: 'avoid', label: 'Never', description: 'No ownership of financial decisions' },
                  { value: 'delegate', label: 'With Supervision', description: 'Decisions reviewed by others' },
                  { value: 'own_with_support', label: 'Independent', description: 'Made decisions independently' },
                  { value: 'full_ownership', label: 'Strategic Level', description: 'Owned strategic financial decisions' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="decision_ownership"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.decision_ownership === opt.value}
                    onChange={(v) => handleInputChange('decision_ownership', v)}
                  />
                ))}
              </div>
            </div>

            {/* Leadership Willingness */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">How willing are you to take on leadership roles?</h3>
              <div className="space-y-2">
                {[
                  { value: 'not_interested', label: 'Not Interested', description: 'Prefer individual work' },
                  { value: 'maybe_later', label: 'Maybe Later', description: 'Open to it in the future' },
                  { value: 'ready_with_guidance', label: 'Ready with Guidance', description: 'Ready with mentorship' },
                  { value: 'fully_ready', label: 'Fully Ready', description: 'Ready to lead now' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="leadership_willingness"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.leadership_willingness === opt.value}
                    onChange={(v) => handleInputChange('leadership_willingness', v)}
                  />
                ))}
              </div>
            </div>

            {/* Commitment Level */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">What is your commitment level to this competition?</h3>
              <div className="space-y-2">
                {[
                  { value: 'exploring', label: 'Exploring', description: 'Just checking it out' },
                  { value: 'partially_committed', label: 'Partially Committed', description: 'Interested but uncertain' },
                  { value: 'highly_committed', label: 'Highly Committed', description: 'Dedicated to succeeding' },
                  { value: 'all_in', label: 'All In', description: 'Fully committed to winning' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="commitment_level"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.commitment_level === opt.value}
                    onChange={(v) => handleInputChange('commitment_level', v)}
                  />
                ))}
              </div>
            </div>

            {/* NEW: CFO Readiness & Commitment (Merged Question) */}
            <div className="border-t-2 border-modex-secondary/20 pt-6">
              <h3 className="font-bold text-gray-800 mb-3">
                How ready and committed are you to take on CFO-level responsibilities?
                <span className="text-red-500 ml-1">*</span>
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'not_ready', label: 'Not Ready', description: 'I am not prepared for CFO responsibilities at this time' },
                  { value: 'exploring', label: 'Exploring', description: 'I am exploring what CFO responsibilities entail' },
                  { value: 'ready_with_conditions', label: 'Ready with Conditions', description: 'I am ready with the right support and resources' },
                  { value: 'fully_ready', label: 'Fully Ready', description: 'I am fully prepared and committed to CFO-level responsibilities' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="cfo_readiness_commitment"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.cfo_readiness_commitment === opt.value}
                    onChange={(v) => handleInputChange('cfo_readiness_commitment', v)}
                  />
                ))}
              </div>
              {formData.cfo_readiness_commitment === 'not_ready' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">
                    ⚠️ Selecting &quot;Not Ready&quot; will prevent you from submitting this application.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Capital Allocation */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">
                You have $10M to allocate. Which option do you choose?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'safe_investment', label: 'Safe Investment', description: 'Low-risk, stable returns' },
                  { value: 'moderate_risk', label: 'Moderate Risk', description: 'Balanced risk and return' },
                  { value: 'growth_investment', label: 'Growth Investment', description: 'Invest in expansion and new markets' },
                  { value: 'aggressive_expansion', label: 'Aggressive Expansion', description: 'High-risk, high-reward growth' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="capital_allocation"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.capital_allocation === opt.value}
                    onChange={(v) => handleInputChange('capital_allocation', v)}
                  />
                ))}
              </div>
            </div>

            {/* Capital Justification */}
            <TextAreaField
              label="Justify your capital allocation decision (minimum 50 characters)"
              value={formData.capital_justification}
              onChange={(v) => handleInputChange('capital_justification', v)}
              maxLength={500}
              minLength={50}
              placeholder="Explain your reasoning..."
              rows={4}
            />

            {/* Cash vs Profit */}
            <TextAreaField
              label="A company is profitable but running low on cash. What do you prioritize and why? (minimum 50 characters)"
              value={formData.cash_vs_profit}
              onChange={(v) => handleInputChange('cash_vs_profit', v)}
              maxLength={500}
              minLength={50}
              placeholder="Explain your approach..."
              rows={4}
            />

            {/* KPI Prioritization */}
            <TextAreaField
              label="What 3 financial KPIs would you prioritize as CFO and why? (minimum 50 characters)"
              value={formData.kpi_prioritization}
              onChange={(v) => handleInputChange('kpi_prioritization', v)}
              maxLength={500}
              minLength={50}
              placeholder="List and explain your top 3 KPIs..."
              rows={4}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* DSCR Choice */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">
                Your company&apos;s DSCR drops below 1.0. What is your first action?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'prioritize_debt', label: 'Prioritize Debt Payments', description: 'Focus on meeting debt obligations' },
                  { value: 'balance_both', label: 'Balance Both', description: 'Balance debt service and growth' },
                  { value: 'prioritize_growth', label: 'Prioritize Growth', description: 'Focus on revenue growth' },
                  { value: 'renegotiate', label: 'Renegotiate Terms', description: 'Restructure debt terms with lenders' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="dscr_choice"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.dscr_choice === opt.value}
                    onChange={(v) => handleInputChange('dscr_choice', v)}
                  />
                ))}
              </div>
            </div>

            {/* DSCR Impact */}
            <TextAreaField
              label="How would this decision impact stakeholders? (minimum 30 characters)"
              value={formData.dscr_impact}
              onChange={(v) => handleInputChange('dscr_impact', v)}
              maxLength={300}
              minLength={30}
              placeholder="Describe the stakeholder impact..."
            />

            {/* Cost Priority */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">
                When cutting costs, which area do you protect most?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'cut_people', label: 'Cut People Last', description: 'Protect human capital at all costs' },
                  { value: 'cut_marketing', label: 'Cut Marketing First', description: 'Reduce marketing spend first' },
                  { value: 'optimize_operations', label: 'Optimize Operations', description: 'Streamline processes before cuts' },
                  { value: 'renegotiate_vendors', label: 'Renegotiate Vendors', description: 'Reduce external costs first' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="cost_priority"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.cost_priority === opt.value}
                    onChange={(v) => handleInputChange('cost_priority', v)}
                  />
                ))}
              </div>
            </div>

            {/* CFO Mindset */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">
                What defines a CFO&apos;s mindset most?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'number_cruncher', label: 'Number Cruncher', description: 'Focus on accuracy and data' },
                  { value: 'business_partner', label: 'Business Partner', description: 'Collaborate across departments' },
                  { value: 'strategic_advisor', label: 'Strategic Advisor', description: 'Guide long-term strategy' },
                  { value: 'chief_value_officer', label: 'Chief Value Officer', description: 'Maximize stakeholder value' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="cfo_mindset"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.cfo_mindset === opt.value}
                    onChange={(v) => handleInputChange('cfo_mindset', v)}
                  />
                ))}
              </div>
            </div>

            {/* Mindset Explanation */}
            <TextAreaField
              label="Why did you choose this mindset? (minimum 30 characters)"
              value={formData.mindset_explanation}
              onChange={(v) => handleInputChange('mindset_explanation', v)}
              maxLength={300}
              minLength={30}
              placeholder="Explain your choice..."
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {/* Ethics Choice */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">
                You discover a financial irregularity that benefits the company. What do you do?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'report_immediately', label: 'Report Immediately', description: 'Full disclosure regardless of impact' },
                  { value: 'investigate_first', label: 'Investigate First', description: 'Gather facts before acting' },
                  { value: 'consult_legal', label: 'Consult Legal', description: 'Seek legal guidance first' },
                  { value: 'adjust_quietly', label: 'Adjust Quietly', description: 'Fix internally without disclosure' },
                  { value: 'do_nothing', label: 'Do Nothing', description: 'Leave it as is if beneficial' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="ethics_choice"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.ethics_choice === opt.value}
                    onChange={(v) => handleInputChange('ethics_choice', v)}
                  />
                ))}
              </div>
            </div>

            {/* Culture vs Results */}
            <div>
              <h3 className="font-bold text-gray-800 mb-3">
                A high performer is toxic to team culture. What&apos;s your call?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'results_first', label: 'Results First', description: 'Keep the performer, results matter most' },
                  { value: 'culture_first', label: 'Culture First', description: 'Let them go, culture is paramount' },
                  { value: 'balance_both', label: 'Balance Both', description: 'Coach and set clear expectations' },
                  { value: 'depends_on_situation', label: 'Depends on Situation', description: 'Assess context before deciding' }
                ].map(opt => (
                  <RadioOption
                    key={opt.value}
                    name="culture_vs_results"
                    value={opt.value}
                    label={opt.label}
                    description={opt.description}
                    selected={formData.culture_vs_results === opt.value}
                    onChange={(v) => handleInputChange('culture_vs_results', v)}
                  />
                ))}
              </div>
            </div>

            {/* Why Top 100 */}
            <TextAreaField
              label="Why should you be in the Top 100 CFO candidates? (minimum 100 characters)"
              value={formData.why_top_100}
              onChange={(v) => handleInputChange('why_top_100', v)}
              maxLength={600}
              minLength={100}
              placeholder="Make your case..."
              rows={5}
            />

            {/* CV Upload Section */}
            <div className="border-t-2 border-modex-secondary/20 pt-6">
              <h3 className="font-bold text-gray-800 mb-3">
                Upload Your CV <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please upload your CV in PDF, DOC, or DOCX format (max 5MB).
              </p>
              
              {!cvUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-modex-secondary transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleCVUpload}
                    className="hidden"
                    id="cv-upload"
                  />
                  <label htmlFor="cv-upload" className="cursor-pointer">
                    {cvUploading ? (
                      <div className="flex flex-col items-center">
                        <Loader className="w-10 h-10 text-modex-secondary animate-spin mb-2" />
                        <span className="text-gray-600">Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-modex-secondary font-semibold">Click to upload CV</span>
                        <span className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX (max 5MB)</span>
                      </div>
                    )}
                  </label>
                </div>
              ) : (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-8 h-8 text-green-600 mr-3" />
                    <div>
                      <p className="font-semibold text-green-800">{cvFile?.name || 'CV Uploaded'}</p>
                      <p className="text-sm text-green-600">Successfully uploaded</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeCv}
                    className="p-2 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-red-500" />
                  </button>
                </div>
              )}
              
              {cvError && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {cvError}
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/competitions/${competitionId}`)}
            className="text-modex-secondary hover:text-modex-primary font-semibold flex items-center mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Competition
          </button>
          <h1 className="text-3xl font-black text-modex-primary">CFO Leadership Application</h1>
          
          {/* APPLICANT FRAMING - UI ONLY */}
          <div className="mt-4 bg-modex-light border-l-4 border-modex-accent p-4 rounded-r-lg">
            <p className="text-modex-primary font-medium italic">
              &quot;This is not a test. There are no correct answers — only defensible decisions.&quot;
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center ${index < STEPS.length - 1 ? 'w-full' : ''}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500' : isCurrent ? 'bg-modex-secondary' : 'bg-gray-200'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-white" />
                      ) : (
                        <StepIcon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-gray-500'}`} />
                      )}
                    </div>
                    <span className={`text-xs mt-2 text-center ${isCurrent ? 'text-modex-secondary font-semibold' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`h-1 w-full mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-modex-primary">{STEPS[currentStep - 1].title}</h2>
            <p className="text-gray-600">{STEPS[currentStep - 1].description}</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                currentStep === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-modex-secondary hover:bg-modex-light'
              }`}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={!isStepValid(currentStep)}
                className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-colors ${
                  isStepValid(currentStep)
                    ? 'bg-modex-secondary text-white hover:bg-modex-primary'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!isStepValid(4) || submitting}
                className={`flex items-center px-8 py-3 rounded-lg font-bold transition-all ${
                  isStepValid(4) && !submitting
                    ? 'bg-modex-accent text-white hover:bg-modex-primary transform hover:scale-105'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CFOApplication;
