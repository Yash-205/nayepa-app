'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // Redirect based on role and onboarding status
      router.refresh();
      if (data.user?.role === 'Coordinator') {
        router.push('/dashboard');
      } else if (data.onboardingComplete) {
        router.push('/');
      } else {
        router.push('/chat');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#26201e] text-white font-sans selection:bg-[#ffccac]/30 selection:text-[#ffccac] overflow-x-hidden">
      <Navbar />

      <main className="w-full min-h-screen grid grid-cols-1 md:grid-cols-2 relative overflow-hidden bg-[#26201e]">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[500px] w-[500px] rounded-full bg-[#ffccac]/5 blur-[120px]" />
          
        {/* Left Column - Form */}
        <div className="p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-[#26201e]/95 z-20 overflow-y-auto min-h-screen">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Header (Branding & Form titles matching original layout/header) */}
            <div className="text-center space-y-3">
              <Link href="/" className="inline-flex h-12 w-12 items-center justify-center bg-white shadow-lg p-1.5 rounded-none">
                <Image
                  src="/assets/logo.png"
                  alt="NayePankh Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </Link>
              <h2 className="text-3xl font-bold tracking-tight text-white uppercase tracking-wider">
                Login
              </h2>
              <p className="text-sm text-zinc-400">
                Access your volunteer or coordinator console
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-white/10 bg-[#26201e]/40 py-2.5 px-4 text-white placeholder-zinc-600 focus:border-[#ffccac] focus:outline-none focus:ring-1 focus:ring-[#ffccac] text-xs transition-all duration-200"
                  placeholder="Email Address"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-white/10 bg-[#26201e]/40 py-2.5 px-4 text-white placeholder-zinc-600 focus:border-[#ffccac] focus:outline-none focus:ring-1 focus:ring-[#ffccac] text-xs transition-all duration-200"
                  placeholder="Password"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#ffccac] hover:bg-[#ffccac]/90 active:scale-[0.99] text-[#26201e] py-3 text-xs font-bold tracking-widest uppercase transition-all duration-200 shadow-md disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Login
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Toggle Link */}
            <div className="text-center pt-2">
              <p className="text-sm text-zinc-400">
                Don't have an account?{' '}
                <Link href="/register" className="font-semibold text-[#ffccac] hover:text-[#ffccac]/80 transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Image */}
        <div className="relative w-full min-h-screen hidden md:block bg-[#26201e] z-10">
          <Image
            src="/assets/asset 8.jpeg"
            alt="NayePankh Volunteers"
            fill
            priority
            className="object-cover brightness-[0.35] object-top scale-105"
          />
          {/* Chocolate tint and dark gradients */}
          <div className="absolute inset-0 bg-[#26201e]/30 z-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#26201e]/95 via-[#26201e]/20 to-[#26201e]/40 z-25" />

          {/* Text Overlay (ONLY white text and image in this section) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 z-30 text-center space-y-3">
            <h2 className="text-3xl font-extrabold text-white leading-tight max-w-md">
              Your effort matters.
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed font-light max-w-sm mx-auto">
              Manage deployments, analyze matching algorithms, and coordinate donation drives.
            </p>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
