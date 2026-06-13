import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Linkedin, Youtube, Facebook, Twitter } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#26201e] text-zinc-400 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center bg-white p-0.5 shadow-sm rounded-sm">
                <Image
                  src="/assets/logo.png"
                  alt="NayePankh Logo"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <span className="text-md font-bold tracking-tight text-white">
                Naye<span className="text-[#ffccac]">Pankh</span> Foundation
              </span>
            </Link>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              NayePankh Foundation is a UP Government registered NGO and one of the biggest student organizations in India. We have helped over 2 lakh underprivileged people by providing free food, sanitary pads, clothes, and education.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="http://www.instagram.com/nayepankhfoundation" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.linkedin.com/company/nayepankh" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="https://www.youtube.com/@nayepankhfoundation" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Youtube className="h-5 w-5" />
              </a>
              <a href="http://www.facebook.com/nayepankhfoundation" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="http://www.twitter.com/nayepankh" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">Admin Portal</Link>
              </li>
            </ul>
          </div>

          {/* Registration Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">NGO Registration</h3>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li>• UP Govt. Registered NGO</li>
              <li>• Section 80G & 12A Tax Exempt</li>
              <li>• Society Registration Act, 1860</li>
              <li className="text-xs text-[#ffccac] font-semibold mt-2">"Badalte Bharat Ki Nayi Tasveer"</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} NayePankh Foundation. All Rights Reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy-policy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms-and-conditions" className="hover:text-zinc-300 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
