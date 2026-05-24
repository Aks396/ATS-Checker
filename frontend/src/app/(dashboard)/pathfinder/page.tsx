'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GitBranch, 
  Search, 
  Map, 
  Compass,
  ArrowRight, 
  TrendingUp, 
  Award, 
  BookOpen, 
  CheckCircle,
  HelpCircle,
  Loader2,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { api } from '@/lib/api';

interface Resume {
  id: number;
  filename: string;
  parsed_json: Record<string, any>;
}

interface CareerNode {
  id: string;
  title: string;
  level: string;
  salary: string;
  skills: string[];
  responsibilities: string[];
}

const CAREER_TRACKS: Record<string, CareerNode[]> = {
  engineering: [
    {
      id: 'swe',
      title: 'Software Engineer',
      level: 'L3 / Junior-Mid',
      salary: '$95k - $130k',
      skills: ['React', 'JavaScript', 'Python', 'SQL', 'Git', 'Data Structures'],
      responsibilities: ['Write clean code', 'Implement UI components', 'Write unit tests', 'Fix software bugs']
    },
    {
      id: 'sr_swe',
      title: 'Senior Software Engineer',
      level: 'L4 / Senior',
      salary: '$140k - $180k',
      skills: ['System Design', 'FastAPI', 'Node.js', 'Docker', 'AWS', 'Database Optimization'],
      responsibilities: ['Lead project architectures', 'Perform code reviews', 'Mentor junior engineers', 'Optimize system performance']
    },
    {
      id: 'staff_swe',
      title: 'Staff Software Engineer',
      level: 'L5 / Lead-Staff',
      salary: '$200k - $250k',
      skills: ['Distributed Systems', 'Kubernetes', 'Scalability', 'Event Driven Architecture', 'Product Strategy'],
      responsibilities: ['Define technical roadmaps', 'Align cross-functional tech goals', 'Resolve complex performance bottlenecks', 'Guide engineering culture']
    },
    {
      id: 'principal_swe',
      title: 'Principal Architect',
      level: 'L6 / Principal',
      salary: '$270k - $340k',
      skills: ['Multi-Region HA', 'Enterprise Security', 'Tech due-diligence', 'AI Integrations', 'R&D prototyping'],
      responsibilities: ['Direct company-wide technology selections', 'Audit mission-critical systems', 'Drive long-term engineering strategies', 'Consult executive stakeholders']
    }
  ],
  management: [
    {
      id: 'tech_lead',
      title: 'Technical Lead',
      level: 'Lead / L4-L5',
      salary: '$150k - $190k',
      skills: ['System Architecture', 'Sprint Planning', 'Project Management', 'Agile', 'Code Quality Standards'],
      responsibilities: ['Manage sprint backlogs', 'Design core project modules', 'Coordinate release cycles', 'Facilitate team engineering reviews']
    },
    {
      id: 'em',
      title: 'Engineering Manager',
      level: 'Manager / L5-L6',
      salary: '$180k - $220k',
      skills: ['People Management', 'Budgeting', 'Hiring', '1-on-1 Coaching', 'Strategic Execution'],
      responsibilities: ['Conduct performance reviews', 'Manage team headcounts', 'Unblock delivery obstacles', 'Foster engineer career growth']
    },
    {
      id: 'director_eng',
      title: 'Director of Engineering',
      level: 'Director / L7',
      salary: '$240k - $300k',
      skills: ['Multi-team Management', 'Department Scaling', 'Org Planning', 'Vendor Negotiations', 'Executive Vetting'],
      responsibilities: ['Oversee multiple software groups', 'Define department milestones', 'Manage annual resource budgets', 'Establish engineering metrics']
    }
  ],
  product: [
    {
      id: 'apm',
      title: 'Associate PM',
      level: 'L3 / Junior',
      salary: '$90k - $115k',
      skills: ['Market Research', 'Jira', 'Data Analytics', 'Wireframing', 'User Interviews'],
      responsibilities: ['Coordinate product feature scopes', 'Analyze user behavioral funnels', 'Write detailed PRDs', 'Gather customer feedback']
    },
    {
      id: 'pm',
      title: 'Product Manager',
      level: 'L4 / Mid-Senior',
      salary: '$130k - $165k',
      skills: ['Product Lifecycle', 'SQL', 'AB Testing', 'Roadmapping', 'Growth Strategy'],
      responsibilities: ['Own product vertical delivery', 'Collaborate with engineering designs', 'Prioritize backlog roadmaps', 'Coordinate launch phases']
    },
    {
      id: 'director_pm',
      title: 'Director of Product',
      level: 'Director / L7',
      salary: '$220k - $280k',
      skills: ['Product Portfolio Strategy', 'Monetization Models', 'P&L Management', 'Competitor Vetting'],
      responsibilities: ['Direct company product lines', 'Oversee product management divisions', 'Analyze product market fit metrics', 'Align features to revenue channels']
    }
  ]
};

