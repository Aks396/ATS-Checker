'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  HelpCircle,
  FileEdit,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  FileDown
} from 'lucide-react';
import { api } from '@/lib/api';

interface Resume {
  id: number;
  filename: string;
  ats_score: number;
  parsed_json: Record<string, any>;
}

export default function EditorPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);
  
  // Resume JSON edit state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [experience, setExperience] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [education, setEducation] = useState<any[]>([]);
  
  // Loading states
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // AI Rewrite Modal State
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiTextToRewrite, setAiTextToRewrite] = useState('');
  const [aiCommand, setAiCommand] = useState('');
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteTarget, setRewriteTarget] = useState<{
    type: 'summary' | 'experience' | 'project';
    index?: number;
    subIndex?: number;
  } | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (selectedResumeId) {
      fetchResumeDetails(Number(selectedResumeId));
    } else {
      setSelectedResume(null);
    }
  }, [selectedResumeId]);

  const fetchResumes = async () => {
    setIsLoadingResumes(true);
    try {
      const response = await api.get('/resumes');
      setResumes(response.data);
      if (response.data.length > 0) {
        setSelectedResumeId(response.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
      setErrorMsg('Failed to load candidate resumes.');
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const fetchResumeDetails = async (id: number) => {
    setIsLoadingResume(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await api.get(`/resumes/${id}`);
      const resData = response.data;
      setSelectedResume(resData);
      
      // Populate state fields
      const pj = resData.parsed_json || {};
      setName(pj.name || '');
      setEmail(pj.email || '');
      setPhone(pj.phone || '');
      setSummary(pj.summary || '');
      setSkills(pj.skills || []);
      setExperience(pj.experience || []);
      setProjects(pj.projects || []);
      setEducation(pj.education || []);
    } catch (err) {
      console.error('Failed to fetch resume details:', err);
      setErrorMsg('Failed to load resume details.');
    } finally {
      setIsLoadingResume(false);
    }
  };

  // Add/Remove Skills
  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (indexToRemove: number) => {
    setSkills(skills.filter((_, i) => i !== indexToRemove));
  };

  // Experience Handlers
  const handleAddExperience = () => {
    setExperience([
      ...experience,
      { company: 'New Company', role: 'Role Name', duration: 'Start - Present', highlights: ['Add key accomplishment'] }
    ]);
  };

  const handleRemoveExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const handleExperienceChange = (index: number, field: string, value: any) => {
    const updated = [...experience];
    updated[index][field] = value;
    setExperience(updated);
  };

  const handleAddHighlight = (expIndex: number) => {
    const updated = [...experience];
    updated[expIndex].highlights = [...updated[expIndex].highlights, 'New key accomplishment'];
    setExperience(updated);
  };

  const handleRemoveHighlight = (expIndex: number, highlightIndex: number) => {
    const updated = [...experience];
    updated[expIndex].highlights = updated[expIndex].highlights.filter((_: any, i: number) => i !== highlightIndex);
    setExperience(updated);
  };

  const handleHighlightChange = (expIndex: number, highlightIndex: number, value: string) => {
    const updated = [...experience];
    updated[expIndex].highlights[highlightIndex] = value;
    setExperience(updated);
  };

  // Project Handlers
  const handleAddProject = () => {
    setProjects([
      ...projects,
      { title: 'New Project', description: 'Brief description of project', highlights: ['Key technical detail or outcome'] }
    ]);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleProjectChange = (index: number, field: string, value: any) => {
    const updated = [...projects];
    updated[index][field] = value;
    setProjects(updated);
  };

  const handleAddProjectHighlight = (projIndex: number) => {
    const updated = [...projects];
    updated[projIndex].highlights = [...updated[projIndex].highlights, 'New key detail'];
    setProjects(updated);
  };

  const handleRemoveProjectHighlight = (projIndex: number, highlightIndex: number) => {
    const updated = [...projects];
    updated[projIndex].highlights = updated[projIndex].highlights.filter((_: any, i: number) => i !== highlightIndex);
    setProjects(updated);
  };

  const handleProjectHighlightChange = (projIndex: number, highlightIndex: number, value: string) => {
    const updated = [...projects];
    updated[projIndex].highlights[highlightIndex] = value;
    setProjects(updated);
  };

  // Education Handlers
  const handleAddEducation = () => {
    setEducation([
      ...education,
      { institution: 'University Name', degree: 'B.S.', major: 'Computer Science', graduation_year: '2026' }
    ]);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    const updated = [...education];
    updated[index][field] = value;
    setEducation(updated);
  };

  // AI Rewrite Activation
  const openAiRewrite = (
    text: string, 
    type: 'summary' | 'experience' | 'project', 
    index?: number, 
    subIndex?: number
  ) => {
    setAiTextToRewrite(text);
    setAiCommand('');
    setAiSuggestion('');
    setRewriteTarget({ type, index, subIndex });
    setAiModalOpen(true);
  };

  const triggerAiRewrite = async () => {
    if (!aiCommand.trim()) return;
    setIsRewriting(true);
    setAiSuggestion('');
    try {
      const response = await api.post('/editor/rewrite', {
        text: aiTextToRewrite,
        command: aiCommand
      });
      setAiSuggestion(response.data.rewritten_text);
    } catch (err) {
      console.error(err);
      setAiSuggestion('Error generating AI suggestion. Please check API Key or internet.');
    } finally {
      setIsRewriting(false);
    }
  };

  const acceptAiSuggestion = () => {
    if (!rewriteTarget) return;
    
    if (rewriteTarget.type === 'summary') {
      setSummary(aiSuggestion);
    } else if (rewriteTarget.type === 'experience' && rewriteTarget.index !== undefined && rewriteTarget.subIndex !== undefined) {
      const updated = [...experience];
      updated[rewriteTarget.index].highlights[rewriteTarget.subIndex] = aiSuggestion;
      setExperience(updated);
    } else if (rewriteTarget.type === 'project' && rewriteTarget.index !== undefined && rewriteTarget.subIndex !== undefined) {
      const updated = [...projects];
      updated[rewriteTarget.index].highlights[rewriteTarget.subIndex] = aiSuggestion;
      setProjects(updated);
    }
    
    setAiModalOpen(false);
  };

  // Save Resume Core edits to Backend
  const handleSaveResume = async () => {
    if (!selectedResumeId) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      parsed_json: {
        name,
        email,
        phone,
        summary,
        skills,
        experience,
        projects,
        education
      }
    };

    try {
      const response = await api.post(`/editor/save/${selectedResumeId}`, payload);
      setSuccessMsg(`Draft successfully saved! New ATS score: ${response.data.ats_score}%`);
      setSelectedResume(response.data);
    } catch (err: any) {
      console.error('Failed to save resume:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to save resume revisions.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportPdf = async () => {
    if (!selectedResumeId) return;
    setIsExportingPdf(true);
    try {
      const response = await api.get(`/editor/export/pdf/${selectedResumeId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedResume?.filename.split('.')[0] || 'resume'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccessMsg('PDF exported successfully!');
    } catch (err) {
      console.error('PDF export failed:', err);
      setErrorMsg('Failed to export PDF resume.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportDocx = async () => {
    if (!selectedResumeId) return;
    setIsExportingDocx(true);
    try {
      const response = await api.get(`/editor/export/docx/${selectedResumeId}`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedResume?.filename.split('.')[0] || 'resume'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccessMsg('DOCX exported successfully!');
    } catch (err) {
      console.error('DOCX export failed:', err);
      setErrorMsg('Failed to export DOCX resume.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Top Controls / Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <FileEdit className="text-purple-500 w-8 h-8" />
            Interactive Resume Editor
          </h1>
          <p className="text-sm text-gray-400">
            A Notion-like visual blocks workspace. Focus or hover bullet points to invoke inline AI rewriters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedResumeId}
            onChange={(e) => setSelectedResumeId(e.target.value)}
            className="glass-input text-sm pr-8 py-2 bg-black border border-white/10"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.filename} (ATS: {r.ats_score}%)
              </option>
            ))}
          </select>

          <button
            onClick={handleSaveResume}
            disabled={isSaving || !selectedResumeId}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Version
          </button>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf || !selectedResumeId}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingPdf ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 text-cyan-400" />
            )}
            Export PDF
          </button>

          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx || !selectedResumeId}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingDocx ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 text-purple-400" />
            )}
            Export DOCX
          </button>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex items-center gap-3 text-sm"
          >
            <Check className="w-4 h-4 shrink-0" />
            <div>{successMsg}</div>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>{errorMsg}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Split */}
      {isLoadingResume ? (
        <div className="h-[50vh] flex flex-col justify-center items-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
          <p className="text-sm text-gray-400 font-mono">LOADING RESUME EDITOR SCHEMA...</p>
        </div>
      ) : selectedResume ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Notion Canvas (3/4 Columns) */}
          <div className="lg:col-span-3 space-y-8 glass-card bg-black/40 border-white/5 p-8 sm:p-10 shadow-2xl relative">
            
            {/* Header Identity */}
            <div className="border-b border-white/5 pb-6 space-y-4">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Candidate Full Name"
                className="w-full text-3xl font-bold bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-purple-500/50 focus:ring-0 text-white placeholder-gray-600 px-0 py-1 transition-all outline-none"
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-600">EMAIL:</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="flex-grow bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 px-1 py-0.5 outline-none transition-all"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-gray-600">PHONE:</span>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="flex-grow bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 px-1 py-0.5 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Professional Summary block */}
            <div className="space-y-2 group relative">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Professional Summary</h3>
                <button
                  onClick={() => openAiRewrite(summary, 'summary')}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-300 px-2 py-1 rounded border border-purple-500/30 hover:bg-purple-500/30 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  AI Rewrite
                </button>
              </div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Professional career objectives and core competencies summary..."
                className="w-full min-h-[100px] bg-transparent border-0 border-l-2 border-white/5 focus:border-purple-500/50 focus:ring-0 text-gray-300 placeholder-gray-600 py-1 pl-4 transition-all outline-none resize-y leading-relaxed text-sm"
              />
            </div>

            {/* Technical Skills block */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Core Technical Skills</h3>
              
              <div className="flex flex-wrap gap-2 p-3 bg-white/3 border border-white/5 rounded-xl">
                {skills.map((skill, index) => (
                  <span 
                    key={index} 
                    className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs rounded-lg font-medium"
                  >
                    {skill}
                    <button 
                      onClick={() => handleRemoveSkill(index)}
                      className="text-purple-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                    placeholder="Add technical skill..."
                    className="bg-transparent border-0 text-xs text-white placeholder-gray-600 outline-none w-32 px-2 py-0.5"
                  />
                  <button 
                    onClick={handleAddSkill}
                    className="p-1 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Work Experience */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Work Experience</h3>
                <button 
                  onClick={handleAddExperience}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Role
                </button>
              </div>

              {experience.map((exp, expIndex) => (
                <div key={expIndex} className="p-4 bg-white/2 border border-white/5 rounded-xl space-y-3 relative group/exp">
                  <button 
                    onClick={() => handleRemoveExperience(expIndex)}
                    className="absolute top-4 right-4 opacity-0 group-hover/exp:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                    title="Delete Role"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={exp.company}
                      onChange={(e) => handleExperienceChange(expIndex, 'company', e.target.value)}
                      placeholder="Company"
                      className="text-sm font-bold text-white bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={exp.role}
                      onChange={(e) => handleExperienceChange(expIndex, 'role', e.target.value)}
                      placeholder="Role Name"
                      className="text-sm text-cyan-400 bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={exp.duration}
                      onChange={(e) => handleExperienceChange(expIndex, 'duration', e.target.value)}
                      placeholder="Duration"
                      className="text-xs text-gray-500 bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 outline-none transition-all text-right sm:text-right"
                    />
                  </div>

                  {/* Highlights checklist */}
                  <div className="pl-4 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-gray-500">HIGHLIGHTS & ACCOMPLISHMENTS</span>
                      <button
                        onClick={() => handleAddHighlight(expIndex)}
                        className="text-[10px] text-gray-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Highlight
                      </button>
                    </div>

                    {(exp.highlights || []).map((highlight: string, hIndex: number) => (
                      <div key={hIndex} className="flex items-start gap-2 group/bullet relative">
                        <span className="text-purple-500 mt-1 select-none text-xs">•</span>
                        <textarea
                          value={highlight}
                          onChange={(e) => handleHighlightChange(expIndex, hIndex, e.target.value)}
                          placeholder="Accomplishment bullet point..."
                          className="flex-grow bg-transparent border-0 border-b border-transparent hover:border-white/5 focus:border-purple-500/40 text-gray-300 outline-none transition-all py-0.5 text-xs leading-relaxed resize-none h-auto min-h-[28px]"
                          rows={1}
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover/bullet:opacity-100 transition-all shrink-0">
                          <button
                            onClick={() => openAiRewrite(highlight, 'experience', expIndex, hIndex)}
                            className="p-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 rounded text-[9px] flex items-center gap-0.5 cursor-pointer"
                            title="AI Bullet optimizer"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveHighlight(expIndex, hIndex)}
                            className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
                            title="Delete Bullet"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Projects Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Technical Projects</h3>
                <button 
                  onClick={handleAddProject}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Project
                </button>
              </div>

              {projects.map((proj, projIndex) => (
                <div key={projIndex} className="p-4 bg-white/2 border border-white/5 rounded-xl space-y-3 relative group/proj">
                  <button 
                    onClick={() => handleRemoveProject(projIndex)}
                    className="absolute top-4 right-4 opacity-0 group-hover/proj:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={proj.title}
                      onChange={(e) => handleProjectChange(projIndex, 'title', e.target.value)}
                      placeholder="Project Title"
                      className="text-sm font-bold text-white bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 outline-none transition-all"
                    />
                    <input
                      type="text"
                      value={proj.description}
                      onChange={(e) => handleProjectChange(projIndex, 'description', e.target.value)}
                      placeholder="High-level description or tech stack"
                      className="text-xs text-gray-400 bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 outline-none transition-all"
                    />
                  </div>

                  {/* Highlights checklist */}
                  <div className="pl-4 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-gray-500">PROJECT HIGHLIGHTS</span>
                      <button
                        onClick={() => handleAddProjectHighlight(projIndex)}
                        className="text-[10px] text-gray-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Highlight
                      </button>
                    </div>

                    {(proj.highlights || []).map((highlight: string, hIndex: number) => (
                      <div key={hIndex} className="flex items-start gap-2 group/bullet relative">
                        <span className="text-cyan-500 mt-1 select-none text-xs">•</span>
                        <textarea
                          value={highlight}
                          onChange={(e) => handleProjectHighlightChange(projIndex, hIndex, e.target.value)}
                          placeholder="Accomplishment bullet point..."
                          className="flex-grow bg-transparent border-0 border-b border-transparent hover:border-white/5 focus:border-cyan-500/40 text-gray-300 outline-none transition-all py-0.5 text-xs leading-relaxed resize-none h-auto min-h-[28px]"
                          rows={1}
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover/bullet:opacity-100 transition-all shrink-0">
                          <button
                            onClick={() => openAiRewrite(highlight, 'project', projIndex, hIndex)}
                            className="p-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 rounded text-[9px] flex items-center gap-0.5 cursor-pointer"
                            title="AI Bullet optimizer"
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveProjectHighlight(projIndex, hIndex)}
                            className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
                            title="Delete Bullet"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Education Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Education</h3>
                <button 
                  onClick={handleAddEducation}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Degree
                </button>
              </div>

              {education.map((edu, eduIndex) => (
                <div key={eduIndex} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-white/2 border border-white/5 rounded-xl relative group/edu">
                  <button 
                    onClick={() => handleRemoveEducation(eduIndex)}
                    className="absolute top-4 right-4 opacity-0 group-hover/edu:opacity-100 p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all cursor-pointer"
                    title="Delete Education"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div>
                    <span className="text-[10px] font-mono text-gray-500 block mb-1">INSTITUTION</span>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => handleEducationChange(eduIndex, 'institution', e.target.value)}
                      placeholder="University"
                      className="w-full text-xs text-white bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 outline-none py-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 block mb-1">DEGREE</span>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => handleEducationChange(eduIndex, 'degree', e.target.value)}
                      placeholder="B.S."
                      className="w-full text-xs text-white bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 outline-none py-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 block mb-1">MAJOR</span>
                    <input
                      type="text"
                      value={edu.major}
                      onChange={(e) => handleEducationChange(eduIndex, 'major', e.target.value)}
                      placeholder="Computer Science"
                      className="w-full text-xs text-white bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 outline-none py-0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-gray-500 block mb-1">GRADUATION YEAR</span>
                    <input
                      type="text"
                      value={edu.graduation_year}
                      onChange={(e) => handleEducationChange(eduIndex, 'graduation_year', e.target.value)}
                      placeholder="2026"
                      className="w-full text-xs text-white bg-transparent border-0 border-b border-transparent hover:border-white/10 focus:border-cyan-500/50 outline-none py-0.5"
                    />
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Sidebar Stats Panel (1/4 Column) */}
          <div className="space-y-6">
            {/* ATS Compatibility Widget */}
            <div className="glass-card p-6 border-white/5 space-y-6 bg-gradient-to-b from-[#0b0a17]/80 to-[#080711]/60">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Telemetry Score</h3>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>

              {/* Large Score Indicator */}
              <div className="relative flex items-center justify-center py-4">
                <div className="w-36 h-36 rounded-full border-[10px] border-white/5 flex flex-col items-center justify-center shadow-2xl relative">
                  {/* Glowing Ring */}
                  <div className="absolute inset-0 rounded-full border-[10px] border-transparent border-t-purple-600 border-r-cyan-500 animate-spin pointer-events-none duration-1000" style={{ animationDuration: '4s' }} />
                  <span className="text-4xl font-extrabold text-white">{selectedResume.ats_score}%</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest font-mono mt-1">ATS INDEX</span>
                </div>
              </div>

              <div className="text-center text-xs text-gray-400">
                Saving updates will automatically recalculate structural rules, keyword matches, and verb scores.
              </div>
            </div>

            {/* Quick Suggestions / Improvement summary */}
            <div className="glass-card p-6 border-white/5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Optimizer Engine</h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-white/2 border border-white/5 rounded-xl text-xs space-y-1">
                  <span className="font-semibold text-purple-400">AI Prompt Templates</span>
                  <p className="text-gray-400 leading-normal mb-2">Hover any bullet points in your canvas and trigger the AI button. Try these queries:</p>
                  <ul className="space-y-1.5 font-mono text-[10px] text-gray-500">
                    <li>• "Add metrics and result numbers"</li>
                    <li>• "Upgrade vocabulary with strong action verbs"</li>
                    <li>• "Summarize to under 15 words"</li>
                    <li>• "Focus on AWS cloud optimization outcomes"</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-8 text-center space-y-4">
          <p className="text-gray-400">Please select or upload a resume to launch the Notion Editor.</p>
        </div>
      )}

      {/* AI Rewrite Overlay Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl glass-card bg-[#0b0a17] border-white/10 p-6 space-y-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Apex AI Resume Optimizer
                </h3>
                <button 
                  onClick={() => setAiModalOpen(false)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Text to optimize */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase">Original block text</label>
                <div className="p-3 bg-white/2 border border-white/5 rounded-lg text-sm text-gray-300 select-none">
                  {aiTextToRewrite}
                </div>
              </div>

              {/* Command prompt input */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-gray-500 uppercase">Optimization command</label>
                <input
                  type="text"
                  value={aiCommand}
                  onChange={(e) => setAiCommand(e.target.value)}
                  placeholder="e.g. Quantify this accomplishment or Make it sound more senior..."
                  className="w-full glass-input text-sm"
                />
                
                {/* Suggestions Quick Buttons */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    { label: 'Quantify metrics', cmd: 'Add quantifiable metrics, percentages, or dollar savings to the accomplishment' },
                    { label: 'Stronger verbs', cmd: 'Start with an executive and highly impactful action verb' },
                    { label: 'Make executive', cmd: 'Rewrite for an executive director level role showing leadership and ownership' },
                    { label: 'Shorten', cmd: 'Make it extremely concise and direct (under 12 words)' }
                  ].map((btn, index) => (
                    <button
                      key={index}
                      onClick={() => setAiCommand(btn.cmd)}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer"
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestion comparison view */}
              <AnimatePresence>
                {(isRewriting || aiSuggestion) && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="border-t border-white/5 pt-4 space-y-2 overflow-hidden"
                  >
                    <label className="text-xs font-mono text-cyan-400 uppercase">AI suggestion preview</label>
                    {isRewriting ? (
                      <div className="flex items-center gap-2 py-4 justify-center">
                        <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                        <span className="text-xs text-gray-400 font-mono">REWRITING PARAGRAPH STRUCTURE...</span>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="flex-grow p-3 bg-cyan-950/10 border border-cyan-500/20 text-sm text-cyan-200 rounded-lg">
                          {aiSuggestion}
                        </div>
                        <button
                          onClick={acceptAiSuggestion}
                          className="p-3 bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/40 text-cyan-200 hover:text-white rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                          title="Accept suggestion"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Modal footer controls */}
              <div className="flex items-center justify-end gap-3 border-t border-white/5 pt-4">
                <button
                  onClick={() => setAiModalOpen(false)}
                  className="px-4 py-2 border border-white/5 text-gray-400 hover:text-white rounded-lg text-xs cursor-pointer"
                >
                  Discard
                </button>
                <button
                  onClick={triggerAiRewrite}
                  disabled={isRewriting || !aiCommand.trim()}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate Suggestion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
