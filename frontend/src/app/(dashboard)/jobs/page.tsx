'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  ExternalLink, 
  Plus, 
  Loader2, 
  AlertCircle, 
  Check, 
  Sparkles,
  Layers,
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { api } from '@/lib/api';

interface Resume {
  id: number;
  filename: string;
}

interface Job {
  id: number;
  title: string;
  company: string;
  category: string;
  location: string;
  salary: string;
  url: string;
  logo: string;
  description: string;
  full_description: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
}

export default function JobSearchPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  
  const [searchQuery, setSearchQuery] = useState('React');
  const [isLoading, setIsLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Side drawer detail state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [savingJobId, setSavingJobId] = useState<number | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  const fetchResumes = async () => {
    try {
      const response = await api.get('/resumes');
      setResumes(response.data);
      if (response.data.length > 0) {
        setSelectedResumeId(response.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSelectedJob(null);

    try {
      const params: any = { query: searchQuery };
      if (selectedResumeId) {
        params.resume_id = Number(selectedResumeId);
      }
      
      const response = await api.get('/jobs/search', { params });
      setJobs(response.data);
      if (response.data.length === 0) {
        setErrorMsg('No jobs found for your search query. Try another keyword.');
      }
    } catch (err: any) {
      console.error('Job search failed:', err);
      setErrorMsg(err.response?.data?.detail || 'Error connecting to job search gateway.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add Job to Kanban tracker
  const handleSaveToTracker = async (job: Job) => {
    setSavingJobId(job.id);
    try {
      const payload = {
        company: job.company,
        title: job.title,
        status: 'wishlist',
        salary: job.salary !== 'N/A' ? job.salary : null,
        location: job.location,
        url: job.url,
        resume_id: selectedResumeId ? Number(selectedResumeId) : null,
        job_description: job.full_description
      };
      
      await api.post('/applications', payload);
      setSavedJobs([...savedJobs, job.id]);
    } catch (err) {
      console.error('Failed to add job to Kanban tracker:', err);
      alert('Could not add job to tracker.');
    } finally {
      setSavingJobId(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/5';
    if (score >= 60) return 'text-amber-400 border-amber-500/30 bg-amber-500/5';
    return 'text-red-400 border-red-500/30 bg-red-500/5';
  };

  return (
    <div className="space-y-8 relative h-full">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Search className="text-purple-500 w-8 h-8" />
          Real-Time AI Job Explorer
        </h1>
        <p className="text-sm text-gray-400">
          Query live global remote jobs and instantly compute compatibility scores against your technical resume.
        </p>
      </div>

      {/* Control Panel / Search Bar */}
      <div className="glass-card p-6 border-white/5 bg-[#0b0a17]/40">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
          
          {/* Query Input */}
          <div className="flex-grow w-full space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Keywords / Role</label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. React, Python Backend, DevOps Engineer..."
                className="w-full glass-input pl-10 text-xs py-3"
              />
              <Briefcase className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Active Resume Selector */}
          <div className="w-full md:w-80 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">Match Against Resume</label>
            <select
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              className="w-full glass-input text-xs py-3 bg-[#0c0b1a]"
            >
              <option value="">-- No Resume (General Search) --</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.filename}
                </option>
              ))}
            </select>
          </div>

          {/* Search Trigger */}
          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="w-full md:w-44 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 rounded-xl text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.15)] cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Scanning Feeds...
              </>
            ) : (
              <>
                Search Jobs
                <Search className="w-3.5 h-3.5" />
              </>
            )}
          </button>

        </form>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Jobs Listing Split */}
      {isLoading ? (
        <div className="h-[50vh] flex flex-col justify-center items-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
          <p className="text-sm text-gray-400 font-mono">PARSING REMOTE JOBS & GENERATING COMPATIBILITY RATINGS...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Jobs List (7/12 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {jobs.map((job) => {
              const isSaved = savedJobs.includes(job.id);
              return (
                <motion.div
                  key={job.id}
                  layoutId={`job-card-${job.id}`}
                  className="glass-card p-5 border-white/5 bg-black/40 hover:bg-[#121124]/40 hover:border-purple-500/20 transition-all cursor-pointer flex flex-col justify-between gap-4"
                  onClick={() => setSelectedJob(job)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 truncate">
                      <h3 className="text-base font-bold text-white truncate hover:text-purple-400 transition-colors">
                        {job.title}
                      </h3>
                      <p className="text-xs text-cyan-400 font-medium">{job.company}</p>
                    </div>

                    {/* Match score label */}
                    {selectedResumeId && (
                      <span className={`px-2.5 py-1 border text-xs font-mono font-bold rounded-lg ${getScoreColor(job.match_score)}`}>
                        {Math.round(job.match_score)}% Match
                      </span>
                    )}
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                    {job.description}
                  </p>

                  {/* Metadata & Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
                    <div className="flex gap-3 text-[10px] text-gray-500">
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                      </span>
                      {job.salary !== 'N/A' && (
                        <span className="flex items-center gap-0.5">
                          <DollarSign className="w-3 h-3" />
                          {job.salary}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleSaveToTracker(job)}
                        disabled={isSaved || savingJobId === job.id}
                        className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                          isSaved 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                            : 'border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-white'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <Check className="w-3 h-3" />
                            Added to Tracker
                          </>
                        ) : savingJobId === job.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            Add to Board
                          </>
                        )}
                      </button>

                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[10px] font-semibold text-white cursor-pointer"
                      >
                        Apply Direct
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {jobs.length === 0 && !errorMsg && (
              <div className="h-48 border border-dashed border-white/5 flex flex-col items-center justify-center rounded-2xl text-center p-6 space-y-2">
                <Briefcase className="w-8 h-8 text-gray-600" />
                <h4 className="text-xs font-bold text-white">Explore Open Vocations</h4>
                <p className="text-[11px] text-gray-500 max-w-xs">Type target job tags or skills in the panel above to scan live feeds.</p>
              </div>
            )}
          </div>

          {/* Job Details Panel / Right Side (5/12 cols) */}
          <div className="lg:col-span-5">
            <AnimatePresence mode="wait">
              {selectedJob ? (
                <motion.div
                  key={selectedJob.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="glass-card p-6 border-white/5 bg-[#0b0a17]/35 space-y-6"
                >
                  <div className="border-b border-white/5 pb-4 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="text-base font-bold text-white">{selectedJob.title}</h3>
                        <p className="text-xs text-cyan-400 font-semibold">{selectedJob.company}</p>
                      </div>
                      <button 
                        onClick={() => setSelectedJob(null)}
                        className="text-gray-500 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-400">
                      <span className="bg-white/3 px-2 py-0.5 rounded border border-white/5 flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {selectedJob.location}
                      </span>
                      {selectedJob.salary !== 'N/A' && (
                        <span className="bg-white/3 px-2 py-0.5 rounded border border-white/5 flex items-center gap-0.5">
                          <DollarSign className="w-2.5 h-2.5" />
                          {selectedJob.salary}
                        </span>
                      )}
                      <span className="bg-white/3 px-2 py-0.5 rounded border border-white/5">
                        {selectedJob.category}
                      </span>
                    </div>
                  </div>

                  {/* Compatibility Rating & Skills overlap */}
                  {selectedResumeId && (
                    <div className="space-y-4 bg-white/2 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono text-gray-500 uppercase">AI Skill Fit Index</span>
                        <span className={`text-xs font-mono font-bold ${selectedJob.match_score >= 80 ? 'text-cyan-400' : 'text-amber-400'}`}>
                          {selectedJob.match_score}% Score
                        </span>
                      </div>

                      {/* Matching Skills */}
                      {selectedJob.matched_skills.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-wider block">Matched competencies</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedJob.matched_skills.map((skill, idx) => (
                              <span key={idx} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Missing Skills */}
                      {selectedJob.missing_skills.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider block">Target Gaps / Required</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedJob.missing_skills.map((skill, idx) => (
                              <span key={idx} className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Description text */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-gray-500 uppercase block">Job overview</span>
                    <div className="text-xs text-gray-300 leading-relaxed font-sans max-h-60 overflow-y-auto pr-1">
                      {selectedJob.full_description}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-4">
                    <button
                      onClick={() => handleSaveToTracker(selectedJob)}
                      disabled={savedJobs.includes(selectedJob.id) || savingJobId === selectedJob.id}
                      className={`flex-grow flex items-center justify-center gap-1.5 py-2.5 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        savedJobs.includes(selectedJob.id)
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'border-white/10 hover:border-purple-500/30 text-gray-300 hover:text-white'
                      }`}
                    >
                      {savedJobs.includes(selectedJob.id) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Tracked on Kanban
                        </>
                      ) : savingJobId === selectedJob.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Layers className="w-3.5 h-3.5" />
                          Track Application
                        </>
                      )}
                    </button>

                    <a
                      href={selectedJob.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer shrink-0"
                    >
                      Apply Now
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </motion.div>
              ) : (
                <motion.div
                  key="empty-detail"
                  className="h-full min-h-[300px] border border-white/5 rounded-2xl bg-white/2 flex flex-col items-center justify-center text-center p-8 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/3 flex items-center justify-center text-gray-500">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Select Job Listing</h3>
                    <p className="text-[10px] text-gray-500 max-w-xs mx-auto">Click any job card on the left panel to inspect detailed requirements and skill comparisons.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}
    </div>
  );
}
