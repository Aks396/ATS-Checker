'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  User, Edit3, Save, X, ExternalLink, Globe,
  UploadCloud, Briefcase, Award, TrendingUp, ShieldCheck, Zap,
  FileText, Clock, Star, Check, ChevronRight, Sparkles, Brain,
  Target, ArrowUpRight, Loader2, AlertCircle, Lock, Mic,
  BarChart2, CheckCircle, UserCheck, GitBranch, Layers,
  MessageSquare, Trophy
} from 'lucide-react';

// Custom SVG implementations for brand icons removed in lucide-react v1.0+
const Github = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileData {
  id: number; name: string; email: string; profile_image: string | null;
  bio: string | null; career_title: string | null; target_role: string | null;
  banner_color: string; preferred_stack: string[]; target_salary: string | null;
  experience_level: string; remote_preference: string;
  linkedin_url: string | null; github_url: string | null; portfolio_url: string | null;
  ai_career_score: number; recruiter_visibility_score: number;
  xp_points: number; career_level: string; created_at: string;
}

interface StatsData {
  total_resumes: number; total_matches: number; total_interviews: number;
  avg_ats_score: number; highest_ats_score: number; profile_completion: number;
  xp_points: number; career_level: string; recruiter_visibility_score: number;
  ai_career_score: number; score_progression: { name: string; score: number; date: string }[];
  top_skills: { name: string; count: number }[];
  timeline: { type: string; title: string; meta: string; time: string }[];
  badges: { id: string; name: string; description: string; icon: string; color: string; unlocked: boolean }[];
  resumes_summary: { id: number; filename: string; ats_score: number; created_at: string; skills_count: number }[];
}

interface InsightsData {
  strengths: string[]; improvements: string[];
  next_step: string; readiness_summary: string; generated_bio: string | null;
}

// ── Animated Counter ──────────────────────────────────────────────────────────

function AnimatedNumber({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1200;
    const steps = 60;
    const increment = value / steps;
    const interval = duration / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, interval);
    return () => clearInterval(timer);
  }, [inView, value]);

  return <span ref={ref}>{decimals > 0 ? display.toFixed(decimals) : Math.round(display)}{suffix}</span>;
}

// ── Radial Progress ───────────────────────────────────────────────────────────

function RadialProgress({ value, size = 80, strokeWidth = 6, color = '#a855f7', label }: {
  value: number; size?: number; strokeWidth?: number; color?: string; label?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />
          <motion.circle
            cx={size/2} cy={size/2} r={radius} fill="transparent"
            stroke={color} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black text-white">{Math.round(value)}%</span>
        </div>
      </div>
      {label && <span className="text-[10px] text-gray-500 uppercase tracking-wider text-center">{label}</span>}
    </div>
  );
}

// ── Badge Icon Map ────────────────────────────────────────────────────────────

const BADGE_ICONS: Record<string, React.ElementType> = {
  UploadCloud, ShieldCheck, Award, FileText, Briefcase, Mic, UserCheck, TrendingUp,
};

// ── Settings Form ─────────────────────────────────────────────────────────────

