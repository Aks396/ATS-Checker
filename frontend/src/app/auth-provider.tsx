'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isLoading) return;

    const isAuthRoute = pathname === '/login' || pathname === '/signup';
    const isRootRoute = pathname === '/';
    
    if (!isAuthenticated && !isAuthRoute && !isRootRoute) {
      router.push('/login');
    } else if (isAuthenticated && isAuthRoute) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Futuristic glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-cyan-600/10 rounded-full blur-[100px]" />
        
        <div className="relative flex flex-col items-center">
          <div className="w-16 h-16 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(168,85,247,0.3)]" />
          <div className="text-xl font-medium tracking-widest bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent animate-pulse">
            ANTIGRAVITY ATS
          </div>
          <div className="text-xs text-gray-500 mt-2 font-mono uppercase tracking-wider">
            Loading AI environment...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