export default function PathfinderPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [activeResume, setActiveResume] = useState<Resume | null>(null);

  // Career track layout state
  const [selectedTrack, setSelectedTrack] = useState<string>('engineering');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('swe');
  const [selectedNode, setSelectedNode] = useState<CareerNode>(CAREER_TRACKS.engineering[0]);

  // Perplexity-style search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchSteps, setSearchSteps] = useState<string[]>([]);
  const [searchResult, setSearchResult] = useState<any | null>(null);

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (selectedResumeId) {
      const found = resumes.find(r => r.id.toString() === selectedResumeId);
      if (found) {
        setActiveResume(found);
      }
    } else {
      setActiveResume(null);
    }
  }, [selectedResumeId, resumes]);

  useEffect(() => {
    // Sync node selection when track changes
    const defaultNode = CAREER_TRACKS[selectedTrack][0];
    setSelectedNodeId(defaultNode.id);
    setSelectedNode(defaultNode);
  }, [selectedTrack]);

  const fetchResumes = async () => {
    try {
      const response = await api.get('/resumes');
      setResumes(response.data);
      if (response.data.length > 0) {
        setSelectedResumeId(response.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNodeClick = (node: CareerNode) => {
    setSelectedNodeId(node.id);
    setSelectedNode(node);
  };

  const handleCareerSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchSteps([]);
    setSearchResult(null);

    // Simulate Agent Vetting Research Steps
    const steps = [
      '🔍 Scanning active candidate profile and skills index...',
      '🔍 Cross-referencing industry tech trends and salary matrices...',
      '🔍 Comparing skill inventory gaps against standard levels...',
      '🔍 Synthesizing transition objectives and learning milestone roadmap...'
    ];

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSearchSteps(prev => [...prev, steps[i]]);
    }

    // Process skill gaps based on selected resume
    const userSkills = activeResume?.parsed_json?.skills || [];
    const userSkillsLower = userSkills.map((s: string) => s.toLowerCase());
    
    // Determine target based on query or default
    const targetRole = selectedNode.title;
    const requiredSkills = selectedNode.skills;

    // Find missing skills
    const gaps = requiredSkills.filter(s => !userSkillsLower.includes(s.toLowerCase()));

    setSearchResult({
      target_role: targetRole,
      salary: selectedNode.salary,
      skills_gaps: gaps.length > 0 ? gaps : ['No significant gaps found in base skill sets!'],
      roadmap: [
        {
          phase: 'Days 1 - 30: Foundation Alignment',
          detail: `Focus on mastering ${gaps[0] || 'core architectural designs'}. Study system specifications, trade-offs, and complete one hands-on project using this tool.`
        },
        {
          phase: 'Days 31 - 60: Action & Integration',
          detail: `Incorporate ${gaps[1] || 'distributed frameworks'} into your current tasks. Refactor 2 modules focusing on efficiency, load throughput, and clean modular layout.`
        },
        {
          phase: 'Days 61 - 90: Leadership & Vetting',
          detail: `Initiate project reviews. Document transitions and mentor team members on new architectures. Lead deployment checks.`
        }
      ],
      citations: [
        { title: 'Levels.fyi Vocation Compilations 2026', url: 'https://levels.fyi' },
        { title: 'Tech Career Framework Standards V2', url: 'https://roadmap.sh' }
      ]
    });

    setIsSearching(false);
  };

  // Quick pre-defined search templates
  const triggerQuickSearch = (roleName: string) => {
    setSearchQuery(`Generate a personalized progression roadmap to reach ${roleName}`);
  };

  return (
    <div className="space-y-8">
      {/* Top Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="text-purple-500 w-8 h-8" />
            Pathfinder Career Explorer
          </h1>
          <p className="text-sm text-gray-400">
            Interactive progression flows coupled with a Perplexity-style AI transition planner.
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
                {r.filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Career Flowchart Nodes (5/12 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 border-white/5 space-y-6 bg-gradient-to-b from-[#0b0a17]/80 to-[#080711]/60">
            
            {/* Track Switch Tabs */}
            <div className="flex bg-white/3 p-1 rounded-xl border border-white/5">
              {['engineering', 'management', 'product'].map((track) => (
                <button
                  key={track}
                  onClick={() => setSelectedTrack(track)}
                  className={`flex-grow py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedTrack === track
                      ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>

            {/* Vertical SVGs Nodes Linkage list */}
            <div className="relative pl-6 space-y-6">
              {/* Linked vertical line */}
              <div className="absolute left-[31px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-purple-500 to-cyan-400/25" />

              {CAREER_TRACKS[selectedTrack].map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <motion.div
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-purple-950/10 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                        : 'bg-black/30 border-white/5 hover:border-white/10 hover:bg-[#121124]/20'
                    }`}
                  >
                    {/* Ring indicator */}
                    <span className={`absolute -left-[30px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 bg-black transition-all ${
                      isSelected
                        ? 'border-cyan-400 shadow-[0_0_10px_#06b6d4]'
                        : 'border-purple-500'
                    }`} />

                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className={`text-sm font-bold transition-colors ${isSelected ? 'text-cyan-400' : 'text-white'}`}>
                          {node.title}
                        </h4>
                        <span className="text-[10px] text-gray-500 font-mono">{node.level}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-cyan-400 translate-x-1' : 'text-gray-600'}`} />
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Node specifics Panel */}
            <div className="border-t border-white/5 pt-4 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-mono text-gray-500 uppercase">TELEMETRY BRACKET</span>
                <span className="font-bold text-white">{selectedNode.salary}</span>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-gray-500 uppercase block">Required Competencies</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedNode.skills.map((skill, idx) => (
                    <span key={idx} className="bg-white/3 px-2 py-0.5 rounded text-[10px] text-gray-300 border border-white/5">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-gray-500 uppercase block">Typical Responsibilities</span>
                <ul className="space-y-1 text-xs text-gray-400">
                  {selectedNode.responsibilities.map((resp, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <span className="text-purple-500 mt-0.5">•</span>
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Perplexity AI RAG Planner (7/12 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI Search input */}
          <div className="glass-card p-6 border-white/5 bg-black/40 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Compass className="text-purple-400 w-4 h-4" />
              Perplexity-style RAG Transition Planner
            </h3>

            <form onSubmit={handleCareerSearch} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Ask a transition plan to reach ${selectedNode.title}...`}
                  className="w-full glass-input pr-12 text-xs py-3 pl-4"
                />
                <button
                  type="submit"
                  disabled={isSearching || !searchQuery.trim()}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all cursor-pointer disabled:opacity-30"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => triggerQuickSearch(selectedNode.title)}
                  className="px-2.5 py-1 bg-white/3 hover:bg-white/5 border border-white/5 text-[10px] text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
                >
                  Generate {selectedNode.title} roadmap
                </button>
                <button
                  type="button"
                  onClick={() => setSearchQuery(`What are the core technical skill gaps in my resume for a ${selectedNode.title}?`)}
                  className="px-2.5 py-1 bg-white/3 hover:bg-white/5 border border-white/5 text-[10px] text-gray-400 hover:text-white rounded transition-colors cursor-pointer"
                >
                  Analyze skill gaps
                </button>
              </div>
            </form>
          </div>

          {/* Research & Output panels */}
          <AnimatePresence>
            {isSearching && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border-white/5 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                  AGENCY TELEMETRY SEARCH IN PROGRESS...
                </div>
                <div className="space-y-2 border-l border-white/5 pl-4">
                  {searchSteps.map((step, index) => (
                    <motion.div 
                      key={index}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[11px] text-gray-500 font-mono"
                    >
                      {step}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {!isSearching && searchResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 border-white/5 space-y-6"
              >
                {/* Result header */}
                <div className="border-b border-white/5 pb-4">
                  <h3 className="text-base font-bold text-white">{searchResult.target_role} Transition Report</h3>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase">Benchmarked salary range: {searchResult.salary}</span>
                </div>

                {/* Skill gaps */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Skill Gaps Vetted</span>
                  <div className="flex flex-wrap gap-1.5">
                    {searchResult.skills_gaps.map((gap: string, idx: number) => (
                      <span key={idx} className="bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 30 60 90 Roadmap */}
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block">Transition Roadmap</span>
                  
                  <div className="space-y-4">
                    {searchResult.roadmap.map((item: any, idx: number) => (
                      <div key={idx} className="space-y-1 relative pl-6 border-l border-purple-500/20">
                        <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-purple-500/60" />
                        <h4 className="text-xs font-bold text-white">{item.phase}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed font-sans">{item.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Citations & sources */}
                <div className="border-t border-white/5 pt-4">
                  <span className="text-[10px] font-mono text-gray-500 uppercase block mb-2">Sources Vetted</span>
                  <div className="flex flex-wrap gap-3">
                    {searchResult.citations.map((cite: any, idx: number) => (
                      <a
                        key={idx}
                        href={cite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors font-medium cursor-pointer"
                      >
                        [{idx + 1}] {cite.title}
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </div>
  );
}
