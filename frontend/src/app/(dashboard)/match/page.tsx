'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Briefcase, 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { api } from '@/lib/api';

interface Resume {
  id: number;
  filename: string;
}

interface MatchSuggestion {
  section: string;
  before?: string;
  after: string;
  reason: string;
}

interface MatchResult {
  job_title?: string;
  match_score: number;
  missing_skills: string[];
  keyword_gaps: string[];
  suggestions: MatchSuggestion[];
}

export default function MatchPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (selectedResumeId) {
      fetchMatchHistory(Number(selectedResumeId));
    } else {
      setMatchHistory([]);
    }
  }, [selectedResumeId]);

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

  const fetchMatchHistory = async (resumeId: number) => {
    try {
      const response = await api.get(`/matches/resume/${resumeId}`);
      setMatchHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch match history:', err);
    }
  };

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setErrorMsg('Please select a resume first.');
      return;
    }
    if (!jobDescription.trim() || jobDescription.length < 20) {
      setErrorMsg('Please paste a job description (minimum 20 characters).');
      return;
    }

    setIsMatching(true);
    setErrorMsg(null);
    setMatchResult(null);

    try {
      const response = await api.post(`/matches/${selectedResumeId}`, {
        job_title: jobTitle,
        job_description: jobDescription
      });
      
      setMatchResult(response.data);
      fetchMatchHistory(Number(selectedResumeId));
    } catch (err: any) {
      console.error('Job match failed:', err);
      setErrorMsg(
        err.response?.data?.detail || 
        'An error occurred during job description matching.'
      );
    } finally {
      setIsMatching(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-cyan-400 stroke-cyan-500';
    if (score >= 60) return 'text-amber-400 stroke-amber-500';
    return 'text-red-400 stroke-red-500';
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Job Matching & Optimization</h1>
        <p className="text-sm text-gray-400">Evaluate semantic match percentage and identify missing keywords against job requirements.</p>
      </div>

      {resumes.length === 0 ? (
        <div className="glass-card p-8 border-white/5 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-white">No Resumes Found</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">You need to upload at least one resume to calculate job description alignment.</p>
          <a href="/upload" className="inline-flex py-2.5 px-4 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-semibold text-white">
            Go to Upload Screen
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left panel: Input Form (2/5 columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 border-white/5 bg-[#0b0a17]/40">
              <form onSubmit={handleMatch} className="space-y-5">
                
                {/* Select Resume */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Select Resume Profile</label>
                  <select
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    className="w-full bg-white/5 border border-white/8 rounded-lg text-white text-sm p-3 outline-none focus:border-purple-500/50"
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id} className="bg-[#0f0e22]">
                        {r.filename}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Job Title */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Job Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Full Stack Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/8 rounded-lg text-white text-sm p-3 outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* Job Description Paste Box */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Paste Job Description</label>
                  <textarea
                    placeholder="Paste the target job description requirements here..."
                    rows={8}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="w-full bg-white/5 border border-white/8 rounded-lg text-white text-xs p-3 outline-none focus:border-purple-500/50 resize-none font-sans leading-relaxed"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={isMatching}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.2)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isMatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing Overlaps...
                    </>
                  ) : (
                    <>
                      Evaluate Job Match
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Match History */}
            {matchHistory.length > 0 && (
              <div className="glass-card p-6 border-white/5 space-y-4">
                <h3 className="text-sm font-bold text-white">Match History</h3>
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {matchHistory.map((hist) => (
                    <div
                      key={hist.id}
                      onClick={() => setMatchResult(hist)}
                      className="flex items-center justify-between p-3 rounded-xl border border-transparent bg-white/3 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="truncate">
                        <p className="text-xs font-semibold truncate text-white">{hist.job_title}</p>
                        <span className="text-[9px] font-mono text-gray-500">{new Date(hist.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border bg-cyan-500/10 border-cyan-500/20 text-cyan-400`}>
                        {Math.round(hist.match_score)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right panel: Match Results (3/5 columns) */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {isMatching ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] border border-white/5 rounded-2xl bg-white/2 flex flex-col items-center justify-center text-center p-8 space-y-4"
                >
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Comparing Semantic Embeddings...</h3>
                    <p className="text-xs text-gray-500 max-w-xs">Our AI is computing key terms frequencies and parsing job requirements overlaps.</p>
                  </div>
                </motion.div>
              ) : !matchResult ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[400px] border border-white/5 rounded-2xl bg-white/2 flex flex-col items-center justify-center text-center p-8 space-y-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-white/3 flex items-center justify-center text-gray-500">
                    <Compass className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Ready for Comparison</h3>
                    <p className="text-xs text-gray-500 max-w-xs mx-auto">Select a resume profile and paste a target job description to compute alignment indexes.</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Match score card banner */}
                  <div className="glass-card p-6 border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 bg-gradient-to-r from-[#0d0c1c] via-[#080d20] to-[#0d0c1c]">
                    <div className="space-y-2 text-center sm:text-left">
                      <div className="flex items-center gap-2 justify-center sm:justify-start">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-cyan-400 uppercase tracking-widest font-mono">ALIGNMENT TELEMETRY READY</span>
                      </div>
                      <h2 className="text-xl font-bold text-white">{matchResult.job_title || "Target Position"}</h2>
                      <p className="text-xs text-gray-400">Calculated semantical matching index against your active profile.</p>
                    </div>

                    {/* Ring score */}
                    <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="48" cy="48" r="40" className="stroke-white/5" strokeWidth="6" fill="transparent" />
                        <motion.circle 
                          cx="48" 
                          cy="48" 
                          r="40" 
                          className={getScoreColor(matchResult.match_score)}
                          strokeWidth="6" 
                          fill="transparent"
                          strokeDasharray={2 * Math.PI * 40}
                          initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - matchResult.match_score / 100) }}
                          transition={{ duration: 1 }}
                        />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-2xl font-black text-white">{Math.round(matchResult.match_score)}%</span>
                        <p className="text-[8px] font-mono text-gray-500 uppercase tracking-wider">ALIGNMENT</p>
                      </div>
                    </div>
                  </div>

                  {/* Missing Skills tags */}
                  {matchResult.missing_skills && matchResult.missing_skills.length > 0 && (
                    <div className="glass-card p-6 border-white/5 space-y-3">
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Missing Technical Competencies</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.missing_skills.map((skill, index) => (
                          <span key={index} className="text-xs px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-300 rounded-full font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Keyword Gaps tags */}
                  {matchResult.keyword_gaps && matchResult.keyword_gaps.length > 0 && (
                    <div className="glass-card p-6 border-white/5 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400">
                        <TrendingUp className="w-4 h-4" />
                        <h3 className="text-xs font-bold uppercase tracking-wider font-mono">Keyword Phrase Gaps</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.keyword_gaps.map((keyword, index) => (
                          <span key={index} className="text-xs px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-full font-mono">
                            "{keyword}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions grid / Before/After compares */}
                  {matchResult.suggestions && matchResult.suggestions.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-white px-1">AI-Powered Optimization Recommendations</h3>
                      <div className="space-y-4">
                        {matchResult.suggestions.map((s, index) => (
                          <div key={index} className="glass-card p-5 border-white/5 space-y-4">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2">
                              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest font-mono">
                                Section: {s.section}
                              </span>
                              <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded uppercase tracking-wider font-mono font-bold">
                                REWRITE TIP
                              </span>
                            </div>

                            {s.before && (
                              <div className="space-y-1">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block">Current phrasing</span>
                                <div className="text-xs p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-gray-400 line-through decoration-red-500/40">
                                  {s.before}
                                </div>
                              </div>
                            )}

                            <div className="space-y-1">
                              <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-bold block">Optimized wording</span>
                              <div className="text-xs p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-white font-medium">
                                {s.after}
                              </div>
                            </div>

                            <div className="space-y-1 bg-white/1 p-3 rounded-lg border border-white/3">
                              <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold block">Parsing Strategy</span>
                              <p className="text-xs text-gray-400 leading-relaxed italic">"{s.reason}"</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
