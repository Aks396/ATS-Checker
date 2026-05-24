'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileText, 
  TrendingUp, 
  Briefcase, 
  Award, 
  UploadCloud, 
  ArrowUpRight, 
  Loader2, 
  Clock, 
  CheckCircle2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { api } from '@/lib/api';

interface DashboardStats {
  total_resumes: number;
  total_matches: number;
  avg_ats_score: number;
  highest_ats_score: number;
  score_progression: Array<{ name: string; score: number; date: string }>;
  skills_distribution: Array<{ subject: string; count: number; fullMark: number }>;
  recent_activity: Array<{ type: string; title: string; description: string; time: string }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/analytics/dashboard');
        setStats(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full min-h-[50vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin mx-auto" />
          <p className="text-sm text-gray-400 font-mono">RETRIEVING ANALYTICS CORE...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="glass-card p-8 border-red-500/20 bg-red-500/5 text-center space-y-4">
        <p className="text-red-400 font-medium">{error || 'An error occurred.'}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-sm text-white">
          Retry Connection
        </button>
      </div>
    );
  }

  // If user has not uploaded any resumes, show the empty state
  if (stats.total_resumes === 0) {
    return (
      <div className="h-full min-h-[70vh] flex flex-col justify-center items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-md text-center p-8 glass-card border-white/5 space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white mx-auto shadow-[0_0_20px_rgba(168,85,247,0.35)]">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">No Resumes Analyzed Yet</h2>
            <p className="text-sm text-gray-400">
              Upload your resume (PDF or DOCX) to analyze key skills, action verb density, structural format, and generate optimization metrics.
            </p>
          </div>
          <Link 
            href="/upload" 
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 rounded-lg text-white font-medium text-sm transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.45)] cursor-pointer"
          >
            Upload Resume
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    );
  }

  const statCards = [
    { name: 'Total Resumes', value: stats.total_resumes, icon: FileText, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { name: 'Job Matches', value: stats.total_matches, icon: Briefcase, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
    { name: 'Average ATS Score', value: `${stats.avg_ats_score}%`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { name: 'Highest ATS Score', value: `${stats.highest_ats_score}%`, icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Systems Dashboard</h1>
        <p className="text-sm text-gray-400">Real-time telemetry, scoring, and matching overview.</p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 border-white/5 flex items-center justify-between group glass-card-hover"
            >
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.name}</p>
                <p className="text-2xl font-bold text-white">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.bg} ${card.border} border flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Score Progression Line Chart (3/5 columns) */}
        <div className="glass-card p-6 border-white/5 lg:col-span-3 flex flex-col justify-between min-h-[350px]">
          <div className="mb-4">
            <h3 className="text-base font-bold text-white">Score Progression</h3>
            <p className="text-xs text-gray-400">Visual mapping of latest document evaluations.</p>
          </div>
          <div className="flex-grow w-full h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.score_progression} margin={{ left: -25, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d0c1c', borderColor: 'rgba(255,255,255,0.08)', borderRadius: '10px' }} 
                  labelStyle={{ color: '#9ca3af', fontSize: '12px' }}
                  itemStyle={{ color: '#ffffff', fontSize: '14px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill distribution Radar Chart (2/5 columns) */}
        <div className="glass-card p-6 border-white/5 lg:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div className="mb-2">
            <h3 className="text-base font-bold text-white">Top Core Skillsets</h3>
            <p className="text-xs text-gray-400">Aggregation of extracted technical vocabulary.</p>
          </div>
          <div className="flex-grow w-full h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={stats.skills_distribution}>
                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} stroke="rgba(255,255,255,0.1)" tick={false} />
                <Radar name="Skills Count" dataKey="count" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.25} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bottom section: Recent Activities */}
      <div className="glass-card p-6 border-white/5">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Telemetry & History</h3>
            <p className="text-xs text-gray-400">Chronological history of file operations and scans.</p>
          </div>
          <Clock className="w-5 h-5 text-gray-500" />
        </div>

        <div className="relative border-l border-white/10 pl-6 space-y-6">
          {stats.recent_activity.map((activity, index) => (
            <div key={index} className="relative">
              {/* Dot */}
              <span className="absolute -left-[31px] top-1.5 w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_10px_#a855f7]" />
              
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    {activity.title}
                    {activity.type === 'upload' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  </h4>
                  <p className="text-xs text-gray-400">{activity.description}</p>
                </div>
                <span className="text-[10px] font-mono text-gray-500 uppercase">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
