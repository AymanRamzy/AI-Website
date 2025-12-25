import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { 
  Globe, Briefcase, Linkedin, Award, 
  ChevronRight, ChevronLeft, Check, Loader, AlertCircle,
  Edit3, Save
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

// Country code to name mapping for phone input
const COUNTRY_CODE_MAP = {
  'sa': 'Saudi Arabia',
  'ae': 'United Arab Emirates',
  'qa': 'Qatar',
  'kw': 'Kuwait',
  'bh': 'Bahrain',
  'om': 'Oman',
  'eg': 'Egypt',
  'jo': 'Jordan',
  'lb': 'Lebanon',
  'ma': 'Morocco',
  'tn': 'Tunisia',
  'dz': 'Algeria',
  'us': 'United States',
  'gb': 'United Kingdom',
  'ca': 'Canada',
  'de': 'Germany',
  'fr': 'France',
  'ch': 'Switzerland',
  'sg': 'Singapore',
  'hk': 'Hong Kong',
  'jp': 'Japan',
  'au': 'Australia',
  'in': 'India',
  'pk': 'Pakistan',
  'za': 'South Africa',
  'ng': 'Nigeria',
  'ke': 'Kenya',
  'br': 'Brazil',
  'mx': 'Mexico'
};

// Certification options - reordered per requirements
const CERTIFICATIONS = [
  { value: 'CFA', label: 'CFA – Chartered Financial Analyst' },
  { value: 'CMA', label: 'CMA – Certified Management Accountant' },
  { value: 'ACCA', label: 'ACCA – Association of Chartered Certified Accountants' },
  { value: 'CIMA', label: 'CIMA – Chartered Institute of Management Accountants' },
  { value: 'AFM', label: 'AFM – Advanced Financial Modeler' },
  { value: 'CFM', label: 'CFM – Chartered Financial Modeler' },
  { value: 'FMVA', label: 'FMVA – Financial Modeling & Valuation Analyst' },
  { value: 'CPA', label: 'CPA – Certified Public Accountant' },
  { value: 'FRM', label: 'FRM – Financial Risk Manager' },
  { value: 'CIA', label: 'CIA – Certified Internal Auditor' },
  { value: 'SOCPA', label: 'SOCPA – Saudi Organization for CPAs' },
  { value: 'CA', label: 'CA – Chartered Accountant' },
  { value: 'Other', label: 'Other (specify below)' },
  { value: 'None', label: 'None – No certifications yet' }
];

const INDUSTRIES = [
  { value: 'banking', label: 'Banking' },
  { value: 'investment', label: 'Investment' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'corporate_finance', label: 'Corporate Finance' },
  { value: 'accounting', label: 'Accounting' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'energy', label: 'Energy' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail' },
  { value: 'government', label: 'Government' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' }
];

const EXPERIENCE_LEVELS = [
  { value: '0-1', label: 'Less than 1 year' },
  { value: '1-3', label: '1–3 years' },
  { value: '3-5', label: '3–5 years' },
  { value: '5-10', label: '5–10 years' },
  { value: '10+', label: '10+ years' }
];

// LinkedIn URL validation
const validateLinkedInUrl = (url) => {
  if (!url) return false;
  return url.startsWith('https://www.linkedin.com/') || url.startsWith('https://linkedin.com/');
};

function ProfileSetup() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuth();
  
  // Check if in edit mode
  const isEditMode = location.state?.editMode || false;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(''); // Always string
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // Explicitly numeric
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state - separate for each step to prevent re-renders
  const [formData, setFormData] = useState({
    // Step 1
    phone_e164: '',
    phone_country: 'sa',
    country: 'Saudi Arabia',
    preferred_language: 'en',
    whatsapp_enabled: false,
    // Step 2
    job_title: '',
    company_name: '',
    industry: '',
    years_of_experience: '',
    // Step 3
    linkedin_url: '',
    selected_certifications: [],
    other_certification: ''
  });

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!token) {
        setInitialLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/api/cfo/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const profile = response.data;
        
        // If profile completed and NOT in edit mode, redirect to dashboard
        if (profile.profile_completed && !isEditMode) {
          navigate('/dashboard');
          return;
        }
        
        // Parse certifications from backend format
        let selectedCerts = [];
        let otherCert = '';
        if (profile.certifications && Array.isArray(profile.certifications)) {
          profile.certifications.forEach(cert => {
            if (cert.name === 'Other' && cert.other_text) {
              selectedCerts.push('Other');
              otherCert = cert.other_text;
            } else if (cert.name) {
              selectedCerts.push(cert.name);
            }
          });
        }
        
        // Extract phone number - remove leading + for PhoneInput
        const phoneNumber = profile.mobile_number ? profile.mobile_number.replace(/^\+/, '') : '';
        
        // Determine country from phone or use stored country
        let phoneCountry = 'sa';
        if (profile.country) {
          const countryEntry = Object.entries(COUNTRY_CODE_MAP).find(
            ([code, name]) => name.toLowerCase() === profile.country.toLowerCase()
          );
          if (countryEntry) {
            phoneCountry = countryEntry[0];
          }
        }
        
        // Pre-fill form data
        setFormData({
          phone_e164: phoneNumber,
          phone_country: phoneCountry,
          country: profile.country || 'Saudi Arabia',
          preferred_language: profile.preferred_language || 'en',
          whatsapp_enabled: profile.whatsapp_enabled || false,
          job_title: profile.job_title || '',
          company_name: profile.company_name || '',
          industry: profile.industry || '',
          years_of_experience: profile.years_of_experience || '',
          linkedin_url: profile.linkedin_url || '',
          selected_certifications: selectedCerts,
          other_certification: otherCert
        });
        
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setInitialLoading(false);
      }
    };
    loadProfile();
  }, [token, navigate, isEditMode]);

  // Handle phone input change - updates country automatically
  const handlePhoneChange = useCallback((value, countryData) => {
    const countryName = COUNTRY_CODE_MAP[countryData.countryCode] || countryData.name || 'Other';
    setFormData(prev => ({
      ...prev,
      phone_e164: value,
      phone_country: countryData.countryCode,
      country: countryName
    }));
    // Clear phone error
    if (fieldErrors.phone_e164) {
      setFieldErrors(prev => ({ ...prev, phone_e164: '' }));
    }
  }, [fieldErrors.phone_e164]);

  // Generic field change handler
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear field error when user types
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [fieldErrors]);

  // Certification toggle handler
  const handleCertificationToggle = useCallback((certValue) => {
    setFormData(prev => {
      let newCerts = [...prev.selected_certifications];
      
      // If selecting "None", clear all others
      if (certValue === 'None') {
        return { ...prev, selected_certifications: ['None'], other_certification: '' };
      }
      
      // If selecting something else, remove "None" if present
      newCerts = newCerts.filter(c => c !== 'None');
      
      if (newCerts.includes(certValue)) {
        newCerts = newCerts.filter(c => c !== certValue);
        // Clear other text if unchecking "Other"
        if (certValue === 'Other') {
          return { ...prev, selected_certifications: newCerts, other_certification: '' };
        }
      } else {
        newCerts.push(certValue);
      }
      
      return { ...prev, selected_certifications: newCerts };
    });
    
    // Clear certification error
    setFieldErrors(prev => ({ ...prev, certifications: '' }));
  }, []);

  // Validate individual steps - returns boolean
  const validateStep = useCallback((stepNum) => {
    const errors = {};
    
    if (stepNum === 1) {
      // Phone validation - must have valid E.164 format
      if (!formData.phone_e164 || formData.phone_e164.length < 8) {
        errors.phone_e164 = 'Please enter a valid phone number with country code';
      }
      if (!formData.preferred_language) {
        errors.preferred_language = 'Please select your preferred language';
      }
    }
    
    if (stepNum === 2) {
      if (!formData.job_title || formData.job_title.trim().length < 2) {
        errors.job_title = 'Job title must be at least 2 characters';
      }
      if (!formData.company_name || formData.company_name.trim().length < 2) {
        errors.company_name = 'Company name must be at least 2 characters';
      }
      if (!formData.industry) {
        errors.industry = 'Please select your industry';
      }
      if (!formData.years_of_experience) {
        errors.years_of_experience = 'Please select your experience level';
      }
    }
    
    if (stepNum === 3) {
      if (!formData.linkedin_url) {
        errors.linkedin_url = 'LinkedIn profile URL is required';
      } else if (!validateLinkedInUrl(formData.linkedin_url)) {
        errors.linkedin_url = 'URL must start with https://www.linkedin.com/';
      }
      // Certifications are optional - no validation needed
      // But if "Other" is selected, text is required
      if (formData.selected_certifications.includes('Other') && !formData.other_certification.trim()) {
        errors.other_certification = 'Please specify your other certification';
      }
      if (formData.other_certification && formData.other_certification.length > 100) {
        errors.other_certification = 'Must be under 100 characters';
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validate current step (step 3) before submit
    if (!validateStep(3)) {
      return;
    }
    
    setLoading(true);

    try {
      // Build certifications array for backend
      const certifications = formData.selected_certifications
        .filter(c => c !== 'None')
        .map(certName => ({
          name: certName,
          status: 'completed',
          year: null,
          ...(certName === 'Other' ? { other_text: formData.other_certification.trim() } : {})
        }));
      
      // Format phone to E.164
      const phoneE164 = formData.phone_e164.startsWith('+') 
        ? formData.phone_e164 
        : '+' + formData.phone_e164;
      
      const payload = {
        country: formData.country,
        preferred_language: formData.preferred_language,
        mobile_number: phoneE164,
        whatsapp_enabled: formData.whatsapp_enabled,
        job_title: formData.job_title.trim(),
        company_name: formData.company_name.trim(),
        industry: formData.industry,
        years_of_experience: formData.years_of_experience,
        linkedin_url: formData.linkedin_url.trim(),
        certifications: certifications
      };

      await axios.put(`${API_URL}/api/cfo/profile`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (isEditMode) {
        setSuccessMessage('Profile updated successfully!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // Force reload to update user context
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const detail = err.response?.data?.detail;
      
      // FIX: Always convert error to string - never render objects
      if (detail && typeof detail === 'object') {
        if (detail.errors) {
          setFieldErrors(detail.errors);
        }
        // Extract string message
        setError(detail.message || 'Please fix the validation errors');
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError('Failed to save profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step navigation
  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      setError('');
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError('');
  }, []);

  const goToStep = useCallback((targetStep) => {
    if (typeof targetStep !== 'number') return;
    
    // In edit mode, allow direct navigation
    if (isEditMode) {
      setCurrentStep(targetStep);
    } else {
      // In completion mode, only allow going back
      if (targetStep < currentStep) {
        setCurrentStep(targetStep);
      }
    }
    setError('');
  }, [isEditMode, currentStep]);

  // Loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check if current step is valid for "Next" button
  const isStepValid = () => {
    if (currentStep === 1) {
      return formData.phone_e164 && formData.phone_e164.length >= 8 && formData.preferred_language;
    }
    if (currentStep === 2) {
      return formData.job_title?.trim().length >= 2 && 
             formData.company_name?.trim().length >= 2 && 
             formData.industry && 
             formData.years_of_experience;
    }
    if (currentStep === 3) {
      const linkedInValid = formData.linkedin_url && validateLinkedInUrl(formData.linkedin_url);
      const otherValid = !formData.selected_certifications.includes('Other') || formData.other_certification.trim();
      return linkedInValid && otherValid;
    }
    return false;
  };

  // Render Step 1: Personal & Contact
  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <div className="p-2 bg-modex-secondary/10 rounded-lg">
          <Globe className="w-6 h-6 text-modex-secondary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-modex-primary">Personal & Contact</h3>
          <p className="text-sm text-gray-500">Your contact information</p>
        </div>
      </div>

      {/* International Phone Input */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Mobile Number <span className="text-red-500">*</span>
        </label>
        <PhoneInput
          country={formData.phone_country}
          value={formData.phone_e164}
          onChange={handlePhoneChange}
          inputProps={{
            name: 'phone',
            required: true,
            'data-testid': 'phone-input'
          }}
          containerClass="phone-input-container"
          inputClass={`w-full px-4 py-3 border-2 rounded-lg ${
            fieldErrors.phone_e164 ? 'border-red-400' : 'border-gray-200'
          }`}
          buttonClass="phone-dropdown-btn"
          enableSearch={true}
          searchPlaceholder="Search country..."
          preferredCountries={['sa', 'ae', 'qa', 'kw', 'bh', 'om', 'eg', 'jo']}
        />
        {fieldErrors.phone_e164 && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {fieldErrors.phone_e164}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Select your country and enter your number. Country will be set automatically.
        </p>
      </div>

      {/* Country Display (auto-filled from phone) */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Country
        </label>
        <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-700">
          {formData.country || 'Will be set from phone number'}
        </div>
        <p className="mt-1 text-xs text-gray-500">Automatically determined from your phone number</p>
      </div>

      {/* Preferred Language */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Preferred Language <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4">
          {[
            { value: 'en', label: 'English', flag: '🇬🇧' },
            { value: 'ar', label: 'العربية', flag: '🇸🇦' }
          ].map(lang => (
            <label
              key={lang.value}
              className={`flex-1 flex items-center justify-center gap-2 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                formData.preferred_language === lang.value
                  ? 'border-modex-secondary bg-modex-secondary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="preferred_language"
                value={lang.value}
                checked={formData.preferred_language === lang.value}
                onChange={handleChange}
                className="sr-only"
              />
              <span className="text-2xl">{lang.flag}</span>
              <span className="font-medium">{lang.label}</span>
              {formData.preferred_language === lang.value && (
                <Check className="w-5 h-5 text-modex-secondary" />
              )}
            </label>
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
        <input
          type="checkbox"
          id="whatsapp_enabled"
          name="whatsapp_enabled"
          checked={formData.whatsapp_enabled}
          onChange={handleChange}
          className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
          data-testid="whatsapp-checkbox"
        />
        <label htmlFor="whatsapp_enabled" className="flex items-center gap-2 cursor-pointer">
          <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          <span className="text-gray-700">This number is available on WhatsApp</span>
        </label>
      </div>
    </div>
  );

  // Render Step 2: Professional Information
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <div className="p-2 bg-modex-secondary/10 rounded-lg">
          <Briefcase className="w-6 h-6 text-modex-secondary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-modex-primary">Professional Information</h3>
          <p className="text-sm text-gray-500">Your work details</p>
        </div>
      </div>

      {/* Job Title */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Job Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="job_title"
          value={formData.job_title}
          onChange={handleChange}
          placeholder="e.g., Financial Analyst, CFO, Accountant"
          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-modex-secondary focus:border-transparent transition-colors ${
            fieldErrors.job_title ? 'border-red-400 bg-red-50' : 'border-gray-200'
          }`}
          data-testid="job-title-input"
        />
        {fieldErrors.job_title && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {fieldErrors.job_title}
          </p>
        )}
      </div>

      {/* Company Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
          placeholder="e.g., Saudi Aramco, SABIC, Al Rajhi Bank"
          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-modex-secondary focus:border-transparent transition-colors ${
            fieldErrors.company_name ? 'border-red-400 bg-red-50' : 'border-gray-200'
          }`}
          data-testid="company-input"
        />
        {fieldErrors.company_name && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {fieldErrors.company_name}
          </p>
        )}
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Industry <span className="text-red-500">*</span>
        </label>
        <select
          name="industry"
          value={formData.industry}
          onChange={handleChange}
          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-modex-secondary focus:border-transparent transition-colors ${
            fieldErrors.industry ? 'border-red-400 bg-red-50' : 'border-gray-200'
          }`}
          data-testid="industry-select"
        >
          <option value="">Select your industry</option>
          {INDUSTRIES.map(ind => (
            <option key={ind.value} value={ind.value}>{ind.label}</option>
          ))}
        </select>
        {fieldErrors.industry && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {fieldErrors.industry}
          </p>
        )}
      </div>

      {/* Years of Experience */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Years of Experience <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {EXPERIENCE_LEVELS.map(exp => (
            <label
              key={exp.value}
              className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                formData.years_of_experience === exp.value
                  ? 'border-modex-secondary bg-modex-secondary/5 text-modex-primary font-medium'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="years_of_experience"
                value={exp.value}
                checked={formData.years_of_experience === exp.value}
                onChange={handleChange}
                className="sr-only"
              />
              <span className="text-sm">{exp.label}</span>
            </label>
          ))}
        </div>
        {fieldErrors.years_of_experience && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {fieldErrors.years_of_experience}
          </p>
        )}
      </div>
    </div>
  );

  // Render Step 3: Professional Presence & Certifications
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <div className="p-2 bg-modex-secondary/10 rounded-lg">
          <Award className="w-6 h-6 text-modex-secondary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-modex-primary">Professional Presence</h3>
          <p className="text-sm text-gray-500">Your online presence & certifications</p>
        </div>
      </div>

      {/* LinkedIn URL */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          <Linkedin className="w-4 h-4 inline mr-1 text-blue-600" />
          LinkedIn Profile URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          name="linkedin_url"
          value={formData.linkedin_url}
          onChange={handleChange}
          placeholder="https://www.linkedin.com/in/yourprofile"
          className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-modex-secondary focus:border-transparent transition-colors ${
            fieldErrors.linkedin_url ? 'border-red-400 bg-red-50' : 'border-gray-200'
          }`}
          data-testid="linkedin-input"
        />
        {fieldErrors.linkedin_url && (
          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {fieldErrors.linkedin_url}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">Must start with https://www.linkedin.com/</p>
      </div>

      {/* Professional Certifications */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Professional Certifications <span className="text-gray-400 font-normal">(Optional)</span>
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Select all certifications you hold or are pursuing.
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto p-3 border-2 border-gray-200 rounded-lg bg-gray-50">
          {CERTIFICATIONS.map(cert => (
            <label
              key={cert.value}
              className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                formData.selected_certifications.includes(cert.value)
                  ? cert.value === 'None' 
                    ? 'bg-gray-200 border border-gray-400'
                    : 'bg-modex-secondary/10 border border-modex-secondary'
                  : 'hover:bg-white border border-transparent'
              }`}
            >
              <input
                type="checkbox"
                checked={formData.selected_certifications.includes(cert.value)}
                onChange={() => handleCertificationToggle(cert.value)}
                className="w-4 h-4 text-modex-secondary rounded focus:ring-modex-secondary"
                data-testid={`cert-${cert.value}`}
              />
              <span className={`text-sm ${
                cert.value === 'None' ? 'text-gray-600 italic' : ''
              }`}>{cert.label}</span>
            </label>
          ))}
        </div>

        {/* Other Certification Text Input */}
        {formData.selected_certifications.includes('Other') && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specify Other Certification <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="other_certification"
              value={formData.other_certification}
              onChange={handleChange}
              placeholder="Enter certification name"
              maxLength={100}
              className={`w-full px-4 py-2 border-2 rounded-lg focus:ring-2 focus:ring-modex-secondary focus:border-transparent ${
                fieldErrors.other_certification ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
              data-testid="other-cert-input"
            />
            {fieldErrors.other_certification && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {fieldErrors.other_certification}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.other_certification.length}/100 characters
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-modex-primary via-modex-secondary to-modex-accent py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            Mod<span className="text-yellow-400">EX</span>
          </h1>
          <h2 className="text-xl font-bold text-white/90 flex items-center justify-center gap-2">
            {isEditMode ? (
              <>
                <Edit3 className="w-5 h-5" />
                Edit Your Profile
              </>
            ) : (
              'Complete Your Profile'
            )}
          </h2>
          <p className="text-white/70 mt-2">
            {isEditMode 
              ? 'Update your information below'
              : `Welcome${user?.full_name ? `, ${user.full_name}` : ''}! Complete your profile to access the platform.`
            }
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center justify-center mb-8">
          {[
            { num: 1, label: 'Contact' },
            { num: 2, label: 'Professional' },
            { num: 3, label: 'Presence' }
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center">
              <button
                type="button"
                onClick={() => goToStep(s.num)}
                disabled={!isEditMode && s.num > currentStep}
                className={`flex flex-col items-center transition-all ${
                  isEditMode || s.num <= currentStep ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
              >
                <div 
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors ${
                    currentStep === s.num 
                      ? 'bg-yellow-400 text-modex-primary ring-4 ring-yellow-400/30' 
                      : currentStep > s.num
                        ? 'bg-green-500 text-white'
                        : 'bg-white/20 text-white/50'
                  }`}
                >
                  {currentStep > s.num ? <Check className="w-6 h-6" /> : s.num}
                </div>
                <span className={`text-xs mt-1 ${currentStep >= s.num ? 'text-white' : 'text-white/50'}`}>
                  {s.label}
                </span>
              </button>
              {idx < 2 && (
                <div className={`w-12 h-1 mx-2 ${currentStep > s.num ? 'bg-green-500' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border-2 border-green-300 rounded-xl p-4 flex items-center gap-3">
            <Check className="w-6 h-6 text-green-600 flex-shrink-0" />
            <span className="text-green-800 font-medium">{successMessage}</span>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit}>
            {/* Render current step */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* General Error Message - FIX: Always render string */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{typeof error === 'string' ? error : 'An error occurred'}</span>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center pt-6 border-t">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center gap-2 px-6 py-3 text-gray-600 hover:text-modex-primary font-medium transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
              ) : (
                <div />
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="px-8 py-3 bg-modex-secondary text-white rounded-lg font-bold hover:bg-modex-primary transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  data-testid="next-step-btn"
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || !isStepValid()}
                  className="px-8 py-3 bg-modex-secondary text-white rounded-lg font-bold hover:bg-modex-primary transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed flex items-center gap-2"
                  data-testid="complete-profile-btn"
                >
                  {loading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : isEditMode ? (
                    <>
                      <Save className="w-5 h-5" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Complete Profile
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Footer Note */}
        <p className="text-center text-white/60 text-sm mt-6">
          Your information is secure and will only be used for ModEX platform purposes.
        </p>
      </div>

      {/* Phone Input Custom Styles */}
      <style>{`
        .phone-input-container {
          width: 100%;
        }
        .phone-input-container .form-control {
          width: 100% !important;
          height: 48px !important;
          font-size: 16px !important;
          padding-left: 58px !important;
          border-radius: 8px !important;
        }
        .phone-input-container .flag-dropdown {
          border-radius: 8px 0 0 8px !important;
          background: #f9fafb !important;
        }
        .phone-input-container .selected-flag {
          width: 50px !important;
          padding: 0 0 0 12px !important;
        }
        .phone-input-container .country-list {
          max-height: 250px !important;
        }
      `}</style>
    </div>
  );
}

export default ProfileSetup;
