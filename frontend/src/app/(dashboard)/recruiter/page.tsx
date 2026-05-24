'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  ArrowUpRight, 
  Loader2, 
  AlertCircle,
  FileText,
  UserCheck,
  TrendingUp,
  MapPin,
  Briefcase
} from 'lucide-react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Resume {
  id: number;
  filename: string;
  ats_score: number;
}

interface RecruiterReport {
  candidate_tier: 'Tier-1' | 'Tier-2' | 'Tier-3';
  red_flags: string[];
  top_fit_roles: string[];
  general_recommendation: string;
}

export default function RecruiterPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [isLoadingResumes, setIsLoadingResumes] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [report, setReport] = useState<RecruiterReport | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (selectedResumeId) {
      triggerRecruiterAudit(Number(selectedResumeId));
    } else {
      setReport(null);
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
      console.error(err);
      setErrorMsg('Failed to load resumes.');
    } finally {
      setIsLoadingResumes(false);
    }
  };

  const triggerRecruiterAudit = async (resumeId: number) => {
    setIsAuditing(true);
    setErrorMsg(null);
    setReport(null);
    try {
      const response = await api.get(`/recruiter/analyse/${resumeId}`);
      setReport(response.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate recruiter screening analysis.');
    } finally {
      setIsAuditing(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Tier-1':
        return {
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          glow: 'shadow-[0_0_25px_rgba(16,185,129,0.25)]',
          label: 'Tier 1 - Elite Candidate Fit'
        };
      case 'Tier-2':
        return {
          text: 'text-amber-400',
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          glow: 'shadow-[0_0_25px_rgba(245,158,11,0.25)]',
          label: 'Tier 2 - Strong Fit with Gaps'
        };
      case 'Tier-3':
      default:
        return {
          text: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          glow: 'shadow-[0_0_25px_rgba(239,68,68,0.25)]',
          label: 'Tier 3 - Gaps to Resolve'
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-purple-500 w-8 h-8" />
            AI Recruiter Screening Audit
          </h1>
          <p className="text-sm text-gray-400">
            Simulate recruiter vetting pipelines. Audits parsing checks, warning red flags, and job fits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            disabled={isAuditing || isLoadingResumes}
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
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Main Vetting Report */}
      {isAuditing ? (
        <div className="h-[50vh] flex flex-col justify-center items-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-3" />
          <p className="text-sm text-gray-400 font-mono">SIMULATING UNICORN RECRUITER ATS PIPELINE...</p>
        </div>
      ) : report ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Vetting Overview Columns (1/3 Width) */}
          <div className="space-y-6">
            
            {/* Rank Assessment Card */}
            {(() => {
              const tierMeta = getTierColor(report.candidate_tier);
              return (
                <div className={`glass-card p-6 border ${tierMeta.border} ${tierMeta.bg} ${tierMeta.glow} flex flex-col items-center text-center space-y-4`}>
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-purple-400">
                    <UserCheck className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">Candidate Placement Grade</span>
                    <h2 className={`text-3xl font-black tracking-tight ${tierMeta.text}`}>
                      {report.candidate_tier}
                    </h2>
                    <p className="text-xs text-gray-300 font-medium">
                      {tierMeta.label}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* General recommendation */}
            <div className="glass-card p-6 border-white/5 space-y-4 bg-gradient-to-b from-[#0b0a17]/80 to-[#080711]/60">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Vetting Executive Summary</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-sans">
                {report.general_recommendation}
              </p>
            </div>

            {/* Quick Navigation suggestions */}
            <div className="glass-card p-6 border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Vetting Mitigations</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Fixing the identified red flags on the right increases ATS parser score and helps elevate positioning parameters.
              </p>
              
              <div className="space-y-2 pt-2">
                <Link
                  href="/editor"
                  className="w-full flex items-center justify-between p-2.5 bg-white/3 border border-white/5 hover:bg-purple-500/10 hover:border-purple-500/20 rounded-xl text-xs text-gray-300 transition-all cursor-pointer font-medium"
                >
                  Modify Resume in Canvas
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                </Link>
                <Link
                  href="/interview"
                  className="w-full flex items-center justify-between p-2.5 bg-white/3 border border-white/5 hover:bg-purple-500/10 hover:border-purple-500/20 rounded-xl text-xs text-gray-300 transition-all cursor-pointer font-medium"
                >
                  Practice Interview Simulation
                  <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
                </Link>
              </div>
            </div>

          </div>

          {/* Vetting Detail Audit Columns (2/3 Width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Risk Assessment & Red flags */}
            <div className="glass-card p-6 border-white/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="text-amber-500 w-4 h-4" />
                  Flagged Red Flags & Warnings
                </h3>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2.5 py-0.5 rounded border border-amber-500/20">
                  {report.red_flags.length} Warnings
                </span>
              </div>

              <div className="space-y-3">
                {report.red_flags.map((flag, idx) => (
                  <div key={idx} className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-gray-300">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{flag}</span>
                  </div>
                ))}
                
                {report.red_flags.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                    <span className="text-xs text-gray-400">Vetting pipeline clean. No critical red flags detected.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Target Job Fit roles */}
            <div className="glass-card p-6 border-white/5 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="text-purple-400 w-4 h-4" />
                Vetting Vocation Alignment
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {report.top_fit_roles.map((role, idx) => (
                  <div key={idx} className="p-4 bg-white/2 border border-white/5 rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{role}</h4>
                      <span className="text-[10px] font-mono text-cyan-400">Optimal profile alignment</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      ) : (
        <div className="glass-card p-8 text-center space-y-4">
          <p className="text-gray-400 font-mono">NO ACTIVE ASSESSMENT REPORT RUN.</p>
        </div>
      )}
    </div>
  );
}
