'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  ChevronLeft, 
  ChevronRight,
  MessageSquareShare,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin safely for SSR
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch session', err);
      }
    }
    checkSession();
  }, []);

  const slides = [
    {
      img: '/assets/asset 5.jpeg',
      text: 'NayePankh Foundation promotes the culture of kidness and wants to instill the sense of giving back to the society amongst modern youth..',
    },
    {
      img: '/assets/asset 6.jpeg',
      text: 'NayePankh Foundation has been working since 2021 for under and less privileged people in the field of hunger, sanitary, health, education, awareness and rights..',
    },
    {
      img: '/assets/asset 7.jpeg',
      text: 'NayePankh Foundation works with a vision to create a society where child care, women empowerment, health and animal protection are basic rights.',
    }
  ];

  const handleNextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Autoplay slideshow
  useEffect(() => {
    const timer = setInterval(handleNextSlide, 2000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  // GSAP viewport animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero load animations
      gsap.from('.hero-animate', {
        y: 50,
        opacity: 0,
        duration: 1.2,
        stagger: 0.15,
        ease: 'power4.out',
      });

      // About us section triggers
      gsap.from('.about-img-animate', {
        scrollTrigger: {
          trigger: '.about-img-animate',
          start: 'top 85%',
        },
        x: -60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      gsap.from('.about-text-animate', {
        scrollTrigger: {
          trigger: '.about-text-animate',
          start: 'top 85%',
        },
        x: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      // Welcome Banner trigger
      gsap.from('.welcome-animate', {
        scrollTrigger: {
          trigger: '.welcome-animate',
          start: 'top 80%',
        },
        scale: 0.95,
        opacity: 0,
        duration: 1.2,
        ease: 'power3.out',
      });

      // Slideshow carousel trigger
      gsap.from('.slideshow-animate', {
        scrollTrigger: {
          trigger: '.slideshow-animate',
          start: 'top 85%',
        },
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      // Team section triggers
      gsap.from('.team-img-animate', {
        scrollTrigger: {
          trigger: '.team-img-animate',
          start: 'top 85%',
        },
        x: -60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      gsap.from('.team-text-animate', {
        scrollTrigger: {
          trigger: '.team-text-animate',
          start: 'top 85%',
        },
        x: 60,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });

      // AI Callout card trigger
      gsap.from('.ai-callout-animate', {
        scrollTrigger: {
          trigger: '.ai-callout-animate',
          start: 'top 85%',
        },
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="flex flex-col min-h-screen bg-[#26201e] text-white font-sans selection:bg-[#ffccac]/30 selection:text-[#ffccac] overflow-x-hidden">
      <Navbar />

      {/* Hero Banner Block (Screenshot 1) - Covers Full Page (h-screen) */}
      <section className="relative h-screen flex flex-col justify-center overflow-hidden bg-[#26201e] px-4 sm:px-6 lg:px-8">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/asset 1.jpeg"
            alt="NayePankh smile on their faces drive"
            fill
            priority
            className="object-cover object-center brightness-[0.4]"
          />
        </div>
        
        {/* Banner Content */}
        <div className="relative z-10 mx-auto max-w-7xl w-full text-center sm:text-left space-y-5">
          <span className="hero-animate inline-block text-xs font-bold tracking-widest text-[#f3f4f6] uppercase border-b border-[#ffccac] pb-1">
            UP GOVERNMENT, 80G & 12A Registered NGO
          </span>
          <h1 className="hero-animate text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
            It's that easy to <br />
            bring a Smile on <br />
            Their Faces
          </h1>
          <p className="hero-animate max-w-xl text-sm sm:text-base text-zinc-300 font-medium">
            We don't ask for much, just help us with what you can- Be it Money, Skill or Your Time
          </p>
          <div className="hero-animate mt-8 flex flex-col sm:flex-row items-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto text-center px-8 py-3.5 text-xs font-bold tracking-widest uppercase bg-white text-[#26201e] hover:bg-zinc-200 transition-all duration-200 rounded-none shadow-md"
            >
              Donate Now
            </Link>
            
            {user?.role === 'Coordinator' ? (
              <Link
                href="/dashboard"
                className="w-full sm:w-auto text-center px-8 py-3.5 text-xs font-bold tracking-widest uppercase border border-[#ffccac] text-[#ffccac] hover:bg-[#ffccac]/10 transition-all duration-200 rounded-none"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/chat"
                className="w-full sm:w-auto text-center px-8 py-3.5 text-xs font-bold tracking-widest uppercase border border-white text-white hover:bg-white/10 transition-all duration-200 rounded-none"
              >
                Apply via AI Chat
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* About Us Block (Screenshot 2) */}
      <section id="about-us" className="py-24 bg-[#26201e] px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Kid Portrait */}
          <div className="about-img-animate lg:col-span-5 relative h-[520px] sm:h-[620px] w-full overflow-hidden shadow-xl rounded-none">
            <Image
              src="/assets/asset 2.jpeg"
              alt="Smiling kid from NayePankh"
              fill
              className="object-cover"
            />
          </div>

          {/* Right: About Us Info */}
          <div className="about-text-animate lg:col-span-7 space-y-6">
            <span className="text-[#ffccac] font-bold uppercase text-xs tracking-widest block">
              ABOUT US
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Think global, <br />
              Act local.
            </h2>
            <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl">
              "NayePankh Foundation" is a non governmental organisation with a strong desire to help the society and make it a better place for all, by doing everything in our power and to make our vision successful we would require your vital support. Service to mankind is the service to god. Let's revolutionise the society together!.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/chat"
                className="px-8 py-3.5 text-xs font-bold tracking-widest uppercase bg-white text-[#26201e] hover:bg-zinc-200 transition-all rounded-none"
              >
                Learn More
              </Link>
              <Link
                href="#certificates"
                className="px-8 py-3.5 text-xs font-bold tracking-widest uppercase bg-white text-[#26201e] hover:bg-zinc-200 transition-all rounded-none"
              >
                Our Certificates
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Welcome / Mission Block (Screenshot 3) */}
      <section className="welcome-animate relative py-36 flex items-center justify-center overflow-hidden border-y border-white/5">
        <div className="absolute inset-0 z-0">
          <Image
            src="/assets/asset 4.jpeg"
            alt="Welcome to NayePankh drive kids"
            fill
            className="object-cover brightness-[0.25]"
          />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Welcome to NayePankh Foundation
          </h2>
          <span className="inline-block text-[#ffccac] font-bold text-xs uppercase tracking-widest border-b border-[#ffccac] pb-1">
            UP GOVT. | 80G & 12A Registered
          </span>
          <p className="text-zinc-200 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-medium">
            We are one of the Biggest Student led NGO of India with its operations extended in the city of Kanpur, Ghaziabad and various other cities.
          </p>
        </div>
      </section>

      {/* Interactive Carousel Slideshow Block - Simple Automatic Image Slider */}
      <section id="newspaper" className="slideshow-animate py-4 sm:py-6 bg-white text-[#26201e] px-4 sm:px-6 lg:px-8 relative">
        <div className="mx-auto max-w-7xl relative">
          
          {/* Slider Container */}
          <div className="relative overflow-hidden">
            {/* Slides Wrapper */}
            <div 
              className="flex w-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {slides.map((slide, idx) => (
                <div key={idx} className="w-full flex-shrink-0 relative h-[160px] sm:h-[260px] md:h-[320px] lg:h-[380px]">
                  <Image
                    src={slide.img}
                    alt={`NayePankh Slideshow Drive ${idx + 1}`}
                    fill
                    priority={idx === 0}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Left Arrow (Placed at Extreme Left of the section boundary) */}
          <button
            onClick={handlePrevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-[#26201e] active:scale-95 transition-all z-10"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="h-10 w-10 stroke-[1.5]" />
          </button>

          {/* Right Arrow (Placed at Extreme Right of the section boundary) */}
          <button
            onClick={handleNextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-[#26201e] active:scale-95 transition-all z-10"
            aria-label="Next Slide"
          >
            <ChevronRight className="h-10 w-10 stroke-[1.5]" />
          </button>

          {/* Dots centered at the bottom of the section */}
          <div className="flex justify-center gap-2.5 pt-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-2.5 rounded-full transition-all duration-300 ${activeSlide === i ? 'w-8 bg-[#26201e]' : 'w-2.5 bg-zinc-300'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* Join Our Team Block (Screenshot 5) */}
      <section className="py-24 bg-[#26201e] px-4 sm:px-6 lg:px-8 border-t border-white/5 overflow-hidden">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left: Team photo */}
          <div className="team-img-animate lg:col-span-5 relative h-[480px] sm:h-[550px] w-full overflow-hidden shadow-xl rounded-none">
            <Image
              src="/assets/asset 8.jpeg"
              alt="NayePankh team photo"
              fill
              className="object-cover"
            />
          </div>

          {/* Right: Join team copy */}
          <div className="team-text-animate lg:col-span-7 space-y-6">
            <span className="text-[#ffccac] font-bold uppercase text-xs tracking-widest block">JOIN OUR TEAM</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight">TEAM</h2>
            <p className="text-zinc-300 text-sm leading-relaxed max-w-2xl">
              "Join our team and make a difference in the lives of those in need. At NayePankh Foundation, we are committed to creating positive change and empowering communities. By joining our team, you will have the opportunity to contribute your time, skills, and ideas to help make a real impact. Whether you are passionate about education, health, or providing support during times of crisis, there is a place for you on our team. Join us today and be a part of an organization that is making a difference, one person at a time."
            </p>
            <div className="pt-4">
              <Link
                href="/register"
                className="px-8 py-3.5 text-xs font-bold tracking-widest uppercase bg-white text-[#26201e] hover:bg-zinc-200 transition-all rounded-none"
              >
                JOIN US
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* AI Portal Callout Section */}
      <section id="donate" className="ai-callout-animate py-24 bg-[#26201e] px-4 sm:px-6 lg:px-8 border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="bg-[#26201e]/60 border border-white/10 rounded-none p-8 md:p-12 relative overflow-hidden">
            <div className="absolute -right-24 -bottom-24 h-96 w-96 rounded-full bg-[#ffccac]/5 blur-[80px]" />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-[#ffccac] text-xs font-bold uppercase tracking-wider block">SMART AUTOMATION PROTOCOL</span>
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  AI Agents & ML Pipelines
                </h2>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  We integrate conversational agents and mathematical models to manage our volunteer base and forecast donations, driving efficiency across our operations.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 rounded-none bg-white/5 border border-white/5">
                    <h4 className="text-sm font-semibold text-white">AI Onboarding Chat</h4>
                    <p className="text-xs text-zinc-400 mt-1">Direct conversation registers volunteers and maps background metrics.</p>
                  </div>
                  <div className="p-4 rounded-none bg-white/5 border border-white/5">
                    <h4 className="text-sm font-semibold text-white">Matching Inference</h4>
                    <p className="text-xs text-zinc-400 mt-1">Cosine Similarity matches volunteer profiles against active campaigns.</p>
                  </div>
                </div>
              </div>

              {/* Action Board */}
              <div className="bg-[#26201e]/80 border border-white/5 rounded-none p-6 space-y-4">
                <div className="flex items-center gap-2 border-b border-white/5 pb-3">
                  <ShieldCheck className="h-5 w-5 text-[#ffccac]" />
                  <span className="text-xs font-semibold text-zinc-300">Authentication Gateway</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Authenticate securely to test the Volunteer Screening Chatbot and review Coordinator match panels.
                </p>
                <div className="flex gap-4 pt-2">
                  <Link
                    href={user ? "/chat" : "/login"}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#ffccac] hover:bg-[#ffccac]/90 text-[#26201e] text-xs font-bold tracking-widest uppercase rounded-none transition-all"
                  >
                    Open AI Chat
                  </Link>
                  <Link
                    href={user ? "/profile" : "/login"}
                    className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-bold tracking-widest uppercase rounded-none transition-all"
                  >
                    {user ? "Open Profile" : "Open Console"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Block */}
      <section className="py-24 text-center max-w-4xl mx-auto px-4 bg-[#26201e]">
        <div className="relative h-16 w-16 mx-auto mb-6 bg-white p-1 rounded-sm shadow-sm flex items-center justify-center">
          <Image
            src="/assets/logo.png"
            alt="NayePankh Logo"
            width={55}
            height={55}
            className="object-contain"
          />
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-serif italic text-zinc-200 leading-relaxed font-light">
          "If we all do something, then together there is no problem that we cannot solve!"
        </h2>
        <p className="mt-4 text-zinc-500 text-xs tracking-wider uppercase font-semibold">— NayePankh Foundation Philosophy</p>
      </section>

      <Footer />
    </div>
  );
}
