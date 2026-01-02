/**
 * AdminDashboard - Admin management interface
 * SECURITY HARDENED: Cookie-based authentication (P0 Frontend Integration)
 * ENHANCED: Case file upload + Timer configuration + Level Management (Phase 2-4)
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Upload, FileText, Clock, Trash2, Download, 
  Calendar, AlertCircle, CheckCircle, Loader,
  Settings, X, MessageCircle, Layers
} from 'lucide-react';
import AdminTeamChat from '../components/AdminTeamChat';
import AdminLevelManager from '../components/AdminLevelManager';
import AdminTeamObserver from '../components/AdminTeamObserver';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newComp, setNewComp] = useState({ 
    title: '', description: '', 
    registration_start: '', registration_end: '', 
    competition_start: '', competition_end: '', 
    max_teams: 8, status: 'draft',
    case_release_at: '', submission_deadline_at: ''
  });
  
  // Case file management state
  const [selectedCompetition, setSelectedCompetition] = useState(null);
  const [caseFiles, setCaseFiles] = useState([]);
  const [uploadingCase, setUploadingCase] = useState(false);
  const [loadingCaseFiles, setLoadingCaseFiles] = useState(false);
  const caseFileInputRef = useRef(null);
  
  // Level manager state
  const [levelManagerComp, setLevelManagerComp] = useState(null);
  
  // Team Observer state
  const [observingTeamId, setObservingTeamId] = useState(null);
  const [allTeams, setAllTeams] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        credentials: 'include'
      });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        credentials: 'include'
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) { setError('Failed to load users'); }
    setLoading(false);
  };

  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/competitions`, {
        credentials: 'include'
      });
      if (res.ok) setCompetitions(await res.json());
    } catch (e) { setError('Failed to load competitions'); }
    setLoading(false);
  };

  const fetchAllTeams = async (competitionId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/competitions/${competitionId}/all-teams`, {
        credentials: 'include'
      });
      if (res.ok) setAllTeams(await res.json());
    } catch (e) { 
      console.error('Failed to load teams:', e);
      setAllTeams([]);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchStats();
     
  }, [user, navigate]);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'competitions') fetchCompetitions();
     
  }, [activeTab]);

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const updateUserRole = async (userId, role) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        fetchUsers();
        setSuccess('User role updated');
      }
    } catch (e) { setError('Failed to update user'); }
  };

  const createCompetition = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/competitions`, {
        method: 'POST',
        credentials: 'include', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newComp)
      });
      if (res.ok) {
        setNewComp({ 
          title: '', description: '', 
          registration_start: '', registration_end: '', 
          competition_start: '', competition_end: '', 
          max_teams: 8, status: 'draft',
          case_release_at: '', submission_deadline_at: ''
        });
        fetchCompetitions();
        setSuccess('Competition created successfully');
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Failed to create competition');
      }
    } catch (e) { setError('Failed to create competition'); }
  };

  const updateCompetition = async (compId, updates) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/competitions/${compId}`, {
        method: 'PATCH',
        credentials: 'include', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchCompetitions();
        setSuccess('Competition updated');
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Failed to update');
      }
    } catch (e) { setError('Failed to update competition'); }
  };

  const deleteCompetition = async (compId) => {
    if (!window.confirm('Are you sure you want to delete this competition?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/competitions/${compId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        fetchCompetitions();
        setSuccess('Competition deleted');
      }
    } catch (e) { setError('Failed to delete competition'); }
  };

  // Case file management functions
  const openCaseManager = async (comp) => {
    setSelectedCompetition(comp);
    await fetchCaseFiles(comp.id);
  };

  const closeCaseManager = () => {
    setSelectedCompetition(null);
    setCaseFiles([]);
  };

  const fetchCaseFiles = async (compId) => {
    setLoadingCaseFiles(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/competitions/${compId}/case-files`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setCaseFiles(data.files || []);
      }
    } catch (e) { 
      console.error('Failed to load case files:', e);
    }
    setLoadingCaseFiles(false);
  };

  const uploadCaseFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCompetition) return;

    setUploadingCase(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(
        `${BACKEND_URL}/api/admin/competitions/${selectedCompetition.id}/case-files`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData
        }
      );

      if (res.ok) {
        setSuccess('Case file uploaded successfully');
        await fetchCaseFiles(selectedCompetition.id);
      } else {
        const errData = await res.json();
        setError(errData.detail || 'Failed to upload file');
      }
    } catch (e) {
      setError('Failed to upload case file');
    }

    setUploadingCase(false);
    if (caseFileInputRef.current) {
      caseFileInputRef.current.value = '';
    }
  };

  const deleteCaseFile = async (fileName) => {
    if (!window.confirm(`Delete "${fileName}"?`)) return;
    
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/admin/competitions/${selectedCompetition.id}/case-files/${encodeURIComponent(fileName)}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      if (res.ok) {
        setSuccess('File deleted');
        await fetchCaseFiles(selectedCompetition.id);
      } else {
        setError('Failed to delete file');
      }
    } catch (e) {
      setError('Failed to delete file');
    }
  };

  const updateTimers = async (compId, caseRelease, submissionDeadline) => {
    await updateCompetition(compId, {
      case_release_at: caseRelease || null,
      submission_deadline_at: submissionDeadline || null
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  const formatDateTimeInput = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'competitions', label: 'Competitions' },
    { id: 'levels', label: 'Levels & Tasks' },
    { id: 'observer', label: 'Team Observer' },
    { id: 'team-chats', label: 'Team Chats' },
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-white">Mod<span className="text-blue-500">EX</span></Link>
            <span className="text-gray-400">Admin Dashboard</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">{user?.full_name}</span>
            <button onClick={logout} className="text-gray-400 hover:text-white">Logout</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex space-x-1 mb-6 bg-gray-800 rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded mb-4 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-white">{stats.total_users}</div>
              <div className="text-gray-400">Total Users</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-white">{stats.total_competitions}</div>
              <div className="text-gray-400">Competitions</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-white">{stats.total_teams}</div>
              <div className="text-gray-400">Teams</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-400">{stats.pending_applications}</div>
              <div className="text-gray-400">Pending Applications</div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">CFO Qualified</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-750">
                    <td className="px-4 py-3 text-white">{u.full_name}</td>
                    <td className="px-4 py-3 text-gray-300">{u.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                      >
                        <option value="participant">Participant</option>
                        <option value="judge">Judge</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${u.is_cfo_qualified ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                        {u.is_cfo_qualified ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => updateUserRole(u.id, u.role)} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Competitions Tab */}
        {activeTab === 'competitions' && (
          <div className="space-y-6">
            {/* Create Competition Form */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Create New Competition</h3>
              <form onSubmit={createCompetition} className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Title" 
                  value={newComp.title} 
                  onChange={e => setNewComp({...newComp, title: e.target.value})} 
                  className="bg-gray-700 text-white rounded px-3 py-2" 
                  required 
                />
                <input 
                  type="number" 
                  placeholder="Max Teams" 
                  value={newComp.max_teams} 
                  onChange={e => setNewComp({...newComp, max_teams: parseInt(e.target.value)})} 
                  className="bg-gray-700 text-white rounded px-3 py-2" 
                />
                <textarea 
                  placeholder="Description" 
                  value={newComp.description} 
                  onChange={e => setNewComp({...newComp, description: e.target.value})} 
                  className="bg-gray-700 text-white rounded px-3 py-2 col-span-2" 
                  rows="2" 
                />
                <div>
                  <label className="text-gray-400 text-sm">Registration Start</label>
                  <input 
                    type="date" 
                    value={newComp.registration_start} 
                    onChange={e => setNewComp({...newComp, registration_start: e.target.value})} 
                    className="bg-gray-700 text-white rounded px-3 py-2 w-full" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Registration End</label>
                  <input 
                    type="date" 
                    value={newComp.registration_end} 
                    onChange={e => setNewComp({...newComp, registration_end: e.target.value})} 
                    className="bg-gray-700 text-white rounded px-3 py-2 w-full" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Competition Start</label>
                  <input 
                    type="date" 
                    value={newComp.competition_start} 
                    onChange={e => setNewComp({...newComp, competition_start: e.target.value})} 
                    className="bg-gray-700 text-white rounded px-3 py-2 w-full" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Competition End</label>
                  <input 
                    type="date" 
                    value={newComp.competition_end} 
                    onChange={e => setNewComp({...newComp, competition_end: e.target.value})} 
                    className="bg-gray-700 text-white rounded px-3 py-2 w-full" 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 col-span-2"
                >
                  Create Competition
                </button>
              </form>
            </div>

            {/* Competitions List */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Case Release</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Submission Deadline</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {competitions.map(c => (
                    <tr key={c.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 text-white font-medium">{c.title}</td>
                      <td className="px-4 py-3">
                        <select
                          value={c.status}
                          onChange={(e) => updateCompetition(c.id, { status: e.target.value })}
                          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                        >
                          <option value="draft">Draft</option>
                          <option value="registration_open">Registration Open</option>
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="datetime-local"
                          value={formatDateTimeInput(c.case_release_at)}
                          onChange={(e) => updateTimers(c.id, e.target.value, c.submission_deadline_at)}
                          className="bg-gray-700 text-white rounded px-2 py-1 text-sm w-48"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="datetime-local"
                          value={formatDateTimeInput(c.submission_deadline_at)}
                          onChange={(e) => updateTimers(c.id, c.case_release_at, e.target.value)}
                          className="bg-gray-700 text-white rounded px-2 py-1 text-sm w-48"
                        />
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button 
                          onClick={() => openCaseManager(c)} 
                          className="text-yellow-400 hover:text-yellow-300 text-sm inline-flex items-center"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Case Files
                        </button>
                        <button 
                          onClick={() => deleteCompetition(c.id)} 
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {loading && <div className="text-center py-8 text-gray-400">Loading...</div>}
      </div>

      {/* Case File Manager Modal */}
      {selectedCompetition && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Case Files</h3>
                <p className="text-sm text-gray-400">{selectedCompetition.title}</p>
              </div>
              <button 
                onClick={closeCaseManager}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {/* Timer Settings */}
              <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-400" />
                  Timer Settings
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Case Release Time</label>
                    <input
                      type="datetime-local"
                      value={formatDateTimeInput(selectedCompetition.case_release_at)}
                      onChange={(e) => {
                        updateTimers(selectedCompetition.id, e.target.value, selectedCompetition.submission_deadline_at);
                        setSelectedCompetition({...selectedCompetition, case_release_at: e.target.value});
                      }}
                      className="bg-gray-700 text-white rounded px-3 py-2 w-full text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Teams can download case after this time</p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm block mb-1">Submission Deadline</label>
                    <input
                      type="datetime-local"
                      value={formatDateTimeInput(selectedCompetition.submission_deadline_at)}
                      onChange={(e) => {
                        updateTimers(selectedCompetition.id, selectedCompetition.case_release_at, e.target.value);
                        setSelectedCompetition({...selectedCompetition, submission_deadline_at: e.target.value});
                      }}
                      className="bg-gray-700 text-white rounded px-3 py-2 w-full text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Teams cannot submit after this time</p>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="mb-6">
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-green-400" />
                  Upload Case Files
                </h4>
                <div className="flex items-center space-x-4">
                  <input
                    ref={caseFileInputRef}
                    type="file"
                    onChange={uploadCaseFile}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.zip"
                    className="hidden"
                  />
                  <button
                    onClick={() => caseFileInputRef.current?.click()}
                    disabled={uploadingCase}
                    className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {uploadingCase ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </button>
                  <span className="text-gray-400 text-sm">PDF, DOC, DOCX, XLS, XLSX, ZIP</span>
                </div>
              </div>

              {/* Files List */}
              <div>
                <h4 className="text-white font-medium mb-3 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-yellow-400" />
                  Uploaded Files
                </h4>
                
                {loadingCaseFiles ? (
                  <div className="text-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-gray-400 mx-auto" />
                  </div>
                ) : caseFiles.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-700/30 rounded-lg">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    No case files uploaded yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {caseFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between bg-gray-700/50 rounded-lg px-4 py-3"
                      >
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-blue-400 mr-3" />
                          <div>
                            <p className="text-white font-medium">{file.name}</p>
                            {file.size > 0 && (
                              <p className="text-gray-400 text-xs">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCaseFile(file.name)}
                          className="text-red-400 hover:text-red-300 p-2"
                          title="Delete file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Levels & Tasks Tab */}
        {activeTab === 'levels' && (
          <div className="space-y-6">
            {/* Competition Selector for Level Management */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Layers className="w-5 h-5 mr-2 text-blue-400" />
                Select Competition to Manage Levels
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {competitions.map(comp => (
                  <button
                    key={comp.id}
                    onClick={() => setLevelManagerComp(comp)}
                    className={`text-left px-4 py-3 rounded-lg border-2 transition-all ${
                      levelManagerComp?.id === comp.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
                    }`}
                  >
                    <div className="font-medium text-white">{comp.title}</div>
                    <div className="text-sm text-gray-400">
                      Level {comp.current_level || 1} • {comp.status}
                    </div>
                  </button>
                ))}
              </div>
              {competitions.length === 0 && (
                <p className="text-gray-400 text-center py-4">No competitions found. Create one first.</p>
              )}
            </div>

            {/* Level Manager Component */}
            {levelManagerComp && (
              <AdminLevelManager competition={levelManagerComp} />
            )}
          </div>
        )}

        {/* Team Chats Tab */}
        {activeTab === 'team-chats' && (
          <AdminTeamChat />
        )}

        {/* Team Observer Tab */}
        {activeTab === 'observer' && (
          <div className="space-y-6">
            {/* Competition Selector for Team Observer */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                <Settings className="w-5 h-5 mr-2 text-purple-400" />
                Select Competition to View Teams
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {competitions.map(comp => (
                  <button
                    key={comp.id}
                    onClick={() => fetchAllTeams(comp.id)}
                    className="text-left px-4 py-3 rounded-lg border-2 transition-all border-gray-600 hover:border-purple-500 bg-gray-700/50"
                  >
                    <div className="font-medium text-white">{comp.title}</div>
                    <div className="text-sm text-gray-400">
                      Level {comp.current_level || 1} • {comp.status}
                    </div>
                  </button>
                ))}
              </div>
              {competitions.length === 0 && (
                <p className="text-gray-400 text-center py-4">No competitions found.</p>
              )}
            </div>

            {/* Teams List */}
            {allTeams.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-4">Teams</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allTeams.map(team => (
                    <div
                      key={team.id}
                      className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-purple-500 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-white">{team.team_name}</p>
                          <p className="text-sm text-gray-400">
                            {team.team_members?.[0]?.count || 0} members
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          team.status === 'complete' 
                            ? 'bg-green-900/50 text-green-400' 
                            : 'bg-yellow-900/50 text-yellow-400'
                        }`}>
                          {team.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          Submissions: {team.submission_count || 0}
                        </span>
                        <button
                          onClick={() => setObservingTeamId(team.id)}
                          className="text-purple-400 hover:text-purple-300 font-medium flex items-center"
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          Observe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Observer Modal */}
        {observingTeamId && (
          <AdminTeamObserver 
            teamId={observingTeamId} 
            onClose={() => setObservingTeamId(null)} 
          />
        )}
    </div>
  );
}

export default AdminDashboard;
