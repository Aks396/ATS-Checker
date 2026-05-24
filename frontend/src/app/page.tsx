'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { 
  ArrowRight, ShieldCheck, FileText, Sparkles, TrendingUp, 
  Briefcase, MessageSquare, Layers, Award, GitBranch, 
  FileEdit, Star, Zap, Brain, Lock, ChevronRight, Check
} from 'lucide-react';
import { useRef } from 'react';

// --- Sub-Components ---

function NavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 backdrop-blur-xl bg-black/40">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-black text-white text-sm shadow-[0_0_20px_rgba(168,85,247,0.5)]">
            A
          </div>
          <span className="text-lg font-bold tracking-wider">
            <span className="text-white">APEX</span>
            <span className="text-cyan-400 font-light">ATS</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#platform" className="hover:text-white transition-colors">Platform</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm font-semibold px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]"
          >
            Get Started Free
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
  };
  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: 'easeOut' as const } }
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden">
      {/* Atmospheric glow effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      {/* Animated grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="relative z-10 max-w-5xl mx-auto text-center px-6 py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-500/10 border border-purple-500/25 rounded-full mb-8">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span className="text-xs text-purple-300 font-mono tracking-widest uppercase">Powered by Google Gemini AI · Next.js · FastAPI</span>
          </motion.div>

          {/* Main headline */}
          <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            <span className="text-white block">Your AI-Powered</span>
            <span className="block mt-2 bg-gradient-to-r from-purple-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent pb-2">
              Career Intelligence OS
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p variants={itemVariants} className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            The only platform that combines ATS resume scoring, AI job matching, STAR interview prep, 
            Kanban job tracking, and recruiter vetting — all in one dark, premium interface.
          </motion.p>

          {/* CTA buttons */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link
              href="/signup"
              id="hero-cta-signup"
              className="group flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-lg rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.35)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] transition-all duration-300"
            >
              Launch Apex ATS Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              id="hero-cta-login"
              className="flex items-center gap-2 px-8 py-4 border border-white/10 hover:border-white/25 text-gray-300 hover:text-white bg-white/3 hover:bg-white/6 font-semibold text-lg rounded-2xl transition-all duration-300"
            >
              Sign In to Dashboard
            </Link>
          </motion.div>

          {/* Social proof strip */}
          <motion.div variants={itemVariants} className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-500">
            {['No credit card required', 'Free forever plan', '100% AI-powered', 'Local & private'].map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                {item}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Hero dashboard preview card */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 max-w-5xl w-full mx-auto px-6 pb-20"
      >
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)]">
          {/* Fake browser chrome */}
          <div className="bg-[#0a0a14] border-b border-white/5 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <div className="flex-grow mx-4">
              <div className="bg-white/5 border border-white/5 rounded-lg px-3 py-1 text-[10px] text-gray-500 font-mono text-center w-fit mx-auto">
                apex-ats.ai/dashboard
              </div>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="bg-[#030303] p-6">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Total Resumes', value: '7', color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { label: 'Job Matches', value: '23', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                { label: 'Average ATS Score', value: '78%', color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Highest Score', value: '92%', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              ].map((card, i) => (
                <div key={i} className={`${card.bg} border border-white/5 rounded-xl p-3 flex items-center justify-between`}>
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider">{card.label}</p>
                    <p className={`text-xl font-black ${card.color}`}>{card.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3 bg-white/2 border border-white/5 rounded-xl p-4 h-32">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-3">Score Progression</p>
                <div className="flex items-end gap-1 h-16">
                  {[45, 58, 62, 70, 74, 78, 85, 88, 92].map((h, i) => (
                    <div key={i} className="flex-1 rounded-sm bg-gradient-to-t from-purple-600 to-cyan-400 opacity-70" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="col-span-2 bg-white/2 border border-white/5 rounded-xl p-4 h-32 flex flex-col justify-between">
                <p className="text-[9px] text-gray-500 uppercase tracking-wider">Recent Activity</p>
                <div className="space-y-2">
                  {['Resume uploaded', 'ATS Score: 92%', 'Job matched: Stripe'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="text-[9px] text-gray-400">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Glow under the card */}
        <div className="absolute inset-x-20 -bottom-10 h-20 bg-purple-600/20 blur-[40px] pointer-events-none" />
      </motion.div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { value: '9+', label: 'AI-Powered Modules', icon: Brain },
    { value: '100%', label: 'Gemini AI Integration', icon: Sparkles },
    { value: '5ms', label: 'Average Response Time', icon: Zap },
    { value: '0', label: 'Data Sent to Third Parties', icon: Lock },
  ];

  return (
    <section className="py-20 border-y border-white/5 bg-white/[0.01]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center space-y-2"
              >
                <Icon className="w-6 h-6 text-purple-400 mx-auto mb-3" />
                <p className="text-4xl font-black bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: FileText,
      title: 'Deep Resume Parsing',
      description: 'Gemini AI extracts name, skills, experience, education, and projects from any PDF or DOCX with surgical precision.',
      color: 'from-purple-600 to-purple-400',
      glow: 'purple',
      size: 'large'
    },
    {
      icon: ShieldCheck,
      title: 'Multi-Factor ATS Scoring',
      description: 'Scores formatting quality, readability, action verb usage, skills density, and keyword quantification.',
      color: 'from-cyan-600 to-cyan-400',
      glow: 'cyan',
      size: 'small'
    },
    {
      icon: Briefcase,
      title: 'Semantic Job Matching',
      description: 'Paste any JD and get an exact match percentage, missing skills, keyword gaps, and AI rewrite suggestions.',
      color: 'from-blue-600 to-blue-400',
      glow: 'blue',
      size: 'small'
    },
    {
      icon: Award,
      title: 'STAR Mock Interview Simulator',
      description: 'Conduct AI-powered interview sessions graded on Situation, Task, Action, Result methodology with model answers and coaching.',
      color: 'from-amber-600 to-amber-400',
      glow: 'amber',
      size: 'large'
    },
    {
      icon: Layers,
      title: 'Kanban Job Tracker',
      description: 'Track job applications across pipeline stages — wishlist, applied, interviewing, offer, rejected — with checklists and JD linking.',
      color: 'from-emerald-600 to-emerald-400',
      glow: 'emerald',
      size: 'medium'
    },
    {
      icon: FileEdit,
      title: 'Notion-like Resume Editor',
      description: 'Edit your resume sections block-by-block with inline AI rewrite suggestions powered by Gemini.',
      color: 'from-rose-600 to-rose-400',
      glow: 'rose',
      size: 'medium'
    },
    {
      icon: MessageSquare,
      title: 'AI Resume Copilot',
      description: 'Chat with your resume using natural language. Ask anything about your career history, gaps, or improvement strategies.',
      color: 'from-violet-600 to-violet-400',
      glow: 'violet',
      size: 'small'
    },
    {
      icon: GitBranch,
      title: 'Career Pathfinder',
      description: 'Interactive career track flowcharts with Perplexity-style AI roadmap planning to reach your next role.',
      color: 'from-indigo-600 to-indigo-400',
      glow: 'indigo',
      size: 'small'
    },
  ];

  const glowColors: Record<string, string> = {
    purple: 'shadow-[0_0_25px_rgba(168,85,247,0.2)]',
    cyan: 'shadow-[0_0_25px_rgba(6,182,212,0.2)]',
    blue: 'shadow-[0_0_25px_rgba(59,130,246,0.2)]',
    amber: 'shadow-[0_0_25px_rgba(245,158,11,0.2)]',
    emerald: 'shadow-[0_0_25px_rgba(16,185,129,0.2)]',
    rose: 'shadow-[0_0_25px_rgba(244,63,94,0.2)]',
    violet: 'shadow-[0_0_25px_rgba(139,92,246,0.2)]',
    indigo: 'shadow-[0_0_25px_rgba(99,102,241,0.2)]',
  };

  return (
    <section id="features" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">9 Modules. One Platform.</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Everything you need to<br />
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">land your dream job</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Apex Career OS is not just an ATS checker. It&apos;s a complete AI-powered career operating system built for modern engineering candidates.
          </p>
        </motion.div>

        {/* Bento feature grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`group relative rounded-2xl border border-white/7 bg-[#0a0914]/60 backdrop-blur-sm p-7 space-y-4 hover:border-white/15 transition-all duration-300 hover:${glowColors[feat.glow]} ${
                  feat.size === 'large' ? 'md:col-span-2 lg:col-span-1' : ''
                }`}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white shadow-lg`}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-white/90">{feat.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{feat.description}</p>
                </div>

                {/* Hover arrow */}
                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PlatformSection() {
  const steps = [
    {
      step: '01',
      title: 'Upload Your Resume',
      description: 'Drop a PDF or DOCX. Gemini AI parses it instantly — extracting all sections, skills, and experience blocks in seconds.',
      icon: FileText,
      color: 'text-purple-400',
    },
    {
      step: '02',
      title: 'Get Your ATS Score',
      description: 'Receive a detailed multi-factor ATS score covering formatting, readability, action verbs, keywords, and quantification.',
      icon: TrendingUp,
      color: 'text-cyan-400',
    },
    {
      step: '03',
      title: 'Match Against Job Descriptions',
      description: 'Paste any job description. Get a semantic match %, missing skills, keyword gaps, and tailored rewrite suggestions.',
      icon: Briefcase,
      color: 'text-blue-400',
    },
    {
      step: '04',
      title: 'Practice & Track Applications',
      description: 'Simulate recruiter audits, run STAR mock interviews, and track all your applications through a Linear-like Kanban board.',
      icon: Award,
      color: 'text-emerald-400',
    },
  ];

  return (
    <section id="platform" className="py-28 px-6 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <Star className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">How It Works</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            From resume upload to<br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">interview-ready in minutes</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative space-y-5 p-7 rounded-2xl border border-white/7 bg-[#0a0914]/60 group hover:border-white/15 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-white/5 font-mono">{step.step}</span>
                  <div className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center ${step.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">{step.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight className="w-6 h-6 text-white/10" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for individual job seekers getting started.',
      features: [
        'Upload up to 3 resumes',
        'Full ATS scoring report',
        'Job description matching',
        'AI resume copilot (10 messages/day)',
        'Basic analytics dashboard',
      ],
      cta: 'Get Started Free',
      href: '/signup',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$19',
      period: '/month',
      description: 'For serious job seekers who want every advantage.',
      features: [
        'Unlimited resume uploads',
        'STAR Mock Interview simulator',
        'AI Recruiter vetting screen',
        'Career Pathfinder AI planner',
        'Linear-like Kanban job tracker',
        'Notion-like AI resume editor',
        'Priority AI response',
        'PDF report export',
      ],
      cta: 'Start Pro Trial',
      href: '/signup',
      highlight: true,
    },
  ];

  return (
    <section id="pricing" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16 space-y-4"
        >
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Simple, transparent <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">pricing</span>
          </h2>
          <p className="text-lg text-gray-400">Start free. Upgrade when you need the full arsenal.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-8 space-y-6 border transition-all duration-300 ${
                plan.highlight
                  ? 'border-purple-500/50 bg-gradient-to-b from-purple-500/10 to-transparent shadow-[0_0_50px_rgba(168,85,247,0.15)]'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full text-[10px] font-bold text-white uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <div>
                <p className="text-sm text-gray-400 font-mono uppercase tracking-wider mb-1">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feat, fi) => (
                  <li key={fi} className="flex items-center gap-2.5 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]'
                    : 'border border-white/10 text-white hover:bg-white/5'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-28 px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto text-center relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-cyan-600/10 to-blue-600/10 rounded-3xl blur-[60px]" />
        <div className="relative border border-white/10 rounded-3xl p-16 bg-white/[0.02] backdrop-blur-sm space-y-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-xs text-gray-400 font-mono uppercase tracking-widest">Start your career transformation</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white">
              Ready to outsmart<br />every ATS system?
            </h2>
            <p className="text-lg text-gray-400 max-w-lg mx-auto">
              Join thousands of engineering candidates who use Apex Career OS to land senior roles at top-tier companies.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold text-lg rounded-2xl shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] transition-all duration-300"
            >
              Launch Apex ATS Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-black text-white text-xs">
            A
          </div>
          <span className="text-sm font-bold text-white">APEX<span className="text-cyan-400 font-light">ATS</span></span>
        </div>

        <p className="text-xs text-gray-500 text-center">
          © {new Date().getFullYear()} Apex Career OS. Built with Next.js 15, FastAPI, Gemini AI. For engineering candidates everywhere.
        </p>

        <div className="flex items-center gap-6 text-xs text-gray-500">
          <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          <Link href="/signup" className="hover:text-white transition-colors">Get Started</Link>
        </div>
      </div>
    </footer>
  );
}

// --- Main Export ---
export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#030303] overflow-hidden">
      {/* Subtle noise texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'1\'/%3E%3C/svg%3E")',
        backgroundRepeat: 'repeat',
        backgroundSize: '128px 128px'
      }} />

      <NavBar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <PlatformSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
