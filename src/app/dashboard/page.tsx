'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Users, CheckCircle2, Clock, Sparkles, MapPin, Download,
  Printer, Search, ChevronDown, ChevronUp, X, Loader2,
  AlertCircle, Eye, TrendingUp,
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

// ── Types ────────────────────────────────────────────────────────────────────
interface VolunteerUser {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Volunteer {
  _id: string;
  userId: VolunteerUser;
  location: string;
  availability: number;
  skills: string[];
  targetDomain: string;
  screeningNotes: string;
  onboardingComplete: boolean;
  createdAt: string;
}

interface Stats {
  totalVolunteers: number;
  onboardedVolunteers: number;
  pendingOnboarding: number;
  uniqueSkills: number;
  totalAvailabilityHours: number;
  topLocations: { location: string; count: number }[];
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#ffccac]/10 bg-[#ffccac]/5 p-5">
      <div className="absolute -right-5 -top-5 h-24 w-24 rounded-full bg-[#ffccac]/8 blur-2xl" />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#ffccac]/50">{label}</p>
          <p className="mt-1.5 text-3xl font-extrabold text-white">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] text-[#ffccac]/40">{sub}</p>}
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ffccac]/10 border border-[#ffccac]/20">
          <Icon className="h-4 w-4 text-[#ffccac]" />
        </div>
      </div>
    </div>
  );
}

