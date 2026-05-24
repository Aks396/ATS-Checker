'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, 
  Plus, 
  Trash2, 
  X, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Link2, 
  ChevronRight, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { api } from '@/lib/api';

interface Resume {
  id: number;
  filename: string;
}

interface ApplicationTask {
  id: number;
  title: string;
  is_completed: boolean;
  due_date: string | null;
}

interface JobApplication {
  id: number;
  company: string;
  title: string;
  status: 'wishlist' | 'applied' | 'interviewing' | 'offer' | 'rejected';
  job_description: string | null;
  salary: string | null;
  location: string | null;
  url: string | null;
  resume_id: number | null;
  match_score: number;
  tasks: ApplicationTask[];
  created_at: string;
}

const COLUMNS: { id: JobApplication['status']; label: string; color: string; border: string; bg: string }[] = [
  { id: 'wishlist', label: 'Wishlist', color: 'text-purple-400', border: 'border-purple-500/20', bg: 'bg-purple-500/5' },
  { id: 'applied', label: 'Applied', color: 'text-blue-400', border: 'border-blue-500/20', bg: 'bg-blue-500/5' },
  { id: 'interviewing', label: 'Interviewing', color: 'text-amber-400', border: 'border-amber-500/20', bg: 'bg-amber-500/5' },
  { id: 'offer', label: 'Offer Received', color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/5' },
  { id: 'rejected', label: 'Archive / No Fit', color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5' },
];

export default function TrackerPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modals & Panels state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);

  // New application form state
  const [newCompany, setNewCompany] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newStatus, setNewStatus] = useState<JobApplication['status']>('wishlist');
  const [newSalary, setNewSalary] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newResumeId, setNewResumeId] = useState('');
  const [newJD, setNewJD] = useState('');

  // Side panel Edit fields state
  const [editSalary, setEditSalary] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [editResumeId, setEditResumeId] = useState('');
  const [editJD, setEditJD] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [resumesRes, appsRes] = await Promise.all([
        api.get('/resumes'),
        api.get('/applications')
      ]);
      setResumes(resumesRes.data);
      setApplications(appsRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load workflow state.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.trim() || !newTitle.trim()) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        company: newCompany,
        title: newTitle,
        status: newStatus,
        salary: newSalary || null,
        location: newLocation || null,
        url: newUrl || null,
        resume_id: newResumeId ? Number(newResumeId) : null,
        job_description: newJD || null
      };

      const response = await api.post('/applications', payload);
      setApplications([response.data, ...applications]);
      
      // Reset form
      setNewCompany('');
      setNewTitle('');
      setNewStatus('wishlist');
      setNewSalary('');
      setNewLocation('');
      setNewUrl('');
      setNewResumeId('');
      setNewJD('');
      setAddModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create card.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Move Column Status
  const handleMoveStatus = async (appId: number, nextStatus: JobApplication['status']) => {
    try {
      const response = await api.put(`/applications/${appId}`, { status: nextStatus });
      setApplications(applications.map((app) => (app.id === appId ? { ...app, status: response.data.status } : app)));
      
      // Update selected app ref if open
      if (selectedApp?.id === appId) {
        setSelectedApp((prev) => (prev ? { ...prev, status: response.data.status } : null));
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Update card details from side panel
  const handleUpdateDetails = async () => {
    if (!selectedApp) return;
    try {
      const payload = {
        salary: editSalary || null,
        location: editLocation || null,
        url: editUrl || null,
        resume_id: editResumeId ? Number(editResumeId) : null,
        job_description: editJD || null
      };
      const response = await api.put(`/applications/${selectedApp.id}`, payload);
      
      // Sync list state
      setApplications(applications.map((app) => (app.id === selectedApp.id ? { ...app, ...response.data } : app)));
      setSelectedApp({ ...selectedApp, ...response.data });
      alert('Card details saved successfully.');
    } catch (err) {
      console.error('Failed to update details:', err);
    }
  };

  // Delete card
  const handleDeleteApp = async (appId: number) => {
    if (!confirm('Are you sure you want to delete this job application card?')) return;
    try {
      await api.delete(`/applications/${appId}`);
      setApplications(applications.filter((app) => app.id !== appId));
      setSelectedApp(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Tasks Management inside Side Panel
  const handleAddTask = async () => {
    if (!selectedApp || !newTaskTitle.trim()) return;
    try {
      const response = await api.post(`/applications/${selectedApp.id}/tasks`, {
        title: newTaskTitle.trim()
      });
      const updatedTasks = [...(selectedApp.tasks || []), response.data];
      const updatedApp = { ...selectedApp, tasks: updatedTasks };
      
      setSelectedApp(updatedApp);
      setApplications(applications.map((app) => (app.id === selectedApp.id ? updatedApp : app)));
      setNewTaskTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    if (!selectedApp) return;
    try {
      const response = await api.put(`/applications/tasks/${taskId}`);
      const updatedTasks = selectedApp.tasks.map((t) => (t.id === taskId ? response.data : t));
      const updatedApp = { ...selectedApp, tasks: updatedTasks };
      
      setSelectedApp(updatedApp);
      setApplications(applications.map((app) => (app.id === selectedApp.id ? updatedApp : app)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!selectedApp) return;
    try {
      await api.delete(`/applications/tasks/${taskId}`);
      const updatedTasks = selectedApp.tasks.filter((t) => t.id !== taskId);
      const updatedApp = { ...selectedApp, tasks: updatedTasks };
      
      setSelectedApp(updatedApp);
      setApplications(applications.map((app) => (app.id === selectedApp.id ? updatedApp : app)));
    } catch (err) {
      console.error(err);
    }
  };

  const openAppDetails = (app: JobApplication) => {
    setSelectedApp(app);
    setEditSalary(app.salary || '');
    setEditLocation(app.location || '');
    setEditUrl(app.url || '');
    setEditResumeId(app.resume_id ? app.resume_id.toString() : '');
    setEditJD(app.job_description || '');
  };

  return (
    <div className="space-y-8 relative h-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Layers className="text-purple-500 w-8 h-8" />
            Application Kanban Tracker
          </h1>
          <p className="text-sm text-gray-400">
            A Linear-like tracking interface. Manage stages, JDs, linked resume matching indexes, and checklist items.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Job Card
        </button>
      </div>

      {isLoading ? (
        <div className="h-[50vh] flex flex-col justify-center items-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
          <p className="text-sm text-gray-400 font-mono">SYNCHRONIZING BOARD STAGE TELEMETRY...</p>
        </div>
      ) : (
        /* Columns Grid */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-6">
          {COLUMNS.map((col) => {
            const colApps = applications.filter((app) => app.status === col.id);
            return (
              <div 
                key={col.id} 
                className={`glass-card p-4 border border-white/5 bg-[#0b0a17]/35 flex flex-col space-y-4 min-h-[70vh] rounded-2xl w-full min-w-[240px]`}
              >
                {/* Column Title */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className={`text-xs font-bold uppercase tracking-wider ${col.color}`}>
                    {col.label}
                  </span>
                  <span className="text-[10px] font-mono bg-white/5 text-gray-400 px-2 py-0.5 rounded">
                    {colApps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-grow overflow-y-auto">
                  <AnimatePresence mode="popLayout">
                    {colApps.map((app) => {
                      const completedTasks = app.tasks?.filter((t) => t.is_completed).length || 0;
                      const totalTasks = app.tasks?.length || 0;
                      
                      return (
                        <motion.div
                          key={app.id}
                          layoutId={`card-${app.id}`}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          className="glass-card p-4 border-white/5 bg-black/40 hover:bg-[#121124]/40 hover:border-purple-500/20 cursor-pointer relative group flex flex-col justify-between space-y-3"
                          onClick={() => openAppDetails(app)}
                        >
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors truncate">
                              {app.company}
                            </h4>
                            <p className="text-xs text-gray-400 truncate">
                              {app.title}
                            </p>
                          </div>

                          {/* Quick details */}
                          <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                            {app.salary && (
                              <span className="flex items-center gap-0.5 bg-white/3 px-1.5 py-0.5 rounded">
                                <DollarSign className="w-2.5 h-2.5" />
                                {app.salary}
                              </span>
                            )}
                            {app.location && (
                              <span className="flex items-center gap-0.5 bg-white/3 px-1.5 py-0.5 rounded max-w-[120px] truncate">
                                <MapPin className="w-2.5 h-2.5" />
                                {app.location}
                              </span>
                            )}
                          </div>

                          {/* Task checklist indicator */}
                          {totalTasks > 0 && (
                            <div className="space-y-1.5 pt-1 border-t border-white/5">
                              <div className="flex justify-between text-[9px] text-gray-500 font-mono">
                                <span>TASKS</span>
                                <span>{completedTasks}/{totalTasks}</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300"
                                  style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Match Index and quick move options */}
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            {app.resume_id ? (
                              <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-medium">
                                <TrendingUp className="w-3 h-3" />
                                {app.match_score > 0 ? `${Math.round(app.match_score)}% fit` : '0% fit'}
                              </span>
                            ) : (
                              <span className="text-[9px] text-gray-500 italic">No resume linked</span>
                            )}

                            {/* Quick Stage shifting */}
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <button
                                disabled={col.id === 'wishlist'}
                                onClick={() => {
                                  const idx = COLUMNS.findIndex((c) => c.id === col.id);
                                  handleMoveStatus(app.id, COLUMNS[idx - 1].id);
                                }}
                                className="p-1 bg-white/5 border border-white/5 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-white/5 cursor-pointer text-gray-400"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                              <button
                                disabled={col.id === 'rejected'}
                                onClick={() => {
                                  const idx = COLUMNS.findIndex((c) => c.id === col.id);
                                  handleMoveStatus(app.id, COLUMNS[idx + 1].id);
                                }}
                                className="p-1 bg-white/5 border border-white/5 hover:bg-white/10 rounded disabled:opacity-30 disabled:hover:bg-white/5 cursor-pointer text-gray-400"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                  {colApps.length === 0 && (
                    <div className="h-24 border border-dashed border-white/5 flex items-center justify-center rounded-xl">
                      <span className="text-[10px] text-gray-600 font-mono">EMPTY STAGE</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Slide Out Edit Details Panel */}
      <AnimatePresence>
        {selectedApp && (
          <div className="fixed inset-0 z-40 overflow-hidden flex justify-end">
            {/* Overlay background */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedApp(null)}
            />

            {/* Slide Out Panel body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="w-full max-w-lg bg-[#0b0a17] border-l border-white/10 h-full relative z-50 shadow-2xl flex flex-col justify-between"
            >
              {/* Panel Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                <div>
                  <h3 className="text-base font-bold text-white truncate">{selectedApp.company}</h3>
                  <p className="text-xs text-gray-400 truncate">{selectedApp.title}</p>
                </div>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Panel Scrollable Content */}
              <div className="flex-grow p-6 space-y-6 overflow-y-auto">
                
                {/* Column stage selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-gray-500 uppercase">Board Stage</label>
                  <select
                    value={selectedApp.status}
                    onChange={(e) => handleMoveStatus(selectedApp.id, e.target.value as any)}
                    className="w-full glass-input text-xs"
                  >
                    {COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-gray-500 uppercase">Salary (Mock)</label>
                    <input
                      type="text"
                      value={editSalary}
                      onChange={(e) => setEditSalary(e.target.value)}
                      placeholder="e.g. $140,000"
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono text-gray-500 uppercase">Location</label>
                    <input
                      type="text"
                      value={editLocation}
                      onChange={(e) => setEditLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-500 uppercase">Job Link</label>
                  <input
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://company.careers/job..."
                    className="w-full glass-input text-xs"
                  />
                </div>

                {/* Link Resume */}
                <div className="space-y-1.5">
                  <label className="text-xs font-mono text-gray-500 uppercase">Associated Resume</label>
                  <select
                    value={editResumeId}
                    onChange={(e) => setEditResumeId(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    <option value="">-- Unlinked --</option>
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.filename}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Checklist Task items */}
                <div className="space-y-3 border-t border-white/5 pt-4">
                  <label className="text-xs font-mono text-gray-500 uppercase block">Preparation Tasks & Checklist</label>
                  
                  {/* Task Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                      placeholder="Add interview review step..."
                      className="flex-grow glass-input text-xs py-1.5"
                    />
                    <button
                      onClick={handleAddTask}
                      className="p-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-white cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2">
                    {selectedApp.tasks && selectedApp.tasks.length > 0 ? (
                      selectedApp.tasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-2.5 bg-white/2 border border-white/5 rounded-lg group/task">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={task.is_completed}
                              onChange={() => handleToggleTask(task.id)}
                              className="rounded border-white/10 text-purple-600 focus:ring-0 focus:ring-offset-0 bg-transparent cursor-pointer w-4 h-4"
                            />
                            <span className={`text-xs ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                              {task.title}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="opacity-0 group-hover/task:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-600 font-mono italic">No tasks created. Add steps above.</span>
                    )}
                  </div>
                </div>

                {/* Job Description text */}
                <div className="space-y-1.5 border-t border-white/5 pt-4">
                  <label className="text-xs font-mono text-gray-500 uppercase">Target Job Description</label>
                  <textarea
                    value={editJD}
                    onChange={(e) => setEditJD(e.target.value)}
                    placeholder="Paste job details or specifications here to allow ATS score alignment..."
                    className="w-full h-36 glass-input text-xs leading-normal font-sans resize-y"
                  />
                </div>

              </div>

              {/* Panel Footer Controls */}
              <div className="p-6 border-t border-white/5 bg-black/20 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleDeleteApp(selectedApp.id)}
                  className="flex items-center gap-1.5 px-3 py-2 border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Card
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedApp(null)}
                    className="px-3 py-2 border border-white/5 text-gray-400 hover:text-white rounded-lg text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateDetails}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Job Card Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl glass-card bg-[#0b0a17] border-white/10 p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-purple-500" />
                  Add Job Application Card
                </h3>
                <button 
                  onClick={() => setAddModalOpen(false)}
                  className="text-gray-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateApp} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      placeholder="e.g. Stripe"
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Role / Title *</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Staff Full Stack Engineer"
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Stage</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full glass-input text-xs"
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Salary (Mock)</label>
                    <input
                      type="text"
                      value={newSalary}
                      onChange={(e) => setNewSalary(e.target.value)}
                      placeholder="e.g. $140,000"
                      className="w-full glass-input text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Location</label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="e.g. Remote, USA"
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Link Resume</label>
                    <select
                      value={newResumeId}
                      onChange={(e) => setNewResumeId(e.target.value)}
                      className="w-full glass-input text-xs"
                    >
                      <option value="">-- Choose Resume --</option>
                      {resumes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.filename}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-gray-500 uppercase">Job Application URL</label>
                    <input
                      type="url"
                      value={newUrl}
                      onChange={(e) => setNewUrl(e.target.value)}
                      placeholder="https://company.com/careers/..."
                      className="w-full glass-input text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-gray-500 uppercase">Job Description Specifications</label>
                  <textarea
                    value={newJD}
                    onChange={(e) => setNewJD(e.target.value)}
                    placeholder="Paste job details or specifications here to allow ATS score alignment..."
                    className="w-full h-24 glass-input text-xs leading-normal font-sans"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 border border-white/5 text-gray-400 hover:text-white rounded-lg text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Create Card
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
