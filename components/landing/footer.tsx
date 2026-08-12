import Link from "next/link";
import { MessageSquare } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 text-zinc-100 font-bold text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <span>SMS Marketing</span>
            </Link>
            <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
              The modern, reliable, and simple SMS platform for your business. Manage contacts, send bulk broadcasts, and track delivery in real-time.
            </p>
          </div>

          {/* Product Navigation */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              Product
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Navigation */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              Account
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {currentYear} SMS Marketing Platform. All rights reserved.</p>
          <p className="text-zinc-500">Built for high delivery bulk SMS campaigns.</p>
        </div>
      </div>
    </footer>
  );
}
