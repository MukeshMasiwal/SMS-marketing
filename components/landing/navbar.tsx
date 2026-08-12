"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-2.5 text-zinc-100 font-bold text-lg hover:opacity-90 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <MessageSquare className="h-5 w-5" />
          </div>
          <span>SMS Marketing</span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <Link href="/" className="hover:text-zinc-100 transition-colors">
            Home
          </Link>
          <Link href="#features" className="hover:text-zinc-100 transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="hover:text-zinc-100 transition-colors">
            Pricing
          </Link>
          <Link href="#how-it-works" className="hover:text-zinc-100 transition-colors">
            How It Works
          </Link>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800/60 font-medium">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 rounded-full shadow-md shadow-indigo-600/20">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={toggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950 px-4 pt-2 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-3 text-base font-medium text-zinc-300">
            <Link href="/" onClick={closeMobileMenu} className="hover:text-white transition-colors py-1">
              Home
            </Link>
            <Link href="#features" onClick={closeMobileMenu} className="hover:text-white transition-colors py-1">
              Features
            </Link>
            <Link href="#pricing" onClick={closeMobileMenu} className="hover:text-white transition-colors py-1">
              Pricing
            </Link>
            <Link href="#how-it-works" onClick={closeMobileMenu} className="hover:text-white transition-colors py-1">
              How It Works
            </Link>
          </nav>

          <div className="pt-2 flex flex-col gap-2.5 border-t border-zinc-800">
            <Link href="/login" onClick={closeMobileMenu} className="w-full">
              <Button variant="outline" className="w-full justify-center border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-800">
                Sign In
              </Button>
            </Link>
            <Link href="/register" onClick={closeMobileMenu} className="w-full">
              <Button className="w-full justify-center bg-indigo-600 hover:bg-indigo-500 text-white">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
