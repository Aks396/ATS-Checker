'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Send, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  FileText,
  MessageSquare,
  Award,
  CheckCircle,
  Play,
  RotateCcw,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { api } from '@/lib/api';

interface Resume {
  id: number;
  filename: string;
}

interface StarBreakdown {
  situation: string;
  task: string;
  action: string;
  result: string;
}

interface TurnFeedback {
  score: number;
  star_breakdown: StarBreakdown;
  suggestions: string;
  model_answer: string;
}

interface Message {
  id: number;
  role: 'interviewer' | 'candidate';
  content: string;
  feedback?: TurnFeedback | null;
  created_at?: string;
}

interface SessionReport {
  id: number;
  job_title: string;
  average_score: number;
  evaluations_count: number;
  suggestions_summary: string;
}

export default function InterviewPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  
  // Session states
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Expanded feedback IDs mapping (to toggle detail cards under candidate replies)
  const [expandedFeedback, setExpandedFeedback] = useState<Record<number, boolean>>({});

  // Session stats report state
  const [report, setReport] = useState<SessionReport | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (activeSessionId) {
      fetchReport(activeSessionId);
    }
  }, [activeSessionId, messages]);

  const fetchResumes = async () => {
    try {
      const response = await api.get('/resumes');
      setResumes(response.data);
      if (response.data.length > 0) {
        setSelectedResumeId(response.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load resumes.');
    }
  };

  const fetchReport = async (sessionId: number) => {
    try {
      const response = await api.get(`/interviews/${sessionId}/report`);
      setReport(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResumeId) {
      setErrorMsg('Please select a resume context first.');
      return;
    }

    setIsInitializing(true);
    setErrorMsg(null);
    setMessages([]);
    setReport(null);

    try {
      const payload = {
        resume_id: Number(selectedResumeId),
        job_title: jobTitle || 'Software Engineer',
        job_description: jobDescription || 'General tech role requiring collaboration, problem solving, and software architecture.'
      };
      
      const response = await api.post('/interviews/start', payload);
      const session = response.data;
      
      setActiveSessionId(session.id);
      
      // Pull first interviewer question from session turns
      const firstTurn = session.turns?.[0];
      if (firstTurn) {
        setMessages([{
          id: firstTurn.id,
          role: firstTurn.role,
          content: firstTurn.content
        }]);
      } else {
        // Fallback placeholder if turns list isn't pre-populated in response
        setMessages([{
          id: 1,
          role: 'interviewer',
          content: `Thanks for interviewing for the ${payload.job_title} role. Let's begin: describe a challenging technical accomplishment or project you led, detailing the problem parameters and final results.`
        }]);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to initialize interview simulator.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionId || !currentAnswer.trim() || isSending) return;

    const answerText = currentAnswer.trim();
    setCurrentAnswer('');
    setIsSending(true);
    setErrorMsg(null);

    // Append candidate message locally
    const tempCandidateId = Date.now();
    const newCandidateMessage: Message = {
      id: tempCandidateId,
      role: 'candidate',
      content: answerText,
      feedback: null
    };
    
    setMessages(prev => [...prev, newCandidateMessage]);

    try {
      const response = await api.post(`/interviews/${activeSessionId}/respond`, {
        content: answerText
      });
      const [candidateTurn, nextInterviewerTurn] = response.data;

      // Update candidate message with actual ID and feedback + append next interviewer question
      setMessages(prev => {
        const updated = prev.map(m => m.id === tempCandidateId ? {
          ...m,
          id: candidateTurn.id,
          feedback: candidateTurn.feedback
        } : m);
        
        // Auto-expand new feedback card
        setExpandedFeedback(exps => ({ ...exps, [candidateTurn.id]: true }));

        if (nextInterviewerTurn) {
          updated.push({
            id: nextInterviewerTurn.id,
            role: 'interviewer',
            content: nextInterviewerTurn.content
          });
        }
        
        return updated;
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process answer evaluation.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 h-full">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Award className="text-purple-500 w-8 h-8" />
          STAR Mock Interview Prep
        </h1>
        <p className="text-sm text-gray-400">
          Conduct a professional mock interview scored specifically on the STAR (Situation, Task, Action, Result) methodology.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Control Column: Setup / Stats (1/3 Width) */}
        <div className="space-y-6 lg:sticky lg:top-4">
          
          {/* Setup Form */}
          <div className="glass-card p-6 border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Play className="w-4 h-4 text-cyan-400" />
              Configure Session
            </h3>

            <form onSubmit={handleStartInterview} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Context Resume</label>
                <select
                  disabled={!!activeSessionId || isInitializing}
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
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

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Target Job Title</label>
                <input
                  disabled={!!activeSessionId || isInitializing}
                  type="text"
                  required
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-500 uppercase">Target Job Description</label>
                <textarea
                  disabled={!!activeSessionId || isInitializing}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste details of the role to allow recruiter alignment..."
                  className="w-full h-32 glass-input text-xs leading-normal"
                />
              </div>

              {!activeSessionId ? (
                <button
                  type="submit"
                  disabled={isInitializing}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-xs font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 cursor-pointer disabled:opacity-50"
                >
                  {isInitializing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Start Interview Simulator
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveSessionId(null)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/10 hover:border-red-500/30 text-gray-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset Session
                </button>
              )}
            </form>
          </div>

          {/* Telemetry Stats report Widget */}
          {activeSessionId && report && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-6 border-white/5 space-y-4 bg-gradient-to-b from-[#0b0a17]/80 to-[#080711]/60"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Session Stats</h3>
                <span className="text-[10px] font-mono text-cyan-400">ACTIVE FEEDBACK</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/2 border border-white/5 p-3 rounded-xl text-center">
                  <span className="text-[10px] text-gray-500 block mb-1">COMPOSITE</span>
                  <span className="text-xl font-bold text-white">{report.average_score}%</span>
                </div>
                <div className="bg-white/2 border border-white/5 p-3 rounded-xl text-center">
                  <span className="text-[10px] text-gray-500 block mb-1">QUESTIONS</span>
                  <span className="text-xl font-bold text-white">{report.evaluations_count}</span>
                </div>
              </div>

              {report.suggestions_summary && (
                <div className="space-y-1 pt-2">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Focus Areas</span>
                  <p className="text-[11px] text-gray-400 leading-relaxed font-sans whitespace-pre-line">
                    {report.suggestions_summary}
                  </p>
                </div>
              )}
            </motion.div>
          )}

        </div>

        {/* Right Column: Interactive Chat Log (2/3 Width) */}
        <div className="lg:col-span-2 glass-card border-white/5 bg-black/40 h-[70vh] flex flex-col justify-between overflow-hidden rounded-2xl">
          
          {/* Chat Headers */}
          <div className="p-4 border-b border-white/5 bg-[#0d0c1c]/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-white">APEX INTERVIEWER CORE</span>
            </div>
            <span className="text-[9px] font-mono text-gray-500">STAR SCORING PROTOCOL</span>
          </div>

          {/* Bubbles Log */}
          <div className="flex-grow p-6 overflow-y-auto space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col justify-center items-center text-center space-y-3">
                <MessageSquare className="w-8 h-8 text-gray-600" />
                <p className="text-xs text-gray-500 max-w-xs">
                  Select your resume context and target role on the left, then click Start to begin your simulated interview.
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isInterviewer = msg.role === 'interviewer';
                return (
                  <div key={msg.id || index} className="space-y-3">
                    <div className={`flex ${isInterviewer ? 'justify-start' : 'justify-end'}`}>
                      {/* Message bubble */}
                      <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                        isInterviewer 
                          ? 'bg-purple-950/20 border border-purple-500/10 text-purple-200' 
                          : 'bg-white/3 border border-white/5 text-gray-200 shadow-md'
                      }`}>
                        {msg.content}
                      </div>
                    </div>

                    {/* Render STAR assessor card for Candidate reply */}
                    {!isInterviewer && msg.feedback && (
                      <div className="flex justify-end pl-12">
                        <div className="w-full max-w-[85%] glass-card bg-black/60 border-white/5 overflow-hidden">
                          <button
                            onClick={() => setExpandedFeedback(prev => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                            className="w-full flex items-center justify-between px-4 py-2.5 bg-white/2 hover:bg-white/5 text-xs text-gray-400 transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2 font-mono">
                              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                              STAR EVALUATION REPORT
                            </span>
                            <span className="flex items-center gap-3">
                              <span className="font-bold text-white bg-cyan-950/30 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px]">
                                {msg.feedback.score}/100
                              </span>
                              {expandedFeedback[msg.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </span>
                          </button>

                          {/* Assessment details */}
                          <AnimatePresence>
                            {expandedFeedback[msg.id] && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden border-t border-white/5 p-4 space-y-4"
                              >
                                {/* STAR breakdown grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {[
                                    { label: 'Situation (S)', content: msg.feedback.star_breakdown.situation },
                                    { label: 'Task (T)', content: msg.feedback.star_breakdown.task },
                                    { label: 'Action (A)', content: msg.feedback.star_breakdown.action },
                                    { label: 'Result (R)', content: msg.feedback.star_breakdown.result }
                                  ].map((section, sIdx) => (
                                    <div key={sIdx} className="p-2.5 bg-white/2 border border-white/5 rounded-lg text-[11px] leading-relaxed">
                                      <span className="font-bold text-cyan-400 block mb-1">{section.label}</span>
                                      <span className="text-gray-400">{section.content}</span>
                                    </div>
                                  ))}
                                </div>

                                {/* Coaching advice */}
                                <div className="p-3 bg-purple-950/15 border border-purple-500/20 rounded-xl text-xs space-y-1">
                                  <span className="font-semibold text-purple-400 flex items-center gap-1">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    AI Recruiter Suggestions
                                  </span>
                                  <p className="text-purple-200 leading-normal">{msg.feedback.suggestions}</p>
                                </div>

                                {/* Model STAR Response */}
                                <div className="p-3 bg-white/3 border border-white/5 rounded-xl text-xs space-y-1">
                                  <span className="font-semibold text-gray-300">Model STAR Response</span>
                                  <p className="text-gray-400 italic leading-relaxed">{msg.feedback.model_answer}</p>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Spinner indicator when analyzing candidate response */}
            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-3 max-w-[85%] rounded-2xl p-4 bg-purple-950/20 border border-purple-500/10 text-purple-200 text-xs font-mono">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400 shrink-0" />
                  EVALUATING STAR FORMULATION & SELECTING FOLLOW-UP QUESTION...
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <form onSubmit={handleSendAnswer} className="p-4 border-t border-white/5 bg-[#0d0c1c]/60 shrink-0 flex items-center gap-3">
            <textarea
              disabled={!activeSessionId || isSending}
              rows={1}
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendAnswer(e);
                }
              }}
              placeholder={activeSessionId ? "Formulate your STAR response here (Enter to submit)..." : "Start the simulation on the left first..."}
              className="flex-grow glass-input text-xs py-2.5 resize-none h-10 max-h-24 overflow-y-auto"
            />
            <button
              type="submit"
              disabled={!activeSessionId || !currentAnswer.trim() || isSending}
              className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl disabled:opacity-30 transition-all cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
