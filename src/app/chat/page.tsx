'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Send,
  Plus,
  MessageSquare,
  Loader2,
  AlertCircle,
  LogOut,
  ChevronRight,
  User,
  Sparkles,
  CheckCircle2,
  Menu,
  X,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatSession {
  sessionId: string;
  title: string;
  createdAt?: string;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  ts?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const router = useRouter();

  // Auth state
  const [authUser, setAuthUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Messages for active session
  const [messages, setMessages] = useState<Message[]>([]);

  // Onboarding status
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [justOnboarded, setJustOnboarded] = useState(false);

  // Input
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Sidebar mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Prevents double auto-init on StrictMode double-invoke
  const autoInitDone = useRef(false);

  // ── Check auth on mount ──────────────────────────────────────────────────
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setAuthUser(data.user);
        
        // Load sessions immediately so the sidebar isn't empty on refresh
        if (data.sessions && Array.isArray(data.sessions)) {
          setSessions(data.sessions);
        }

        // Pre-set onboarding status so returning users get the right mode
        if (data.onboardingComplete) {
          setOnboardingComplete(true);
        } else {
          // Not yet onboarded — auto-send a silent greeting trigger
          autoInitGreeting();
        }
      } catch {
        router.push('/login');
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  // ── Auto-init: AI speaks first during onboarding ─────────────────────────
  async function autoInitGreeting() {
    if (autoInitDone.current) return;
    autoInitDone.current = true;
    setSending(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Trigger message — invisible to the user, just gets the first AI question
        body: JSON.stringify({ message: 'Hello' }),
      });
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize chat.');
      }

      if (data.sessionId) setActiveSessionId(data.sessionId);
      if (data.sessions && Array.isArray(data.sessions)) setSessions(data.sessions);
      if (data.onboardingComplete) setOnboardingComplete(true);

      // Show ONLY the AI message — no user bubble for this silent trigger
      setMessages([{ role: 'assistant', text: data.response, ts: Date.now() }]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong while starting the chat.');
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  // ── Auto-scroll on new messages ──────────────────────────────────────────
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, sending]);

  // ── Auto-resize textarea ─────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  // ── Start a new session (no sessionId → API creates one) ─────────────────
  const startNewSession = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setOnboardingComplete(false);
    setJustOnboarded(false);
    setError('');
    setSidebarOpen(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Switch to an existing session ────────────────────────────────────────
  const switchSession = useCallback(async (session: ChatSession) => {
    setActiveSessionId(session.sessionId);
    setMessages([]);
    setOnboardingComplete(false);
    setJustOnboarded(false);
    setError('');
    setSidebarOpen(false);
    
    try {
      const res = await fetch(`/api/chat?sessionId=${session.sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error('Failed to fetch session history', err);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // ── Send a message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: Message = { role: 'user', text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);
    setError('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    try {
      const body: Record<string, string> = { message: text };
      if (activeSessionId) body.sessionId = activeSessionId;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get a response.');

      // If this was a new session, set the sessionId now
      if (!activeSessionId && data.sessionId) {
        setActiveSessionId(data.sessionId);
      }

      // Update sessions sidebar
      if (data.sessions && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }

      if (data.onboardingComplete) {
        setOnboardingComplete((prev) => {
          if (!prev) setJustOnboarded(true);
          return true;
        });
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.response, ts: Date.now() },
      ]);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, sending, activeSessionId, router]);

  // ── Handle Enter key (Shift+Enter = newline) ─────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Logout ────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  // ─── Loading / Auth gate ────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#26201e]">
        <Loader2 className="h-8 w-8 animate-spin text-[#ffccac]" />
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-[#26201e] text-white font-sans selection:bg-[#ffccac]/30 selection:text-[#ffccac] overflow-x-hidden">
      <Navbar />

      {/* Main chat section matches full viewport height */}
      <main className="flex-grow flex flex-col h-screen min-h-screen w-full">
        {/* Chat box container spans full width, edge-to-edge with no rounded corners */}
        <div className="flex flex-1 bg-[#1a1512] overflow-hidden relative w-full">
          
          {/* ── Mobile sidebar overlay ── */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Mobile Sessions Toggle Button (Subtle floating hamburger) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden fixed top-24 left-4 z-30 p-2 rounded-lg bg-[#26201e]/80 border border-white/10 text-zinc-300 hover:text-white transition-all shadow-md"
            id="sidebar-toggle-btn"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* ═══════════════════════════════════════════════════════════════════
              LEFT SIDEBAR (Sessions Panel)
          ═══════════════════════════════════════════════════════════════════ */}
          <aside
            className={`
              fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[#1e1814] border-r border-white/5
              transition-transform duration-300 ease-in-out
              md:relative md:translate-x-0 md:z-auto md:h-auto pt-24
              ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
          >
            {/* New Chat button */}
            <div className="px-3 pb-4">
              <button
                id="new-chat-btn"
                onClick={startNewSession}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#ffccac]/20 bg-[#ffccac]/5 px-4 py-2.5 text-xs font-bold tracking-widest uppercase text-[#ffccac] hover:bg-[#ffccac]/10 hover:border-[#ffccac]/40 transition-all duration-200"
              >
                <Plus className="h-3.5 w-3.5" />
                New Chat
              </button>
            </div>

            {/* Sessions list */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#3a2e28 transparent' }}
            >
              {sessions.length === 0 ? (
                <p className="px-3 py-4 text-center text-[10px] text-zinc-600 uppercase tracking-widest">
                  No sessions yet
                </p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.sessionId}
                    onClick={() => switchSession(s)}
                    className={`
                      group flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs transition-all duration-150
                      ${activeSessionId === s.sessionId
                        ? 'bg-[#ffccac]/10 text-[#ffccac] border border-[#ffccac]/20'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 border border-transparent'
                      }
                    `}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate font-medium">{s.title}</span>
                    {activeSessionId === s.sessionId && (
                      <ChevronRight className="ml-auto h-3 w-3 shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* User info + status + logout */}
            <div className="border-t border-white/5 px-4 py-4 space-y-2">
              {onboardingComplete && (
                <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 justify-center">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wider">Onboarded</span>
                </div>
              )}
              {authUser && (
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#ffccac]/15 border border-[#ffccac]/20">
                    <User className="h-3.5 w-3.5 text-[#ffccac]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-semibold text-zinc-200">{authUser.name}</p>
                    <p className="truncate text-[10px] text-zinc-500">{authUser.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/5 transition-all"
                    title="Logout"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* ═══════════════════════════════════════════════════════════════════
              MAIN CHAT PANEL
          ═══════════════════════════════════════════════════════════════════ */}
          <main className="flex flex-1 flex-col min-w-0 overflow-hidden relative">

            {/* Messages area - padded at top to flow naturally below floating transparent Navbar */}
            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-4 pb-6 pt-24 space-y-5"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#3a2e28 transparent' }}
            >
              {/* Empty state */}
              {messages.length === 0 && !sending && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pb-16">
                  <div className="relative">
                    <div className="absolute -inset-4 rounded-full bg-[#ffccac]/5 blur-2xl" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ffccac]/10 border border-[#ffccac]/20">
                      <Sparkles className="h-7 w-7 text-[#ffccac]" />
                    </div>
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <h2 className="text-base font-bold text-white">
                      {activeSessionId ? 'Continue your conversation' : 'Start a new conversation'}
                    </h2>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      {onboardingComplete
                        ? 'Ask about active campaigns, certificates, or how to get involved.'
                        : 'Our AI coordinator will guide you through the volunteer onboarding process.'}
                    </p>
                  </div>
                  {/* Prompt suggestions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm mt-2">
                    {(onboardingComplete
                      ? ['Tell me about active campaigns', 'How do I get my certificate?', 'What drives are near me?', 'Tell me about animal welfare']
                      : ['I want to volunteer', 'I am based in Delhi', 'I can commit 8 hours/week', 'I have teaching skills']
                    ).map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                        className="rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 text-left text-[11px] text-zinc-400 hover:border-[#ffccac]/20 hover:bg-[#ffccac]/5 hover:text-zinc-200 transition-all duration-200"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message bubbles */}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className={`
                    flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5
                    ${msg.role === 'user'
                      ? 'bg-[#ffccac]/15 border border-[#ffccac]/20'
                      : 'bg-white/5 border border-white/10'
                    }
                  `}>
                    {msg.role === 'user'
                      ? <User className="h-3.5 w-3.5 text-[#ffccac]" />
                      : <BotIcon />
                    }
                  </div>

                  {/* Bubble */}
                  <div className={`
                    group max-w-[78%] md:max-w-[65%] rounded-2xl px-4 py-3 text-sm leading-relaxed
                    ${msg.role === 'user'
                      ? 'bg-[#ffccac]/10 border border-[#ffccac]/15 text-zinc-100 rounded-tr-sm'
                      : 'bg-white/5 border border-white/8 text-zinc-200 rounded-tl-sm'
                    }
                  `}>
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    {msg.ts && (
                      <p className={`mt-1.5 text-[10px] ${msg.role === 'user' ? 'text-[#ffccac]/40 text-right' : 'text-zinc-600'}`}>
                        {new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {sending && (
                <div className="flex gap-3 flex-row">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5 bg-white/5 border border-white/10">
                    <BotIcon />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-white/5 border border-white/8 px-4 py-3.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ffccac]/60 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ffccac]/60 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ffccac]/60 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              )}

              {/* Home CTA ── shown right after onboarding completes */}
              {justOnboarded && messages.length > 0 && (
                <div className="flex justify-center my-2">
                  <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4 text-center max-w-sm w-full">
                    <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-emerald-400/10 blur-2xl" />
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Onboarding Complete</span>
                    </div>
                    <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                      Your volunteer profile has been saved. Head to the home page to explore campaigns and get matched.
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#ffccac] hover:bg-[#ffccac]/90 text-[#26201e] px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all active:scale-95"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Go to Home
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-4 mb-2 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
                <button onClick={() => setError('')} className="ml-auto text-red-400/60 hover:text-red-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Input bar */}
            <div className="shrink-0 border-t border-white/5 bg-[#1e1814]/80 backdrop-blur-sm p-4">
              <div className="mx-auto max-w-3xl">
                <div className="flex items-end gap-3 rounded-xl border border-white/10 bg-[#26201e] px-4 py-3 focus-within:border-[#ffccac]/30 focus-within:ring-1 focus-within:ring-[#ffccac]/20 transition-all duration-200">
                  <textarea
                    ref={inputRef}
                    id="chat-input"
                    rows={1}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={onboardingComplete ? 'Ask anything…' : 'Tell us about yourself…'}
                    disabled={sending}
                    className="flex-1 resize-none bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none disabled:opacity-50 leading-relaxed"
                    style={{ minHeight: '24px', maxHeight: '120px' }}
                  />
                  <button
                    id="send-btn"
                    onClick={sendMessage}
                    disabled={!input.trim() || sending}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ffccac] text-[#26201e] hover:bg-[#ffccac]/90 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    {sending
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Send className="h-4 w-4" />
                    }
                  </button>
                </div>
                <p className="mt-2 text-center text-[10px] text-zinc-700">
                  Press <kbd className="rounded bg-white/5 px-1 py-0.5 font-mono text-zinc-500">Enter</kbd> to send · <kbd className="rounded bg-white/5 px-1 py-0.5 font-mono text-zinc-500">Shift+Enter</kbd> for new line
                </p>
              </div>
            </div>
          </main>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Subtle Bot Avatar Icon
function BotIcon() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-full bg-[#ffccac]/10 text-zinc-300">
      <span className="text-[10px] font-extrabold text-[#ffccac]">AI</span>
    </div>
  );
}
