'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  FileText, 
  Trash2, 
  ChevronRight, 
  Loader2, 
  Sparkles, 
  CheckCircle,
  AlertCircle,
  BookOpen,
  Sliders,
  FileCode,
  Flame,
  FileSpreadsheet,
  Download,
  History,
  GitBranch
} from 'lucide-react';
import { api } from '@/lib/api';

interface Resume {
  id: number;
  filename: string;
  ats_score: number;
  created_at: string;
}

interface ATSReport {
  formatting_score: number;
  readability_score: number;
  skills_score: number;
  verbs_score: number;
  keyword_match_rate: number;
  improvement_areas: string[];
  detailed_suggestions: Array<{ category: string; message: string }>;
}

interface ResumeDetails {
  id: number;
  filename: string;
  ats_score: number;
  parsed_json: {
    name?: string;
    email?: string;
    phone?: string;
    summary?: string;
    skills?: string[];
    experience?: Array<{ company: string; role: string; duration: string; highlights: string[] }>;
    education?: Array<{ institution: string; degree: string; major: string; graduation_year: string }>;
    projects?: Array<{ title: string; description: string; highlights?: string[] }>;
  };
  created_at: string;
}

interface VersionSnapshot {
  id: number;
  version_num: number;
  filename: string;
  ats_score: number;
  created_at: string;
  skill_count: number;
}

const PARSING_STEPS = [
  "Reading document stream...",
  "Extracting raw textual content...",
  "Applying spaCy tokenizer...",
  "Invoking Google Gemini AI extractor...",
  "Parsing JSON entities (Name, Skills, Roles)...",
  "Calculating ATS keyword weights & readability...",
  "Compiling optimization checklist..."
];

