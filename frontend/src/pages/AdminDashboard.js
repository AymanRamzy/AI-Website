import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingComp, setEditingComp] = useState(null);
  const [newComp, setNewComp] = useState({ title: '', description: '', registration_start: '', registration_end: '', competition_start: '', competition_end: '', max_teams: 8, status: 'draft' });

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

  const fetchStats = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setStats(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setUsers(await res.json());
    } catch (e) { setError('Failed to load users'); }
    setLoading(false);
  };

  const fetchCompetitions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/competitions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setCompetitions(await res.json());
    } catch (e) { setError('Failed to load competitions'); }
    setLoading(false);
  };

  const updateUserRole = async (userId, role) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      if (res.ok) fetchUsers();
    } catch (e) { setError('Failed to update user'); }
  };

  const createCompetition = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/competitions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newComp)
      });
      if (res.ok) {
        setNewComp({ title: '', description: '', registration_start: '', registration_end: '', competition_start: '', competition_end: '', max_teams: 8, status: 'draft' });
        fetchCompetitions();
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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setEditingComp(null);
        fetchCompetitions();
      }
    } catch (e) { setError('Failed to update competition'); }
  };

  const deleteCompetition = async (compId) => {
    if (!window.confirm('Are you sure you want to delete this competition?')) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/competitions/${compId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchCompetitions();
    } catch (e) { setError('Failed to delete competition'); }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users' },
    { id: 'competitions', label: 'Competitions' },
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

        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">{error}</div>}

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

        {activeTab === 'competitions' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-medium text-white mb-4">Create New Competition</h3>
              <form onSubmit={createCompetition} className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Title" value={newComp.title} onChange={e => setNewComp({...newComp, title: e.target.value})} className="bg-gray-700 text-white rounded px-3 py-2" required />
                <input type="number" placeholder="Max Teams" value={newComp.max_teams} onChange={e => setNewComp({...newComp, max_teams: parseInt(e.target.value)})} className="bg-gray-700 text-white rounded px-3 py-2" />
                <textarea placeholder="Description" value={newComp.description} onChange={e => setNewComp({...newComp, description: e.target.value})} className="bg-gray-700 text-white rounded px-3 py-2 col-span-2" rows="2" />
                <div>
                  <label className="text-gray-400 text-sm">Registration Start</label>
                  <input type="date" value={newComp.registration_start} onChange={e => setNewComp({...newComp, registration_start: e.target.value})} className="bg-gray-700 text-white rounded px-3 py-2 w-full" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Registration End</label>
                  <input type="date" value={newComp.registration_end} onChange={e => setNewComp({...newComp, registration_end: e.target.value})} className="bg-gray-700 text-white rounded px-3 py-2 w-full" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Competition Start</label>
                  <input type="date" value={newComp.competition_start} onChange={e => setNewComp({...newComp, competition_start: e.target.value})} className="bg-gray-700 text-white rounded px-3 py-2 w-full" required />
                </div>
                <div>
                  <label className="text-gray-400 text-sm">Competition End</label>
                  <input type="date" value={newComp.competition_end} onChange={e => setNewComp({...newComp, competition_end: e.target.value})} className="bg-gray-700 text-white rounded px-3 py-2 w-full" required />
                </div>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2 col-span-2">Create Competition</button>
              </form>
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Teams</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Dates</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {competitions.map(c => (
                    <tr key={c.id} className="hover:bg-gray-750">
                      <td className="px-4 py-3 text-white">{c.title}</td>
                      <td className="px-4 py-3">
                        <select
                          value={c.status}
                          onChange={(e) => updateCompetition(c.id, { status: e.target.value })}
                          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                        >
                          <option value="draft">Draft</option>
                          <option value="open">Open</option>
                          <option value="closed">Closed</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{c.max_teams}</td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {c.competition_start} - {c.competition_end}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        <button onClick={() => deleteCompetition(c.id)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
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
    </div>
  );
}

export default AdminDashboard;
