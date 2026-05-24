'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await api.post('/auth/signup', data);
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(
        error.response?.data?.detail || 
        'An error occurred during registration. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Cyber Orbs */}
      <div className="absolute top-[20%] left-[10%] w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[350px] h-[350px] bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              A
            </div>
            <span className="text-2xl font-bold tracking-wider bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              APEX<span className="text-cyan-400 font-light">ATS</span>
            </span>
          </Link>
          <p className="text-sm text-gray-400">Create a secure profile to start scanning resumes.</p>
        </div>

        {/* Card */}
        <div className="glass-card p-8 border-white/5">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mx-auto text-xl font-bold animate-bounce">
                ✓
              </div>
              <h3 className="text-lg font-bold text-white">Registration Complete!</h3>
              <p className="text-sm text-gray-400">Account created successfully. Redirecting you to login...</p>
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin mx-auto mt-4" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              
              {errorMessage && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 text-center">
                  {errorMessage}
                </div>
              )}

              {/* Name Field */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Your Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/30 border border-white/8 rounded-lg text-white text-sm outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all"
                    {...register('name', { 
                      required: 'Full name is required',
                      minLength: { value: 2, message: 'Name must be at least 2 characters' }
                    })}
                  />
                </div>
                {errors.name && (
                  <span className="text-xs text-red-400 block">{errors.name.message}</span>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-white/30 border border-white/8 rounded-lg text-white text-sm outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <span className="text-xs text-red-400 block">{errors.email.message}</span>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-white/30 border border-white/8 rounded-lg text-white text-sm outline-none focus:border-purple-500/50 focus:bg-white/5 transition-all"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Password must be at least 6 characters' }
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-xs text-red-400 block">{errors.password.message}</span>
                )}
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_30px_rgba(168,85,247,0.45)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Prompt */}
          <div className="text-center mt-6 text-xs text-gray-400">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
