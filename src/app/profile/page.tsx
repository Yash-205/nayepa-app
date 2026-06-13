'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  User, 
  Mail, 
  Shield, 
  Phone, 
  MapPin, 
  Clock, 
  Sparkles, 
  Plus, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Calendar,
  ArrowRight
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface VolunteerData {
  phone: string;
  location: string;
  availability: number;
  skills: string[];
  targetDomain: string;
  onboardingComplete: boolean;
  screeningNotes: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [volunteer, setVolunteer] = useState<VolunteerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Form states
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState(0);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/profile');
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Failed to load profile details');
        }
        const data = await res.json();
        setUser(data.user);
        if (data.volunteer) {
          setVolunteer(data.volunteer);
          setPhone(data.volunteer.phone || '');
          setLocation(data.volunteer.location || '');
          setAvailability(data.volunteer.availability || 0);
          setSkills(data.volunteer.skills || []);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while loading profile details.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSkill = newSkill.trim();
    if (cleanSkill && !skills.includes(cleanSkill)) {
      setSkills([...skills, cleanSkill]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          location,
          availability: Number(availability),
          skills
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully!');
      if (data.volunteer) {
        setVolunteer(data.volunteer);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile changes.');
    } finally {
      setSaving(false);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#26201e] text-white font-sans overflow-x-hidden">
        <Navbar />
        <div className="flex-grow flex items-center justify-center min-h-[70vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-[#ffccac] animate-spin" />
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest">Loading Profile Details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#26201e] text-white font-sans selection:bg-[#ffccac]/30 selection:text-[#ffccac] overflow-x-hidden">
      <Navbar />

      <main className="flex-grow pt-28 pb-16 px-4 sm:px-6 lg:px-8 relative max-w-7xl mx-auto w-full">
        {/* Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 h-[500px] w-[500px] rounded-full bg-[#ffccac]/5 blur-[120px]" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
          
          {/* LEFT COLUMN: User Summary Card */}
          <div className="lg:col-span-4 bg-[#26201e]/60 border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Avatar Initials */}
              <div className="h-20 w-20 rounded-full bg-[#ffccac] text-[#26201e] text-2xl font-extrabold flex items-center justify-center shadow-lg border-2 border-white/10">
                {user ? getInitials(user.name) : 'U'}
              </div>
              
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">{user?.name}</h2>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                  <Shield className="h-3 w-3 text-[#ffccac]" />
                  {user?.role}
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-5 space-y-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-zinc-500" />
                <span className="truncate">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Calendar className="h-4 w-4 shrink-0 text-zinc-500" />
                <span>Joined {user ? formatDate(user.createdAt) : ''}</span>
              </div>
            </div>

            {/* Onboarding Status Card for Volunteer */}
            {user?.role === 'Volunteer' && (
              <div className="border-t border-white/5 pt-5">
                <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Onboarding Status</span>
                {volunteer?.onboardingComplete ? (
                  <div className="p-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <div className="text-[11px] font-semibold leading-snug">
                      Onboarding Completed
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg border border-[#ffccac]/20 bg-[#ffccac]/5 text-[#ffccac] flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                      <span className="text-[11px] font-semibold leading-snug">Screening In Progress</span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-normal">
                      Complete your coordinator interview via chatbot to unlock campaigns.
                    </p>
                    <Link
                      href="/chat"
                      className="mt-1 w-full inline-flex items-center justify-center gap-1 py-1.5 rounded-md bg-[#ffccac] hover:bg-[#ffccac]/90 text-[#26201e] text-[10px] font-bold uppercase tracking-wider transition-all"
                    >
                      Resume Interview <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Profile details and forms */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Status alerts */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-400">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                <p>{success}</p>
              </div>
            )}

            {user?.role === 'Volunteer' ? (
              <form onSubmit={handleSave} className="space-y-6">
                
                {/* Volunteer Details Section */}
                <div className="bg-[#26201e]/60 border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-base font-bold tracking-tight text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-[#ffccac]" />
                      Details
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="block w-full rounded-lg border border-white/10 bg-[#26201e]/40 py-2.5 pl-9 pr-4 text-white placeholder-zinc-600 focus:border-[#ffccac] focus:outline-none focus:ring-1 focus:ring-[#ffccac] text-xs transition-all duration-200"
                          placeholder="+1 555-555-5555"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                          <Phone className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">
                        Location / City
                      </label>
                      <div className="relative">
                        <input
                          id="location"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="block w-full rounded-lg border border-white/10 bg-[#26201e]/40 py-2.5 pl-9 pr-4 text-white placeholder-zinc-600 focus:border-[#ffccac] focus:outline-none focus:ring-1 focus:ring-[#ffccac] text-xs transition-all duration-200"
                          placeholder="e.g. Kanpur, Ghaziabad"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                          <MapPin className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="availability" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">
                        Availability (Hours per Week)
                      </label>
                      <div className="relative">
                        <input
                          id="availability"
                          type="number"
                          min="0"
                          max="168"
                          value={availability}
                          onChange={(e) => setAvailability(Number(e.target.value))}
                          className="block w-full rounded-lg border border-white/10 bg-[#26201e]/40 py-2.5 pl-9 pr-4 text-white placeholder-zinc-600 focus:border-[#ffccac] focus:outline-none focus:ring-1 focus:ring-[#ffccac] text-xs transition-all duration-200"
                          placeholder="10"
                        />
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-zinc-500">
                          <Clock className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5 ml-1">
                        Target Welfare Domain
                      </label>
                      <div className="block w-full rounded-lg border border-white/5 bg-[#26201e]/20 py-2.5 px-4 text-zinc-300 text-xs select-none">
                        {volunteer?.targetDomain ? (
                          <span className="font-semibold text-[#ffccac] uppercase tracking-wider">{volunteer.targetDomain}</span>
                        ) : (
                          <span className="italic text-zinc-500">Determined automatically upon completing onboarding screening.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skills Management Section */}
                <div className="bg-[#26201e]/60 border border-white/10 rounded-xl p-6 shadow-xl space-y-6">
                  <div className="border-b border-white/5 pb-3">
                    <h3 className="text-base font-bold tracking-tight text-white uppercase tracking-wider">
                      My Skills & Talents
                    </h3>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      Manage skills or tags that match you with active campaigns.
                    </p>
                  </div>

                  {/* Skills Tags List */}
                  <div className="flex flex-wrap gap-2 min-h-12 p-3 rounded-lg border border-white/5 bg-[#26201e]/40">
                    {skills.length === 0 ? (
                      <span className="text-zinc-600 text-xs italic self-center pl-1">No skills added yet. Add some below!</span>
                    ) : (
                      skills.map((skill, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-semibold text-zinc-200"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-zinc-500 hover:text-red-400 transition-colors focus:outline-none"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add Skill Form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill(e);
                        }
                      }}
                      placeholder="e.g. Teaching, Graphic Design, Web Development"
                      className="block flex-1 rounded-lg border border-white/10 bg-[#26201e]/40 py-2.5 px-4 text-white placeholder-zinc-600 focus:border-[#ffccac] focus:outline-none focus:ring-1 focus:ring-[#ffccac] text-xs transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="inline-flex items-center justify-center p-2.5 rounded-lg border border-[#ffccac]/20 hover:border-[#ffccac]/40 bg-[#ffccac]/5 hover:bg-[#ffccac]/10 text-[#ffccac] transition-all"
                    >
                      <Plus className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {/* Screening notes (Quote-style) */}
                {volunteer?.screeningNotes && (
                  <div className="bg-[#26201e]/60 border border-white/10 rounded-xl p-6 shadow-xl space-y-4">
                    <div className="border-b border-white/5 pb-2">
                      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        Screening Coordinator Notes
                      </h3>
                    </div>
                    <blockquote className="border-l-2 border-[#ffccac] pl-4 italic text-zinc-300 text-xs leading-relaxed py-1">
                      "{volunteer.screeningNotes}"
                    </blockquote>
                  </div>
                )}

                {/* Submit Panel */}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ffccac] hover:bg-[#ffccac]/90 active:scale-[0.99] text-[#26201e] px-8 py-3 text-xs font-bold tracking-widest uppercase transition-all duration-200 shadow-md disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* Administrative details for Coordinators / Admin */
              <div className="bg-[#26201e]/60 border border-white/10 rounded-xl p-8 shadow-xl text-center space-y-5">
                <div className="mx-auto h-12 w-12 rounded-full bg-[#ffccac]/10 border border-[#ffccac]/20 flex items-center justify-center text-[#ffccac]">
                  <Shield className="h-6 w-6" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                    {user?.role} Console Access
                  </h3>
                  <p className="text-zinc-400 text-xs leading-relaxed max-w-md mx-auto">
                    You are logged in with administrative and deployment oversight capabilities. Head to the homepage campaigns to verify logs or launch drives.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white transition-all"
                  >
                    Go to Homepage
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