export default function UploadPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResume, setActiveResume] = useState<ResumeDetails | null>(null);
  const [activeReport, setActiveReport] = useState<ATSReport | null>(null);
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [activeTab, setActiveTab] = useState<'report' | 'history'>('report');
  
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgressStep, setUploadProgressStep] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await api.get('/resumes');
      setResumes(response.data);
    } catch (err) {
      console.error('Error fetching resumes:', err);
    }
  };

  const fetchResumeDetails = async (resumeId: number) => {
    try {
      const [detailRes, reportRes, versionsRes] = await Promise.all([
        api.get(`/resumes/${resumeId}`),
        api.get(`/resumes/${resumeId}/report`),
        api.get(`/resumes/${resumeId}/versions`)
      ]);
      setActiveResume(detailRes.data);
      setActiveReport(reportRes.data);
      setVersions(versionsRes.data);
      setActiveTab('report');
      setErrorMsg(null);
    } catch (err) {
      console.error('Error loading resume details:', err);
      setErrorMsg('Failed to load resume details.');
    }
  };

  const startProgressCycle = () => {
    setUploadProgressStep(0);
    let step = 0;
    progressIntervalRef.current = setInterval(() => {
      if (step < PARSING_STEPS.length - 1) {
        step += 1;
        setUploadProgressStep(step);
      }
    }, 1500);
  };

  const stopProgressCycle = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);
    startProgressCycle();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/resumes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const newResume = response.data;
      
      // Refresh listing
      await fetchResumes();
      
      // Load details of newly created resume
      await fetchResumeDetails(newResume.id);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setErrorMsg(
        err.response?.data?.detail || 
        'An error occurred during file analysis.'
      );
    } finally {
      stopProgressCycle();
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      uploadFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const handleDelete = async (resumeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/resumes/${resumeId}`);
      if (activeResume?.id === resumeId) {
        setActiveResume(null);
        setActiveReport(null);
      }
      fetchResumes();
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  // Score color helper
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-500';
    if (score >= 60) return 'text-amber-400 stroke-amber-500';
    return 'text-red-400 stroke-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    return 'bg-red-500/10 border-red-500/20 text-red-400';
  };

  const handleExport = async () => {
    if (!activeResume) return;
    setIsExporting(true);
    try {
      const response = await api.get(`/resumes/${activeResume.id}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/html' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `apex-ats-report-${activeResume.id}.html`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Resume Management</h1>
        <p className="text-sm text-gray-400">Upload your resume and analyze formatting, skills, and ATS benchmarks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Upload Zone & History List */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* File Uploader */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`glass-card p-8 border-dashed border-2 text-center relative flex flex-col justify-center items-center min-h-[260px] transition-all duration-300 ${
              isDragActive ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-white/10 hover:border-white/20'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx"
              className="hidden"
            />

            {isUploading ? (
              <div className="space-y-4">
                <Loader2 className="w-10 h-10 text-purple-500 animate-spin mx-auto shadow-[0_0_15px_rgba(168,85,247,0.3)]" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Running AI Telemetry Scans...</h4>
                  <p className="text-xs text-purple-400 font-mono animate-pulse min-h-[16px]">
                    {PARSING_STEPS[uploadProgressStep]}
                  </p>
                </div>
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-600 to-cyan-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${((uploadProgressStep + 1) / PARSING_STEPS.length) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 mx-auto group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Upload new resume</h3>
                  <p className="text-xs text-gray-500">Drag and drop or click to browse</p>
                  <p className="text-[10px] text-gray-600">Supports PDF & DOCX formats (max 8MB)</p>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* History List */}
          <div className="glass-card p-6 border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white">Previous Uploads</h3>
            {resumes.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">No uploaded documents found.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {resumes.map((r) => {
                  const isActive = activeResume?.id === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => fetchResumeDetails(r.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'bg-purple-500/10 border-purple-500/30 text-purple-200'
                          : 'bg-white/3 border-transparent hover:bg-white/5 text-gray-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-purple-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-semibold truncate">{r.filename}</p>
                          <span className="text-[9px] font-mono text-gray-500">{new Date(r.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getScoreBg(r.ats_score)}`}>
                          {Math.round(r.ats_score)}
                        </span>
                        <button
                          onClick={(e) => handleDelete(r.id, e)}
                          className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-white/5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Resume Scan Report View */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!activeResume || !activeReport ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[400px] border border-white/5 rounded-2xl bg-white/2 flex flex-col items-center justify-center text-center p-8 space-y-4"
              >
                <div className="w-12 h-12 rounded-xl bg-white/3 flex items-center justify-center text-gray-500">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">No Report Selected</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">Upload a resume or select one from the upload history to inspect detailed scoring analytics.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Score Summary Banner */}
                <div className="glass-card p-6 border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#0d0c1c] via-[#090b20] to-[#0d0c1c]">
                  <div className="space-y-2 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-purple-400 uppercase tracking-widest font-mono">SCANNED BY APEX AI</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{activeResume.filename}</h2>
                    <p className="text-xs text-gray-400">
                      Owner: {activeResume.parsed_json.name || 'Candidate Profile'} | Email: {activeResume.parsed_json.email || 'N/A'}
                    </p>
                  </div>
                  
                  {/* Gauge */}
                  <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" className="stroke-white/5" strokeWidth="6" fill="transparent" />
                      <motion.circle 
                        cx="48" 
                        cy="48" 
                        r="40" 
                        className={getScoreColor(activeResume.ats_score)}
                        strokeWidth="6" 
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 40}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - activeResume.ats_score / 100) }}
                        transition={{ duration: 1 }}
                      />
                    </svg>
                    <div className="absolute text-center">
                      <span className="text-2xl font-black text-white">{Math.round(activeResume.ats_score)}</span>
                      <p className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">ATS INDEX</p>
                    </div>
                  </div>
                </div>

                {/* Tabs: Report | Version History */}
                <div className="flex items-center gap-1 p-1 bg-white/3 border border-white/5 rounded-xl">
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`flex-grow flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'report'
                        ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    ATS Report
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`flex-grow flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                      activeTab === 'history'
                        ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <History className="w-3.5 h-3.5" />
                    Version History {versions.length > 0 && <span className="bg-white/10 text-gray-300 px-1.5 py-0.5 rounded text-[9px]">{versions.length}</span>}
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-semibold text-gray-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Export
                  </button>
                </div>

                {/* Conditional Tab Content */}
                {activeTab === 'report' ? (
                  <>
                {/* Score Breakdown Subscales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { name: 'Formatting', value: activeReport.formatting_score, icon: Sliders, color: 'from-purple-500 to-purple-400' },
                    { name: 'Readability', value: activeReport.readability_score, icon: BookOpen, color: 'from-cyan-500 to-cyan-400' },
                    { name: 'Skills Relevance', value: activeReport.skills_score, icon: FileCode, color: 'from-blue-500 to-blue-400' },
                    { name: 'Action Verbs', value: activeReport.verbs_score, icon: Flame, color: 'from-amber-500 to-amber-400' },
                    { name: 'Quantification', value: activeReport.keyword_match_rate, icon: FileSpreadsheet, color: 'from-emerald-500 to-emerald-400' }
                  ].map((sub, i) => (
                    <div key={i} className="glass-card p-4 border-white/5 text-center space-y-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 mx-auto">
                        <sub.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{sub.name}</p>
                        <p className="text-lg font-extrabold text-white mt-0.5">{Math.round(sub.value)}</p>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full bg-gradient-to-r ${sub.color}`} style={{ width: `${sub.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Skills Cloud */}
                {activeResume.parsed_json.skills && activeResume.parsed_json.skills.length > 0 && (
                  <div className="glass-card p-6 border-white/5 space-y-3">
                    <h3 className="text-sm font-bold text-white">Extracted Skills Grid</h3>
                    <div className="flex flex-wrap gap-2">
                      {activeResume.parsed_json.skills.map((skill, index) => (
                        <span key={index} className="text-xs px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-full font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements suggestions checklist */}
                <div className="glass-card p-6 border-white/5 space-y-4">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-sm font-bold text-white">Detailed Suggestions Checklist</h3>
                    <p className="text-xs text-gray-500">Perform the edits below to elevate resume parsing index.</p>
                  </div>
                  
                  <div className="space-y-4">
                    {activeReport.detailed_suggestions.map((s, index) => (
                      <div key={index} className="flex gap-3 text-left">
                        <div className="w-6 h-6 rounded bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-xs text-purple-400 shrink-0 font-bold uppercase font-mono mt-0.5">
                          {s.category ? s.category[0] : 'S'}
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">{s.category} check</span>
                          <p className="text-xs text-gray-400 leading-relaxed">{s.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                  </>
                ) : (
                  /* Version History Tab */
                  <div className="glass-card p-6 border-white/5 space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                      <GitBranch className="w-4 h-4 text-purple-400" />
                      <h3 className="text-sm font-bold text-white">Resume Version History</h3>
                      <span className="text-[10px] font-mono text-gray-500 ml-auto">{versions.length} snapshot{versions.length !== 1 ? 's' : ''}</span>
                    </div>

                    {versions.length === 0 ? (
                      <div className="text-center py-8">
                        <History className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-500">No version history found. Edit this resume in the AI Editor to create snapshots.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {versions.map((v, idx) => (
                          <div key={v.id} className="flex items-center justify-between p-3 bg-white/2 border border-white/5 hover:border-white/10 rounded-xl transition-colors group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                                v{v.version_num}
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-white">{v.filename}</p>
                                <p className="text-[10px] text-gray-500 font-mono">{new Date(v.created_at).toLocaleDateString()} · {v.skill_count} skills</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {idx === 0 && (
                                <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded uppercase tracking-wider">Current</span>
                              )}
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getScoreBg(v.ats_score)}`}>
                                {Math.round(v.ats_score)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