// ── Volunteer Detail Drawer ───────────────────────────────────────────────────
function DetailDrawer({ volunteer, onClose }: { volunteer: Volunteer | null; onClose: () => void }) {
  if (!volunteer) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md h-full bg-[#1e1814] border-l border-white/8 overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#3a2e28 transparent' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/8 bg-[#1e1814]/90 backdrop-blur-sm">
          <div>
            <p className="text-xs font-bold text-white">{volunteer.userId?.name ?? 'Unknown'}</p>
            <p className="text-[11px] text-zinc-500">{volunteer.userId?.email}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/8 text-zinc-400 hover:text-white transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1">
          {/* Status badge */}
          <div className="flex gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${volunteer.onboardingComplete ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
              {volunteer.onboardingComplete ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {volunteer.onboardingComplete ? 'Onboarded' : 'Pending'}
            </span>
            {volunteer.targetDomain && (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border bg-[#ffccac]/10 border-[#ffccac]/20 text-[#ffccac]">
                {volunteer.targetDomain}
              </span>
            )}
          </div>

          {/* Profile facts */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Location', val: volunteer.location || '—' },
              { label: 'Availability', val: volunteer.availability ? `${volunteer.availability} hrs/week` : '—' },
            ].map(({ label, val }) => (
              <div key={label} className="rounded-xl border border-white/8 bg-white/3 p-3">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</p>
                <p className="mt-1 text-sm font-semibold text-white">{val}</p>
              </div>
            ))}
          </div>

          {/* Skills */}
          {volunteer.skills?.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {volunteer.skills.map((s) => (
                  <span key={s} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-300">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Screening notes */}
          {volunteer.screeningNotes && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-2">AI Screening Notes</p>
              <div className="rounded-xl border border-[#ffccac]/10 bg-[#ffccac]/5 p-4">
                <p className="text-xs text-zinc-300 leading-relaxed">{volunteer.screeningNotes}</p>
              </div>
            </div>
          )}

          {/* Registered */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Registered</p>
            <p className="text-xs text-zinc-400">{volunteer.userId?.createdAt ? new Date(volunteer.userId.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterDomain, setFilterDomain] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState<'name' | 'location' | 'availability'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Volunteer | null>(null);
  const [exporting, setExporting] = useState(false);

  // ── Verify admin auth ───────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.role !== 'Coordinator') {
          router.replace('/login');
        }
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  // ── Fetch volunteers + stats ─────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [vRes, sRes] = await Promise.all([
        fetch('/api/admin/volunteers'),
        fetch('/api/admin/stats'),
      ]);
      if (!vRes.ok) throw new Error('Failed to load volunteers.');
      const { volunteers: vols } = await vRes.json();
      const statsData = sRes.ok ? await sRes.json() : null;
      setVolunteers(vols);
      setStats(statsData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── CSV Export ──────────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/admin/export/csv');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nayepankh_volunteers_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  // ── Derived filter & sort ───────────────────────────────────────────────────
  const domains = ['All', ...Array.from(new Set(volunteers.map((v) => v.targetDomain).filter(Boolean)))];

  const filtered = volunteers
    .filter((v) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        v.userId?.name?.toLowerCase().includes(q) ||
        v.userId?.email?.toLowerCase().includes(q) ||
        v.location?.toLowerCase().includes(q) ||
        v.skills?.some((s) => s.toLowerCase().includes(q));
      const matchDomain = filterDomain === 'All' || v.targetDomain === filterDomain;
      const matchStatus =
        filterStatus === 'All' ||
        (filterStatus === 'Onboarded' && v.onboardingComplete) ||
        (filterStatus === 'Pending' && !v.onboardingComplete);
      return matchSearch && matchDomain && matchStatus;
    })
    .sort((a, b) => {
      let av: string | number = '';
      let bv: string | number = '';
      if (sortField === 'name') { av = a.userId?.name ?? ''; bv = b.userId?.name ?? ''; }
      if (sortField === 'location') { av = a.location ?? ''; bv = b.location ?? ''; }
      if (sortField === 'availability') { av = a.availability ?? 0; bv = b.availability ?? 0; }
      return sortAsc ? (av < bv ? -1 : 1) : (av > bv ? -1 : 1);
    });

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field
      ? (sortAsc ? <ChevronUp className="h-3 w-3 text-[#ffccac]" /> : <ChevronDown className="h-3 w-3 text-[#ffccac]" />)
      : <ChevronDown className="h-3 w-3 text-zinc-600" />;

  return (
    <div className="min-h-screen bg-[#26201e] text-white font-sans">
      <Navbar />

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen pt-28 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 w-full">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Volunteer Dashboard</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {loading ? 'Loading...' : `Managing ${volunteers.length} registered volunteers`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:border-white/20 hover:text-white transition-all shadow-sm"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print</span>
              </button>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 rounded-xl bg-[#ffccac] hover:bg-[#ffccac]/90 active:scale-95 text-[#26201e] px-4 py-2.5 text-sm font-bold uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Stats Row */}
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 rounded-2xl border border-white/8 bg-white/3 animate-pulse" />
              ))}
            </div>
          ) : stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Volunteers" value={stats.totalVolunteers} />
              <StatCard icon={CheckCircle2} label="Onboarded" value={stats.onboardedVolunteers} sub={`${stats.pendingOnboarding} pending`} />
              <StatCard icon={Sparkles} label="Unique Skills" value={stats.uniqueSkills} />
              <StatCard icon={TrendingUp} label="Total Hours / Week" value={stats.totalAvailabilityHours} />
            </div>
          )}

          {/* Top Locations */}
          {stats?.topLocations && stats.topLocations.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <MapPin className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 mr-1">Hot spots:</span>
              {stats.topLocations.map(({ location, count }) => (
                <button
                  key={location}
                  onClick={() => setSearch(location)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-zinc-300 hover:border-[#ffccac]/30 hover:text-[#ffccac] transition-colors"
                >
                  {location} <span className="text-zinc-600">({count})</span>
                </button>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, location, or skill..."
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2.5 pl-9 pr-4 text-xs text-white placeholder-zinc-600 focus:border-[#ffccac]/40 focus:outline-none focus:ring-1 focus:ring-[#ffccac]/20 transition-all"
              />
            </div>
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-zinc-300 focus:border-[#ffccac]/40 focus:outline-none cursor-pointer"
            >
              {domains.map((d) => <option key={d} value={d} className="bg-[#26201e]">{d === 'All' ? 'All Domains' : d}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-xs text-zinc-300 focus:border-[#ffccac]/40 focus:outline-none cursor-pointer"
            >
              {['All', 'Onboarded', 'Pending'].map((s) => <option key={s} value={s} className="bg-[#26201e]">{s === 'All' ? 'All Statuses' : s}</option>)}
            </select>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-white/8 bg-[#1e1814]/50 overflow-hidden">
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#3a2e28 transparent' }}>
              <table className="w-full min-w-[640px] text-xs">
                <thead>
                  <tr className="border-b border-white/8 bg-white/3">
                    {[
                      { key: 'name', label: 'Volunteer' },
                      { key: 'location', label: 'Location' },
                      { key: 'availability', label: 'Hrs/Week' },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => toggleSort(key as typeof sortField)}
                        className="px-4 py-3.5 text-left font-bold uppercase tracking-widest text-zinc-500 cursor-pointer hover:text-zinc-300 transition-colors select-none"
                      >
                        <span className="flex items-center gap-1.5">
                          {label}
                          <SortIcon field={key as typeof sortField} />
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3.5 text-left font-bold uppercase tracking-widest text-zinc-500">Skills</th>
                    <th className="px-4 py-3.5 text-left font-bold uppercase tracking-widest text-zinc-500">Status</th>
                    <th className="px-4 py-3.5 text-left font-bold uppercase tracking-widest text-zinc-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i}>
                        {[...Array(6)].map((_, j) => (
                          <td key={j} className="px-4 py-4">
                            <div className="h-3 rounded bg-white/5 animate-pulse" style={{ width: `${60 + ((i * 7 + j * 13) % 30)}%` }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-zinc-600">
                        No volunteers match your filters.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((v) => (
                      <tr key={v._id} className="hover:bg-white/3 transition-colors group">
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-white">{v.userId?.name ?? '—'}</p>
                          <p className="text-[11px] text-zinc-500">{v.userId?.email}</p>
                        </td>
                        <td className="px-4 py-3.5 text-zinc-300">{v.location || '—'}</td>
                        <td className="px-4 py-3.5 text-zinc-300">{v.availability || '—'}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {(v.skills ?? []).slice(0, 2).map((s) => (
                              <span key={s} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">{s}</span>
                            ))}
                            {(v.skills?.length ?? 0) > 2 && (
                              <span className="text-[10px] text-zinc-600">+{v.skills.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${v.onboardingComplete ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                            {v.onboardingComplete ? 'Onboarded' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <button
                            onClick={() => setSelected(v)}
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400 hover:border-[#ffccac]/30 hover:text-[#ffccac] transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Eye className="h-3 w-3" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && filtered.length > 0 && (
              <div className="border-t border-white/8 px-4 py-3 text-[11px] text-zinc-600">
                Showing {filtered.length} of {volunteers.length} volunteers
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Volunteer Detail Drawer */}
      <DetailDrawer volunteer={selected} onClose={() => setSelected(null)} />

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .fixed, header, nav { display: none !important; }
          .md\\:ml-56 { margin-left: 0 !important; }
          body { background: white !important; color: black !important; }
          table { font-size: 10px; }
          .rounded-2xl, .rounded-lg { border-radius: 0 !important; }
          button { display: none !important; }
        }
      `}</style>

      <Footer />
    </div>
  );
}
