'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Wallet, Loader2, Mail, Lock, User, ArrowRight, Sparkles, BarChart3, Target } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex min-h-screen bg-[#0a0b0e]">
      {/* Left Panel — Branding & Features */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-950/80 via-[#0a0b0e] to-emerald-950/60" />
        
        {/* Floating orbs */}
        <div className="absolute top-[20%] right-[10%] w-72 h-72 bg-teal-500/10 rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-[15%] left-[15%] w-80 h-80 bg-emerald-500/8 rounded-full blur-[120px] animate-[pulse_8s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[50%] right-[35%] w-48 h-48 bg-cyan-400/5 rounded-full blur-[80px] animate-[pulse_7s_ease-in-out_infinite_2s]" />

        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
                <Wallet className="h-5.5 w-5.5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Fintrack</span>
            </div>
            <p className="text-sm text-slate-500 ml-0.5">Start your financial journey</p>
          </div>

          {/* Main hero text */}
          <div className="space-y-8 max-w-lg">
            <div>
              <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] tracking-tight">
                Start building
                <br />
                <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  your wealth
                </span>
              </h1>
              <p className="mt-5 text-base text-slate-400 leading-relaxed max-w-md">
                Join thousands of families who trust Fintrack to manage their finances and achieve their goals.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              {[
                { icon: Sparkles, title: 'Free Forever', desc: 'No hidden fees, no credit card required' },
                { icon: BarChart3, title: 'Instant Setup', desc: 'Get started in under 30 seconds' },
                { icon: Target, title: 'Goal Tracking', desc: 'Set, track, and achieve financial milestones' },
              ].map((feature) => (
                <div key={feature.title} className="flex items-start gap-4 group">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.06] text-teal-400 group-hover:bg-teal-500/10 group-hover:border-teal-500/20 transition-all duration-300">
                    <feature.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200">{feature.title}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['bg-teal-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-sky-500'].map((color, i) => (
                <div key={i} className={`h-8 w-8 rounded-full ${color} border-2 border-[#0a0b0e] flex items-center justify-center text-[10px] font-bold text-white/80`}>
                  {['V', 'A', 'R', 'F'][i]}
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs text-slate-300 font-medium">Join 1,000+ happy users</p>
              <p className="text-[10px] text-slate-500">Creating better financial habits</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative">
        {/* Subtle radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/[0.03] rounded-full blur-[100px]" />

        <div className="relative w-full max-w-[420px] animate-fade-in">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-2.5 mb-10 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
              <Wallet className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Fintrack</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Create your account</h2>
            <p className="text-sm text-slate-500 mt-2">Get started with your free financial tracker</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-center gap-3 p-3.5 rounded-xl bg-red-500/8 border border-red-500/15 animate-scale-in">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                <span className="text-red-400 text-sm">!</span>
              </div>
              <p className="text-xs text-red-400 font-medium leading-snug">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="register-name" className="block text-xs font-medium text-slate-400">
                Full Name
              </label>
              <div className={`relative rounded-xl border transition-all duration-300 ${
                focusedField === 'name' 
                  ? 'border-emerald-500/50 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]' 
                  : 'border-white/[0.06] hover:border-white/[0.12]'
              }`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User className={`h-4 w-4 transition-colors duration-300 ${
                    focusedField === 'name' ? 'text-emerald-400' : 'text-slate-600'
                  }`} />
                </div>
                <input
                  id="register-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="John Doe"
                  className="w-full bg-white/[0.02] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="register-email" className="block text-xs font-medium text-slate-400">
                Email Address
              </label>
              <div className={`relative rounded-xl border transition-all duration-300 ${
                focusedField === 'email' 
                  ? 'border-emerald-500/50 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]' 
                  : 'border-white/[0.06] hover:border-white/[0.12]'
              }`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Mail className={`h-4 w-4 transition-colors duration-300 ${
                    focusedField === 'email' ? 'text-emerald-400' : 'text-slate-600'
                  }`} />
                </div>
                <input
                  id="register-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.02] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="register-password" className="block text-xs font-medium text-slate-400">
                Password
              </label>
              <div className={`relative rounded-xl border transition-all duration-300 ${
                focusedField === 'password' 
                  ? 'border-emerald-500/50 shadow-[0_0_0_3px_rgba(16,185,129,0.08)]' 
                  : 'border-white/[0.06] hover:border-white/[0.12]'
              }`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className={`h-4 w-4 transition-colors duration-300 ${
                    focusedField === 'password' ? 'text-emerald-400' : 'text-slate-600'
                  }`} />
                </div>
                <input
                  id="register-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Min. 6 characters"
                  className="w-full bg-white/[0.02] rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder-slate-600 outline-none"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-semibold text-sm shadow-lg shadow-teal-500/15 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-teal-500/25 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.05]" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 text-[10px] text-slate-600 uppercase tracking-widest bg-[#0a0b0e]">
                Already a member?
              </span>
            </div>
          </div>

          {/* Login Link */}
          <Link
            href="/login"
            className="group w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.06] hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 text-sm font-medium transition-all duration-300 hover:bg-emerald-500/[0.03]"
          >
            Sign in to your account
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          {/* Footer */}
          <p className="text-center text-[10px] text-slate-700 mt-8">
            By creating an account, you agree to Fintrack&apos;s Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
