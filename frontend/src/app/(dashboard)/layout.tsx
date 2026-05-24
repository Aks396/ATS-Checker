'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, UploadCloud, Compass, LogOut, Menu, X, User, MessageSquare, FileEdit, Layers, Award, ShieldCheck, GitBranch, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/profile', icon: UserCircle },
    { name: 'Upload Resume', href: '/upload', icon: UploadCloud },
    { name: 'Resume Editor', href: '/editor', icon: FileEdit },
    { name: 'Job Tracker', href: '/tracker', icon: Layers },
    { name: 'Job Matching', href: '/match', icon: Compass },
    { name: 'Mock Interview', href: '/interview', icon: Award },
    { name: 'AI Recruiter Audit', href: '/recruiter', icon: ShieldCheck },
    { name: 'Career Pathfinder', href: '/pathfinder', icon: GitBranch },
    { name: 'AI Resume Copilot', href: '/chat', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-[#030303] text-gray-100 flex relative overflow-hidden">
      {/* Background Cyber Orbs */}
      <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-card rounded-none border-y-0 border-l-0 border-r border-white/5 bg-[#080711]/60 shrink-0 z-30">
        {/* Brand Logo */}
        <div className="p-6 border-b border-white/5 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.45)]">
            A
          </div>
          <span className="text-lg font-bold tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            APEX<span className="text-cyan-400 font-light">ATS</span>
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-4 space-y-2 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/20 to-cyan-500/10 border border-purple-500/30 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.1)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Profile Card & Logout */}
        <div className="p-4 border-t border-white/5 bg-[#0b0a17]/40">
          <Link href="/profile" className="flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-white/5 transition-colors group cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white border border-white/10 font-bold uppercase shadow-inner group-hover:shadow-[0_0_12px_rgba(168,85,247,0.4)] transition-shadow">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate group-hover:text-purple-200 transition-colors">{user?.name || 'Developer Candidate'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'dev@example.com'}</p>
            </div>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar - Mobile Toggle overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Mobile Panel */}
      <aside className={`fixed inset-y-0 left-0 w-64 glass-card rounded-none border-y-0 border-l-0 border-r border-white/5 bg-[#080711] z-50 transform transition-transform duration-300 md:hidden flex flex-col justify-between ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div>
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white">
                A
              </div>
              <span className="text-lg font-bold tracking-wider text-white">
                APEX<span className="text-cyan-400 font-light">ATS</span>
              </span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-purple-600/20 border border-purple-500/40 text-purple-200'
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/5 bg-black/40">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white border border-white/10 font-bold uppercase">
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-grow flex flex-col min-w-0 z-10 relative">
        {/* Header - Mobile Nav controller */}
        <header className="h-16 border-b border-white/5 backdrop-blur-md bg-black/10 flex items-center justify-between px-6 md:justify-end">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-gray-400 hover:text-white md:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-mono text-cyan-400 tracking-wider">SECURE CLIENT INTERFACE</p>
              <p className="text-xs text-gray-400">{user?.name || 'Developer Candidate'}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
              <User className="w-4 h-4" />
            </div>
          </div>
        </header>

        {/* Content Portal */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
