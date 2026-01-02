/**
 * TalentOffers - View and manage offers received
 * Phase 9: Talent Marketplace
 */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Briefcase,
  DollarSign,
  MapPin,
  Clock,
  Loader,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Building,
  Globe,
  Calendar,
  Send,
  ArrowLeft,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  viewed: { label: 'Viewed', color: 'bg-blue-100 text-blue-800', icon: Clock },
  negotiating: { label: 'Negotiating', color: 'bg-purple-100 text-purple-800', icon: MessageSquare },
  accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  withdrawn: { label: 'Withdrawn', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

function TalentOffers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState({ received: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('received');
  const [expandedOffer, setExpandedOffer] = useState(null);
  const [responding, setResponding] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/talent/my-offers`, {
        withCredentials: true
      });
      setOffers(response.data || { received: [], sent: [] });
    } catch (err) {
      console.error('Failed to load offers:', err);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const respondToOffer = async (offerId, status) => {
    setResponding(offerId);
    try {
      await axios.post(
        `${API_URL}/api/talent/offers/${offerId}/respond`,
        { 
          status,
          response_message: responseMessage || undefined
        },
        { withCredentials: true }
      );
      await loadOffers();
      setExpandedOffer(null);
      setResponseMessage('');
    } catch (err) {
      console.error('Failed to respond:', err);
      setError(err.response?.data?.detail || 'Failed to respond to offer');
    } finally {
      setResponding(null);
    }
  };

  const formatSalary = (min, max, currency = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    });
    if (min && max) return `${formatter.format(min)} - ${formatter.format(max)}`;
    if (min) return `${formatter.format(min)}+`;
    if (max) return `Up to ${formatter.format(max)}`;
    return 'Negotiable';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const currentOffers = activeTab === 'received' ? offers.received : offers.sent;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-modex-secondary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-modex-secondary to-modex-accent text-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link
            to="/talent"
            className="inline-flex items-center text-white/80 hover:text-white mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Marketplace
          </Link>
          <div className="flex items-center">
            <Briefcase className="w-10 h-10 mr-3" />
            <div>
              <h1 className="text-3xl font-bold">My Offers</h1>
              <p className="text-lg opacity-90">Manage your job offers</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('received')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'received'
                  ? 'bg-modex-secondary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Received ({offers.received?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-modex-secondary text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sent ({offers.sent?.length || 0})
            </button>
          </div>
          <button
            onClick={loadOffers}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Offers List */}
        {currentOffers.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-400 mb-2">
              No {activeTab} offers
            </h3>
            <p className="text-gray-500">
              {activeTab === 'received'
                ? 'When companies send you offers, they will appear here'
                : 'Offers you send to talents will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentOffers.map(offer => {
              const statusConfig = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedOffer === offer.id;
              const canRespond = activeTab === 'received' && 
                ['pending', 'viewed', 'negotiating'].includes(offer.status);

              return (
                <div
                  key={offer.id}
                  className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden"
                >
                  {/* Offer Header */}
                  <div
                    className="px-6 py-4 cursor-pointer hover:bg-gray-750"
                    onClick={() => setExpandedOffer(isExpanded ? null : offer.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mr-4">
                          <Building className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">
                            {offer.role_title || 'Job Offer'}
                          </h3>
                          <div className="flex items-center text-sm text-gray-400 mt-1">
                            {offer.company_profiles?.name && (
                              <span className="mr-4">{offer.company_profiles.name}</span>
                            )}
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(offer.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-4 h-4 inline-block mr-1" />
                          {statusConfig.label}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="flex items-center space-x-6 mt-3 text-sm text-gray-400">
                      {(offer.salary_min || offer.salary_max) && (
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-green-400" />
                          {formatSalary(offer.salary_min, offer.salary_max, offer.salary_currency)}
                        </span>
                      )}
                      {offer.location && (
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {offer.location}
                        </span>
                      )}
                      {offer.remote_option && (
                        <span className="flex items-center">
                          <Globe className="w-4 h-4 mr-1" />
                          Remote Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-700 pt-4">
                      {/* Description */}
                      {offer.role_description && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                          <p className="text-gray-300 whitespace-pre-wrap">{offer.role_description}</p>
                        </div>
                      )}

                      {/* Benefits */}
                      {offer.benefits && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Benefits</h4>
                          <p className="text-gray-300">{offer.benefits}</p>
                        </div>
                      )}

                      {/* Contract Duration */}
                      {offer.contract_duration_months && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Contract Duration</h4>
                          <p className="text-gray-300">{offer.contract_duration_months} months</p>
                        </div>
                      )}

                      {/* Response Message from Talent */}
                      {offer.response_message && (
                        <div className="mb-4 bg-gray-700/50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">Response</h4>
                          <p className="text-gray-300">{offer.response_message}</p>
                        </div>
                      )}

                      {/* Response Actions */}
                      {canRespond && (
                        <div className="mt-6 pt-4 border-t border-gray-700">
                          <h4 className="text-sm font-medium text-gray-400 mb-3">Respond to Offer</h4>
                          
                          <textarea
                            value={responseMessage}
                            onChange={(e) => setResponseMessage(e.target.value)}
                            placeholder="Add a message (optional)..."
                            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-modex-secondary focus:outline-none mb-4 resize-none"
                            rows="2"
                          />

                          <div className="flex space-x-4">
                            <button
                              onClick={() => respondToOffer(offer.id, 'accepted')}
                              disabled={responding === offer.id}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold flex items-center justify-center disabled:opacity-50"
                            >
                              {responding === offer.id ? (
                                <Loader className="w-5 h-5 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle className="w-5 h-5 mr-2" />
                                  Accept
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => respondToOffer(offer.id, 'negotiating')}
                              disabled={responding === offer.id}
                              className="flex-1 bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-bold flex items-center justify-center disabled:opacity-50"
                            >
                              <MessageSquare className="w-5 h-5 mr-2" />
                              Negotiate
                            </button>
                            <button
                              onClick={() => respondToOffer(offer.id, 'rejected')}
                              disabled={responding === offer.id}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold flex items-center justify-center disabled:opacity-50"
                            >
                              <XCircle className="w-5 h-5 mr-2" />
                              Decline
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TalentOffers;