const EXPERIENCE_LEVELS = ['junior', 'mid', 'senior', 'lead', 'principal'];
const REMOTE_OPTIONS = ['remote', 'hybrid', 'onsite'];
const BANNER_GRADIENTS = [
  { label: 'Apex Purple', value: 'from-purple-600 via-blue-600 to-cyan-500' },
  { label: 'Midnight', value: 'from-slate-800 via-purple-900 to-slate-900' },
  { label: 'Aurora', value: 'from-emerald-600 via-teal-500 to-cyan-400' },
  { label: 'Sunset', value: 'from-orange-600 via-rose-500 to-pink-500' },
  { label: 'Ocean', value: 'from-blue-700 via-indigo-600 to-violet-500' },
  { label: 'Gold', value: 'from-amber-600 via-yellow-500 to-orange-400' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingInsights, setIsLoadingInsights] = useState(true);
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Settings form state
  const [formData, setFormData] = useState({
    career_title: '', target_role: '', bio: '', target_salary: '',
    experience_level: 'mid', remote_preference: 'remote',
    linkedin_url: '', github_url: '', portfolio_url: '',
    preferred_stack: '', banner_color: 'from-purple-600 via-blue-600 to-cyan-500'
  });

  useEffect(() => {
    Promise.all([
      api.get('/profile/me'),
      api.get('/profile/stats'),
    ]).then(([profileRes, statsRes]) => {
      setProfile(profileRes.data);
      setStats(statsRes.data);
      // Pre-fill form
      const p = profileRes.data;
      setFormData({
        career_title: p.career_title || '',
        target_role: p.target_role || '',
        bio: p.bio || '',
        target_salary: p.target_salary || '',
        experience_level: p.experience_level || 'mid',
        remote_preference: p.remote_preference || 'remote',
        linkedin_url: p.linkedin_url || '',
        github_url: p.github_url || '',
        portfolio_url: p.portfolio_url || '',
        preferred_stack: (p.preferred_stack || []).join(', '),
        banner_color: p.banner_color || 'from-purple-600 via-blue-600 to-cyan-500',
      });
    }).catch(console.error).finally(() => {
      setIsLoadingProfile(false);
      setIsLoadingStats(false);
    });

    // Load insights separately (may be slow due to AI)
    api.get('/profile/insights').then(res => {
      setInsights(res.data);
    }).catch(console.error).finally(() => setIsLoadingInsights(false));
  }, []);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await api.patch('/profile/me', {
        ...formData,
        preferred_stack: formData.preferred_stack.split(',').map(s => s.trim()).filter(Boolean),
      });
      // Re-fetch profile to sync state
      const res = await api.get('/profile/me');
      setProfile(res.data);
      setSaveSuccess(true);
      setIsEditingSettings(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center mx-auto animate-pulse">
            <User className="w-8 h-8 text-white" />
          </div>
          <p className="text-sm text-gray-400 font-mono animate-pulse">LOADING IDENTITY MATRIX...</p>
        </div>
      </div>
    );
  }

  const p = profile;
  const s = stats;

  // XP to next level thresholds
  const levelThresholds: Record<string, [number, number]> = {
    Junior: [0, 60], Mid: [60, 150], Senior: [150, 300], Lead: [300, 500], Principal: [500, 500]
  };
  const currentLevel = s?.career_level || 'Junior';
  const [levelMin, levelMax] = levelThresholds[currentLevel] || [0, 60];
  const xpProgress = levelMax === levelMin ? 100 : Math.min(100, Math.round(((s?.xp_points || 0) - levelMin) / (levelMax - levelMin) * 100));

  const scoreColor = (v: number) => v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="space-y-8 pb-12">

      {/* ── Section 1: HERO BANNER ─────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative rounded-2xl overflow-hidden"
      >
        {/* Gradient Banner */}
        <div className={`h-44 w-full bg-gradient-to-r ${p?.banner_color || 'from-purple-600 via-blue-600 to-cyan-500'} relative`}>
          <div className="absolute inset-0 bg-black/20" />
          {/* Floating orbs inside banner */}
          <div className="absolute top-4 right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute bottom-0 left-16 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          {/* Edit banner / settings button */}
          <button
            onClick={() => setIsEditingSettings(true)}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/30 hover:bg-black/50 backdrop-blur-sm border border-white/20 rounded-lg text-xs text-white font-medium transition-all cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            Edit Profile
          </button>
        </div>

        {/* Profile info card below banner */}
        <div className="bg-[#0a0914]/80 backdrop-blur-sm border border-white/7 rounded-b-2xl px-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-14 mb-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 border-4 border-[#0a0914] flex items-center justify-center text-white text-3xl font-black shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                {p?.name ? p.name[0].toUpperCase() : 'U'}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0a0914] shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            </div>

            {/* Name + Title */}
            <div className="flex-grow space-y-1 pb-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-black text-white">{p?.name}</h1>
                {/* Career level badge */}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded-full text-[10px] font-bold text-purple-300 uppercase tracking-widest">
                  <Zap className="w-2.5 h-2.5" />
                  {s?.career_level || 'Junior'}
                </span>
              </div>
              <p className="text-sm text-cyan-400 font-medium">
                {p?.career_title || 'Software Engineer'}
              </p>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="font-mono">{p?.email}</span>
                {p?.remote_preference && (
                  <span className="ml-2 px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] uppercase tracking-wider">{p.remote_preference}</span>
                )}
                {p?.experience_level && (
                  <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] uppercase tracking-wider">{p.experience_level}</span>
                )}
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2 pb-2 shrink-0">
              {p?.github_url && (
                <a href={p.github_url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer">
                  <Github className="w-4 h-4" />
                </a>
              )}
              {p?.linkedin_url && (
                <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {p?.portfolio_url && (
                <a href={p.portfolio_url} target="_blank" rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer">
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Bio */}
          {p?.bio && (
            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl mb-6 border-l-2 border-purple-500/40 pl-4 italic">
              {p.bio}
            </p>
          )}

          {/* 3 Score Counters */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Avg ATS Score', value: s?.avg_ats_score || 0, suffix: '%', color: '#a855f7', icon: ShieldCheck },
              { label: 'Recruiter Visibility', value: s?.recruiter_visibility_score || 0, suffix: '%', color: '#06b6d4', icon: UserCheck },
              { label: 'AI Career Score', value: s?.ai_career_score || 0, suffix: '%', color: '#10b981', icon: Brain },
            ].map((metric, i) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="bg-white/3 border border-white/8 rounded-xl p-4 text-center space-y-2"
                >
                  <Icon className="w-4 h-4 mx-auto" style={{ color: metric.color }} />
                  <p className="text-2xl font-black" style={{ color: metric.color }}>
                    <AnimatedNumber value={metric.value} suffix={metric.suffix} decimals={1} />
                  </p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">{metric.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* XP Progress Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-mono flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                {s?.xp_points || 0} XP · {s?.career_level || 'Junior'}
              </span>
              <span className="text-gray-600">Next: {currentLevel === 'Principal' ? 'MAX' : levelMax} XP</span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${xpProgress}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Section 2: CAREER ANALYTICS ───────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Career Analytics</h2>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Resumes', value: s?.total_resumes || 0, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
            { label: 'Job Matches', value: s?.total_matches || 0, icon: Briefcase, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
            { label: 'Interviews', value: s?.total_interviews || 0, icon: Mic, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: 'Avg ATS', value: s?.avg_ats_score || 0, icon: ShieldCheck, suffix: '%', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
            { label: 'Best ATS', value: s?.highest_ats_score || 0, icon: Award, suffix: '%', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
            { label: 'Profile', value: s?.profile_completion || 0, icon: UserCheck, suffix: '%', color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`glass-card p-4 ${card.border} flex flex-col items-center gap-2 text-center glass-card-hover`}
              >
                <div className={`w-9 h-9 rounded-xl ${card.bg} border ${card.border} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <p className={`text-xl font-black ${card.color}`}>
                  <AnimatedNumber value={card.value} suffix={card.suffix || ''} />
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{card.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* ATS Trend Chart + Radial Gauges */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Chart */}
          <div className="glass-card p-6 border-white/5 lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold text-white">ATS Score Progression</h3>
            <div className="h-48">
              {s && s.score_progression.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={s.score_progression} margin={{ left: -25, right: 10, top: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} />
                    <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0d0c1c', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '10px' }}
                      labelStyle={{ color: '#9ca3af', fontSize: '11px' }}
                      itemStyle={{ color: '#a855f7', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={2} fill="url(#profGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-gray-500">Upload resumes to see your score trend</div>
              )}
            </div>
          </div>

          {/* Radial gauges */}
          <div className="glass-card p-6 border-white/5 lg:col-span-2 flex flex-col justify-center">
            <h3 className="text-sm font-bold text-white mb-5">Profile Metrics</h3>
            <div className="flex justify-around items-center gap-4 flex-wrap">
              <RadialProgress value={s?.recruiter_visibility_score || 0} color="#06b6d4" label="Recruiter Visibility" />
              <RadialProgress value={s?.ai_career_score || 0} color="#a855f7" label="AI Career Score" />
              <RadialProgress value={s?.profile_completion || 0} color="#10b981" label="Profile Complete" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Section 3: SKILLS INTELLIGENCE ───────────────────────────── */}
      {s && s.top_skills.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-5">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Skills Intelligence</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Skill chip cloud */}
            <div className="lg:col-span-2 glass-card p-6 border-white/5 space-y-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">Extracted & Ranked by Frequency</p>
              <div className="flex flex-wrap gap-2">
                {s.top_skills.map((skill, i) => {
                  const maxCount = s.top_skills[0]?.count || 1;
                  const intensity = skill.count / maxCount;
                  return (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ scale: 1.08 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-default transition-all"
                      style={{
                        backgroundColor: `rgba(168, 85, 247, ${0.05 + intensity * 0.15})`,
                        borderColor: `rgba(168, 85, 247, ${0.2 + intensity * 0.4})`,
                        color: intensity >= 0.7 ? '#d8b4fe' : intensity >= 0.4 ? '#c084fc' : '#a78bfa',
                      }}
                    >
                      {skill.name}
                      {skill.count > 1 && (
                        <span className="text-[9px] text-purple-400/60 font-mono">×{skill.count}</span>
                      )}
                    </motion.span>
                  );
                })}
              </div>
            </div>

            {/* Radar chart */}
            <div className="glass-card p-6 border-white/5 flex flex-col items-center justify-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-mono mb-2">Skill Radar</p>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%"
                    data={s.top_skills.slice(0, 8).map(sk => ({ subject: sk.name.slice(0, 10), count: sk.count, fullMark: s.top_skills[0]?.count || 1 }))}>
                    <PolarGrid stroke="rgba(255,255,255,0.05)" />
                    <PolarAngleAxis dataKey="subject" stroke="#6b7280" fontSize={8} />
                    <Radar name="Skills" dataKey="count" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Preferred Stack */}
          {p?.preferred_stack && p.preferred_stack.length > 0 && (
            <div className="glass-card p-5 border-cyan-500/10 bg-cyan-500/5 space-y-2">
              <p className="text-xs text-cyan-400 uppercase tracking-wider font-mono font-bold flex items-center gap-1">
                <Star className="w-3 h-3" /> Preferred Tech Stack
              </p>
              <div className="flex flex-wrap gap-2">
                {p.preferred_stack.map((tech, i) => (
                  <span key={i} className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-medium">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Section 4: AI CAREER INSIGHTS ─────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-5">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">AI Career Insights</h2>
          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono rounded uppercase tracking-wider">Gemini AI</span>
        </div>

        {isLoadingInsights ? (
          <div className="glass-card p-8 border-white/5 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
            <p className="text-xs text-gray-400 font-mono animate-pulse">AI CAREER COACH ANALYZING YOUR PROFILE...</p>
          </div>
        ) : insights ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Strengths */}
            <div className="glass-card p-6 border-emerald-500/15 bg-emerald-500/5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-sm font-bold text-emerald-400">Strengths</h3>
              </div>
              <ul className="space-y-3">
                {insights.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="glass-card p-6 border-amber-500/15 bg-amber-500/5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Target className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-amber-400">Improvements</h3>
              </div>
              <ul className="space-y-3">
                {insights.improvements.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-gray-300 leading-relaxed">
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Readiness + Next Step */}
            <div className="glass-card p-6 border-purple-500/15 bg-purple-500/5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-sm font-bold text-purple-400">AI Coach Summary</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">{insights.readiness_summary}</p>
              <div className="border-t border-white/5 pt-3 space-y-1">
                <p className="text-[10px] text-purple-400 font-mono uppercase tracking-wider">Next Action</p>
                <p className="text-xs text-gray-300 leading-relaxed">{insights.next_step}</p>
              </div>
              {insights.generated_bio && (
                <div className="border-t border-white/5 pt-3 space-y-1">
                  <p className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider">AI-Generated Bio</p>
                  <p className="text-xs text-gray-400 italic leading-relaxed">&ldquo;{insights.generated_bio}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 border-white/5 text-center text-xs text-gray-500">
            Upload a resume to unlock AI career insights.
          </div>
        )}
      </motion.div>

      {/* ── Section 5: RESUME MANAGEMENT ──────────────────────────────── */}
      {s && s.resumes_summary.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Resume Vault</h2>
            </div>
            <Link href="/upload" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
              Manage all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {s.resumes_summary.map((resume, i) => {
              const sc = resume.ats_score;
              const col = sc >= 80 ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' : sc >= 60 ? 'text-amber-400 border-amber-500/20 bg-amber-500/10' : 'text-red-400 border-red-500/20 bg-red-500/10';
              return (
                <motion.div
                  key={resume.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card p-5 border-white/5 group glass-card-hover space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border ${col}`}>
                      {Math.round(sc)}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white truncate">{resume.filename}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {new Date(resume.created_at).toLocaleDateString()} · {resume.skills_count} skills
                    </p>
                  </div>
                  <Link href="/upload" className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
                    View Full Report <ChevronRight className="w-3 h-3" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Section 6: ACTIVITY TIMELINE ──────────────────────────────── */}
      {s && s.timeline.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-white">Activity Timeline</h2>
          </div>
          <div className="glass-card p-6 border-white/5">
            <div className="relative border-l border-white/10 pl-6 space-y-5">
              {s.timeline.map((event, i) => {
                const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
                  resume_upload: { icon: UploadCloud, color: 'text-purple-400', bg: 'bg-purple-500/20' },
                  job_match: { icon: Briefcase, color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
                  interview: { icon: Mic, color: 'text-amber-400', bg: 'bg-amber-500/20' },
                };
                const meta = iconMap[event.type] || { icon: Star, color: 'text-gray-400', bg: 'bg-white/10' };
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="relative"
                  >
                    <div className={`absolute -left-[31px] top-1 w-6 h-6 rounded-full ${meta.bg} border border-white/10 flex items-center justify-center`}>
                      <Icon className={`w-3 h-3 ${meta.color}`} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div>
                        <p className="text-sm font-semibold text-white">{event.title}</p>
                        <p className="text-xs text-gray-400">{event.meta}</p>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500">
                        {new Date(event.time).toLocaleDateString()}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Section 7: ACHIEVEMENTS ────────────────────────────────────── */}
      {s && (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">Achievements</h2>
            <span className="text-xs text-gray-500">
              {s.badges.filter(b => b.unlocked).length}/{s.badges.length} unlocked
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {s.badges.map((badge, i) => {
              const BadgeIcon = BADGE_ICONS[badge.icon] || Award;
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative p-4 rounded-2xl border text-center space-y-3 transition-all ${
                    badge.unlocked
                      ? 'glass-card border-white/10 glass-card-hover'
                      : 'bg-white/[0.02] border-white/5 opacity-40'
                  }`}
                >
                  {badge.unlocked && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_8px_rgba(16,185,129,0.6)]">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    </div>
                  )}
                  {!badge.unlocked && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-3.5 h-3.5 text-gray-600" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center ${
                    badge.unlocked ? 'bg-white/10 border border-white/10' : 'bg-white/5'
                  }`}>
                    <BadgeIcon className={`w-5 h-5 ${badge.unlocked ? badge.color : 'text-gray-600'}`} />
                  </div>
                  <div className="space-y-1">
                    <p className={`text-xs font-bold ${badge.unlocked ? 'text-white' : 'text-gray-600'}`}>
                      {badge.name}
                    </p>
                    <p className="text-[9px] text-gray-500 leading-tight">{badge.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* XP Summary */}
          <div className="glass-card p-5 border-amber-500/10 bg-amber-500/5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">{s.xp_points} XP Total</p>
                <p className="text-xs text-gray-400">Career Level: {s.career_level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">
                {s.badges.filter(b => b.unlocked).length} achievements unlocked
              </p>
              <p className="text-xs text-amber-400 font-mono">
                {currentLevel === 'Principal' ? 'MAX LEVEL REACHED' : `${levelMax - (s.xp_points || 0)} XP to ${Object.keys(levelThresholds)[Object.keys(levelThresholds).indexOf(currentLevel) + 1] || 'MAX'}`}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Section 8: SETTINGS PANEL ─────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-bold text-white">Profile Settings</h2>
          </div>
          {!isEditingSettings ? (
            <button
              onClick={() => setIsEditingSettings(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit Settings
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditingSettings(false)}
                className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-400 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 rounded-xl text-xs text-white font-semibold transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save Profile
              </button>
            </div>
          )}
        </div>

        {saveSuccess && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            Profile saved successfully!
          </motion.div>
        )}

        <div className={`glass-card border-white/5 transition-all duration-300 overflow-hidden ${isEditingSettings ? 'p-6' : 'p-6'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Career Title */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Career Title</label>
              {isEditingSettings ? (
                <input
                  value={formData.career_title}
                  onChange={e => setFormData(f => ({ ...f, career_title: e.target.value }))}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="glass-input w-full text-sm"
                />
              ) : (
                <p className="text-sm text-white">{p?.career_title || <span className="text-gray-500 italic">Not set</span>}</p>
              )}
            </div>

            {/* Target Role */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Target Role</label>
              {isEditingSettings ? (
                <input
                  value={formData.target_role}
                  onChange={e => setFormData(f => ({ ...f, target_role: e.target.value }))}
                  placeholder="e.g. Staff Engineer at Stripe"
                  className="glass-input w-full text-sm"
                />
              ) : (
                <p className="text-sm text-white">{p?.target_role || <span className="text-gray-500 italic">Not set</span>}</p>
              )}
            </div>

            {/* Target Salary */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Target Salary</label>
              {isEditingSettings ? (
                <input
                  value={formData.target_salary}
                  onChange={e => setFormData(f => ({ ...f, target_salary: e.target.value }))}
                  placeholder="e.g. $130k - $160k"
                  className="glass-input w-full text-sm"
                />
              ) : (
                <p className="text-sm text-white">{p?.target_salary || <span className="text-gray-500 italic">Not set</span>}</p>
              )}
            </div>

            {/* Preferred Stack */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Preferred Tech Stack (comma-separated)</label>
              {isEditingSettings ? (
                <input
                  value={formData.preferred_stack}
                  onChange={e => setFormData(f => ({ ...f, preferred_stack: e.target.value }))}
                  placeholder="e.g. React, FastAPI, PostgreSQL, AWS"
                  className="glass-input w-full text-sm"
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {(p?.preferred_stack || []).length > 0
                    ? p!.preferred_stack.map((t, i) => <span key={i} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-xs text-gray-300">{t}</span>)
                    : <span className="text-gray-500 italic text-sm">Not set</span>}
                </div>
              )}
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Experience Level</label>
              {isEditingSettings ? (
                <div className="flex gap-2 flex-wrap">
                  {EXPERIENCE_LEVELS.map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, experience_level: lvl }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer border ${
                        formData.experience_level === lvl
                          ? 'bg-purple-600/20 border-purple-500/50 text-purple-200'
                          : 'bg-white/3 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white capitalize">{p?.experience_level || 'mid'}</p>
              )}
            </div>

            {/* Remote Preference */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Work Preference</label>
              {isEditingSettings ? (
                <div className="flex gap-2">
                  {REMOTE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, remote_preference: opt }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all cursor-pointer border ${
                        formData.remote_preference === opt
                          ? 'bg-cyan-600/20 border-cyan-500/50 text-cyan-200'
                          : 'bg-white/3 border-white/10 text-gray-400 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white capitalize">{p?.remote_preference || 'remote'}</p>
              )}
            </div>

            {/* LinkedIn */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                <Linkedin className="w-3 h-3" /> LinkedIn URL
              </label>
              {isEditingSettings ? (
                <input
                  value={formData.linkedin_url}
                  onChange={e => setFormData(f => ({ ...f, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/yourname"
                  className="glass-input w-full text-sm"
                />
              ) : (
                p?.linkedin_url
                  ? <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline flex items-center gap-1">{p.linkedin_url} <ExternalLink className="w-3 h-3" /></a>
                  : <span className="text-gray-500 italic text-sm">Not set</span>
              )}
            </div>

            {/* GitHub */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                <Github className="w-3 h-3" /> GitHub URL
              </label>
              {isEditingSettings ? (
                <input
                  value={formData.github_url}
                  onChange={e => setFormData(f => ({ ...f, github_url: e.target.value }))}
                  placeholder="https://github.com/yourusername"
                  className="glass-input w-full text-sm"
                />
              ) : (
                p?.github_url
                  ? <a href={p.github_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline flex items-center gap-1">{p.github_url} <ExternalLink className="w-3 h-3" /></a>
                  : <span className="text-gray-500 italic text-sm">Not set</span>
              )}
            </div>

            {/* Portfolio */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                <Globe className="w-3 h-3" /> Portfolio URL
              </label>
              {isEditingSettings ? (
                <input
                  value={formData.portfolio_url}
                  onChange={e => setFormData(f => ({ ...f, portfolio_url: e.target.value }))}
                  placeholder="https://yourportfolio.dev"
                  className="glass-input w-full text-sm"
                />
              ) : (
                p?.portfolio_url
                  ? <a href={p.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline flex items-center gap-1">{p.portfolio_url} <ExternalLink className="w-3 h-3" /></a>
                  : <span className="text-gray-500 italic text-sm">Not set</span>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Professional Bio</label>
              {isEditingSettings ? (
                <textarea
                  value={formData.bio}
                  onChange={e => setFormData(f => ({ ...f, bio: e.target.value }))}
                  placeholder="Write a short professional bio (2-3 sentences)..."
                  rows={3}
                  className="glass-input w-full text-sm resize-none"
                />
              ) : (
                <p className="text-sm text-gray-300 leading-relaxed">{p?.bio || <span className="text-gray-500 italic">Not set — add a bio to make your profile stand out</span>}</p>
              )}
            </div>

            {/* Banner Color */}
            {isEditingSettings && (
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">Banner Style</label>
                <div className="flex flex-wrap gap-3">
                  {BANNER_GRADIENTS.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setFormData(f => ({ ...f, banner_color: g.value }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                        formData.banner_color === g.value ? 'border-white/30' : 'border-white/10'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${g.value}`} />
                      <span className={formData.banner_color === g.value ? 'text-white' : 'text-gray-400'}>{g.label}</span>
                      {formData.banner_color === g.value && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links to Other Modules */}
        <div className="glass-card p-5 border-white/5 space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-mono">Quick Actions</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Upload Resume', href: '/upload', icon: UploadCloud, color: 'text-purple-400' },
              { label: 'Job Matching', href: '/match', icon: Briefcase, color: 'text-cyan-400' },
              { label: 'Mock Interview', href: '/interview', icon: Mic, color: 'text-amber-400' },
              { label: 'AI Copilot', href: '/chat', icon: MessageSquare, color: 'text-emerald-400' },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <Link
                  key={i}
                  href={action.href}
                  className="flex items-center gap-2 p-3 bg-white/3 hover:bg-white/6 border border-white/5 hover:border-white/10 rounded-xl text-xs text-gray-400 hover:text-white transition-all group"
                >
                  <Icon className={`w-4 h-4 ${action.color}`} />
                  {action.label}
                  <ChevronRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>

    </div>
  );
}
