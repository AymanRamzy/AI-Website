/**
 * AdminLevelManager - Admin interface for managing competition levels
 * PHASE 2-4: Multi-level task management with criteria-based scoring
 */
import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Layers,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  FileSpreadsheet,
  FileText,
  Video,
  AlertCircle,
  CheckCircle,
  Loader,
  Settings,
  Award
} from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const LEVEL_CONFIG = {
  1: { name: 'Level 1 - Qualification', color: 'bg-blue-500' },
  2: { name: 'Level 2 - Financial Modeling & Case Study', color: 'bg-green-500' },
  3: { name: 'Level 3 - Strategic Decision Simulation', color: 'bg-yellow-500' },
  4: { name: 'Level 4 - Final Video Presentation', color: 'bg-purple-500' }
};

const FILE_TYPE_OPTIONS = [
  { value: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
  { value: 'xlsm', label: 'Excel Macro (.xlsm)', icon: FileSpreadsheet },
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'docx', label: 'Word (.docx)', icon: FileText },
  { value: 'mp4', label: 'Video (.mp4)', icon: Video },
  { value: 'mov', label: 'Video (.mov)', icon: Video }
];

function AdminLevelManager({ competition }) {
  const [tasks, setTasks] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCriteriaModal, setShowCriteriaModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingCriterion, setEditingCriterion] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(competition?.current_level || 1);

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    level: 2,
    deadline: '',
    allowed_file_types: ['pdf', 'xlsx'],
    max_points: 100,
    constraints_text: '',
    assumptions_policy: '',
    requirements_text: ''
  });

  // Criterion form state
  const [criterionForm, setCriterionForm] = useState({
    name: '',
    description: '',
    weight: 20,
    applies_to_levels: [2, 3, 4]
  });

  useEffect(() => {
    if (competition?.id) {
      loadData();
    }
  }, [competition?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tasksRes, criteriaRes] = await Promise.all([
        axios.get(`${API_URL}/api/admin/competitions/${competition.id}/tasks`, { withCredentials: true }),
        axios.get(`${API_URL}/api/admin/competitions/${competition.id}/criteria`, { withCredentials: true }).catch(() => ({ data: [] }))
      ]);
      setTasks(tasksRes.data || []);
      setCriteria(criteriaRes.data || []);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const updateCompetitionLevel = async (level) => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/competitions/${competition.id}`,
        { current_level: level },
        { withCredentials: true }
      );
      setCurrentLevel(level);
      setSuccess(`Competition advanced to Level ${level}`);
    } catch (err) {
      setError('Failed to update level');
    }
  };

  const openTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskForm({
        title: task.title || '',
        description: task.description || '',
        level: task.level || 2,
        deadline: task.deadline ? task.deadline.slice(0, 16) : '',
        allowed_file_types: task.allowed_file_types || ['pdf', 'xlsx'],
        max_points: task.max_points || 100,
        constraints_text: task.constraints_text || '',
        assumptions_policy: task.assumptions_policy || '',
        requirements_text: task.requirements_text || ''
      });
    } else {
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        level: currentLevel,
        deadline: '',
        allowed_file_types: ['pdf', 'xlsx'],
        max_points: 100,
        constraints_text: '',
        assumptions_policy: '',
        requirements_text: ''
      });
    }
    setShowTaskModal(true);
  };

  const saveTask = async () => {
    setError('');
    try {
      const payload = {
        ...taskForm,
        competition_id: competition.id,
        deadline: taskForm.deadline ? new Date(taskForm.deadline).toISOString() : null
      };

      if (editingTask) {
        await axios.patch(
          `${API_URL}/api/admin/competitions/${competition.id}/tasks/${editingTask.id}`,
          payload,
          { withCredentials: true }
        );
        setSuccess('Task updated');
      } else {
        await axios.post(
          `${API_URL}/api/admin/competitions/${competition.id}/tasks`,
          payload,
          { withCredentials: true }
        );
        setSuccess('Task created');
      }
      setShowTaskModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save task');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(
        `${API_URL}/api/admin/competitions/${competition.id}/tasks/${taskId}`,
        { withCredentials: true }
      );
      setSuccess('Task deleted');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Cannot delete task with submissions');
    }
  };

  const openCriteriaModal = (criterion = null) => {
    if (criterion) {
      setEditingCriterion(criterion);
      setCriterionForm({
        name: criterion.name || '',
        description: criterion.description || '',
        weight: criterion.weight || 20,
        applies_to_levels: criterion.applies_to_levels || [2, 3, 4]
      });
    } else {
      setEditingCriterion(null);
      setCriterionForm({
        name: '',
        description: '',
        weight: 20,
        applies_to_levels: [2, 3, 4]
      });
    }
    setShowCriteriaModal(true);
  };

  const saveCriterion = async () => {
    setError('');
    try {
      const payload = {
        ...criterionForm,
        competition_id: competition.id
      };

      if (editingCriterion) {
        await axios.patch(
          `${API_URL}/api/admin/competitions/${competition.id}/criteria/${editingCriterion.id}`,
          payload,
          { withCredentials: true }
        );
        setSuccess('Criterion updated');
      } else {
        await axios.post(
          `${API_URL}/api/admin/competitions/${competition.id}/criteria`,
          payload,
          { withCredentials: true }
        );
        setSuccess('Criterion added');
      }
      setShowCriteriaModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save criterion');
    }
  };

  const toggleFileType = (fileType) => {
    setTaskForm(prev => {
      const types = prev.allowed_file_types.includes(fileType)
        ? prev.allowed_file_types.filter(t => t !== fileType)
        : [...prev.allowed_file_types, fileType];
      return { ...prev, allowed_file_types: types };
    });
  };

  const toggleAppliesLevel = (level) => {
    setCriterionForm(prev => {
      const levels = prev.applies_to_levels.includes(level)
        ? prev.applies_to_levels.filter(l => l !== level)
        : [...prev.applies_to_levels, level];
      return { ...prev, applies_to_levels: levels };
    });
  };

  const getTasksByLevel = (level) => tasks.filter(t => t.level === level);
  const totalWeight = criteria.reduce((sum, c) => sum + (c.weight || 0), 0);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <Loader className="w-8 h-8 animate-spin text-gray-400 mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          {success}
          <button onClick={() => setSuccess('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Current Level Control */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-800 flex items-center">
            <Layers className="w-5 h-5 mr-2 text-modex-secondary" />
            Competition Level
          </h3>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(level => (
            <button
              key={level}
              onClick={() => updateCompetitionLevel(level)}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                currentLevel === level
                  ? `${LEVEL_CONFIG[level].color} text-white`
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {LEVEL_CONFIG[level].name}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 mt-3">
          Current active level determines which tasks teams can submit to.
        </p>
      </div>

      {/* Scoring Criteria */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg text-gray-800 flex items-center">
            <Award className="w-5 h-5 mr-2 text-yellow-500" />
            Scoring Criteria
            <span className={`ml-2 text-sm font-normal ${totalWeight === 100 ? 'text-green-600' : 'text-red-600'}`}>
              (Total: {totalWeight}%)
            </span>
          </h3>
          <button
            onClick={() => openCriteriaModal()}
            className="bg-modex-secondary text-white px-4 py-2 rounded-lg font-medium hover:bg-modex-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Criterion
          </button>
        </div>
        <div className="space-y-2">
          {criteria.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No scoring criteria defined. Default criteria will be used.</p>
          ) : (
            criteria.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <span className="ml-2 text-sm text-gray-500">({c.weight}%)</span>
                  <p className="text-xs text-gray-400">{c.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => openCriteriaModal(c)} className="text-blue-600 hover:text-blue-800">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tasks by Level */}
      {[2, 3, 4].map(level => (
        <div key={level} className="bg-white rounded-xl border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-800">
              <span className={`inline-block w-3 h-3 rounded-full ${LEVEL_CONFIG[level].color} mr-2`}></span>
              {LEVEL_CONFIG[level].name} Tasks
            </h3>
            <button
              onClick={() => {
                setTaskForm(prev => ({ ...prev, level }));
                openTaskModal();
              }}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-200 flex items-center text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </button>
          </div>
          {getTasksByLevel(level).length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No tasks for this level yet.</p>
          ) : (
            <div className="space-y-3">
              {getTasksByLevel(level).map(task => (
                <div key={task.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{task.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(task.allowed_file_types || []).map(ft => (
                          <span key={ft} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                            .{ft}
                          </span>
                        ))}
                      </div>
                      {task.deadline && (
                        <p className="text-xs text-gray-500 mt-2">
                          Deadline: {new Date(task.deadline).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => openTaskModal(task)} className="text-blue-600 hover:text-blue-800">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteTask(task.id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                  {editingTask ? 'Edit Task' : 'Create Task'}
                </h3>
                <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none"
                  placeholder="e.g., Financial Model"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none resize-none"
                  rows="3"
                  placeholder="Task description and requirements..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                  <select
                    value={taskForm.level}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, level: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none"
                  >
                    {[2, 3, 4].map(l => (
                      <option key={l} value={l}>Level {l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                  <input
                    type="datetime-local"
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Allowed File Types</label>
                <div className="flex flex-wrap gap-2">
                  {FILE_TYPE_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleFileType(opt.value)}
                        className={`flex items-center px-3 py-2 rounded-lg border transition-colors ${
                          taskForm.allowed_file_types.includes(opt.value)
                            ? 'border-modex-secondary bg-modex-secondary/10 text-modex-secondary'
                            : 'border-gray-300 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Level 3 specific fields */}
              {taskForm.level === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Constraints (displayed to teams)</label>
                    <textarea
                      value={taskForm.constraints_text}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, constraints_text: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none resize-none"
                      rows="2"
                      placeholder="List the constraints teams must work within..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assumptions Policy</label>
                    <textarea
                      value={taskForm.assumptions_policy}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, assumptions_policy: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none resize-none"
                      rows="2"
                      placeholder="What assumptions are allowed/not allowed..."
                    />
                  </div>
                </>
              )}
              {/* Level 4 specific fields */}
              {taskForm.level === 4 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video Requirements</label>
                  <textarea
                    value={taskForm.requirements_text}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, requirements_text: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none resize-none"
                    rows="4"
                    placeholder="• Case overview + objectives
• Assumptions + financial logic
• Decisions + alternatives
• Risks/opportunities + conclusions"
                  />
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowTaskModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveTask}
                className="px-6 py-2 bg-modex-secondary text-white rounded-lg font-medium hover:bg-modex-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Criteria Modal */}
      {showCriteriaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800">
                  {editingCriterion ? 'Edit Criterion' : 'Add Scoring Criterion'}
                </h3>
                <button onClick={() => setShowCriteriaModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={criterionForm.name}
                  onChange={(e) => setCriterionForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none"
                  placeholder="e.g., Accuracy of Analysis"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={criterionForm.description}
                  onChange={(e) => setCriterionForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none resize-none"
                  rows="2"
                  placeholder="What does this criterion measure?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={criterionForm.weight}
                  onChange={(e) => setCriterionForm(prev => ({ ...prev, weight: Number(e.target.value) }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:border-modex-secondary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Applies to Levels</label>
                <div className="flex gap-2">
                  {[2, 3, 4].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => toggleAppliesLevel(level)}
                      className={`px-4 py-2 rounded-lg border transition-colors ${
                        criterionForm.applies_to_levels.includes(level)
                          ? 'border-modex-secondary bg-modex-secondary/10 text-modex-secondary'
                          : 'border-gray-300 text-gray-600 hover:border-gray-400'
                      }`}
                    >
                      Level {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowCriteriaModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={saveCriterion}
                className="px-6 py-2 bg-modex-secondary text-white rounded-lg font-medium hover:bg-modex-primary flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLevelManager;
