'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LogOut, Menu, X, User } from 'lucide-react';

interface UserSession {
  name: string;
  email: string;
  role: string;
}

export default function Navbar({ invisibleAtTop = false }: { invisibleAtTop?: boolean }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Failed to fetch session', err);
      }
    }
    checkSession();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setUser(null);
        router.refresh();
        router.push('/');
      }
    } catch (err) {
      console.error('Logout error', err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 text-white font-sans ${
        scrolled
          ? 'translate-y-0 opacity-100 bg-[#26201e]/95 backdrop-blur-md border-b border-white/5 shadow-lg py-1'
          : invisibleAtTop
          ? '-translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100 bg-transparent border-none py-3'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center bg-white p-1 shadow-md rounded-sm">
                <Image
                  src="/assets/logo.png"
                  alt="NayePankh Logo"
                  width={50}
                  height={50}
                  className="object-contain"
                />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation & Controls */}
          <div className="hidden md:flex items-center gap-6 font-medium text-sm">
            <Link href="/" className="text-zinc-100 hover:text-[#ffccac] transition-colors">
              Home
            </Link>

            {/* Volunteer-only link */}
            {user && user.role !== 'Coordinator' && (
              <Link href="/chat" className="text-zinc-100 hover:text-[#ffccac] transition-colors">
                Chat
              </Link>
            )}

            {/* Coordinator-only link */}
            {user && user.role === 'Coordinator' && (
              <Link href="/dashboard" className="text-zinc-100 hover:text-[#ffccac] transition-colors">
                Dashboard
              </Link>
            )}
            
            {user ? (
              <div className="flex items-center gap-4 ml-2 pl-4 border-l border-white/10">
                {/* Coordinator: plain name label — no profile link */}
                {user.role === 'Coordinator' ? (
                  <span className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffccac] text-[#26201e] text-xs font-bold shadow-md">
                      {getInitials(user.name)}
                    </div>
                    <span className="text-xs font-semibold text-zinc-300 max-w-[120px] truncate">
                      {user.name}
                    </span>
                  </span>
                ) : (
                  /* Volunteer: clickable profile avatar */
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 group hover:text-[#ffccac] transition-all duration-200"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#ffccac] text-[#26201e] text-xs font-bold shadow-md group-hover:scale-105 transition-transform">
                      {getInitials(user.name)}
                    </div>
                    <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors max-w-[120px] truncate">
                      {user.name}
                    </span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 hover:border-white/20 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-xs font-semibold text-[#26201e] bg-[#ffccac] hover:bg-[#ffccac]/90 rounded-lg transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#26201e] px-4 py-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block rounded-lg px-3 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white"
          >
            Home
          </Link>

          {/* Volunteer-only mobile link */}
          {user && user.role !== 'Coordinator' && (
            <Link
              href="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              Chat
            </Link>
          )}

          {/* Coordinator-only mobile link */}
          {user && user.role === 'Coordinator' && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg px-3 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white"
            >
              Dashboard
            </Link>
          )}

          <div className="border-t border-white/10 pt-4">
            {user ? (
              <div className="space-y-3 px-3">
                {/* Coordinator: name label only, no profile link */}
                {user.role === 'Coordinator' ? (
                  <span className="flex items-center gap-2 text-zinc-300 text-sm">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffccac] text-[#26201e] text-[10px] font-bold">
                      {getInitials(user.name)}
                    </div>
                    {user.name}
                  </span>
                ) : (
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-zinc-300 text-sm hover:text-white transition-colors"
                  >
                    <User className="h-4 w-4 text-[#ffccac]" />
                    <span>{user.name} ({user.role})</span>
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 px-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-lg border border-white/10 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center rounded-lg bg-[#ffccac] hover:bg-[#ffccac]/90 py-2 text-sm font-semibold text-[#26201e] transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
