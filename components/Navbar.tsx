'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getCurrentUserName } from './action';

type Route = { label: string; href: string };

const ROUTES: Route[] = [
  { label: 'Home', href: '/' },
  { label: 'Projects', href: '/projects' },
  { label: 'Notes', href: '/notes' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Chat', href: '/chat' },
  { label: 'Settings', href: '/settings' },
];

export default function Navbar() {
  const pathname = usePathname() || '/';
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      const name = await getCurrentUserName();
      setUser(name);
    }
    fetchUser();
  }, []);

  // Close mobile menu on route change
  // useEffect(() => {
  //   setOpen(false);
  // }, [pathname]);

    return (
        <header className="bg-white backdrop-blur-sm border-b sticky top-0 z-40 h-16 w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
            {/* Left: Brand + Nav */}
            <div className="flex items-center gap-6">
                <Link href="/" className="flex text-black items-center gap-3 text-lg font-semibold">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M3 12h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 3v18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                ProjectHub
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
                {ROUTES.map((r) => {
                    const active = pathname === r.href || pathname.startsWith(r.href + '/');
                    return (
                    <Link
                        key={r.href}
                        href={r.href}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                        active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                        aria-current={active ? 'page' : undefined}
                    >
                        {r.label}
                    </Link>
                    );
                })}
                </nav>
            </div>
        {/* Right: actions */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <Link href="/sandbox" className="px-3 py-2 text-sm rounded-md">{user}</Link>
              <Link href="/user" className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-50">
                <span className="sr-only">Open user profile</span>
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-sm">
                  {user && user.length >= 2 ? user[0] + user[1] : 'AA'}
                </div>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setOpen((s) => !s)}
              aria-expanded={open}
              aria-label="Toggle menu"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
                {open ? (
                  <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {ROUTES.map((r) => {
              const active = pathname === r.href || pathname.startsWith(r.href + '/');
              return (
                <Link
                  key={r.href}
                  href={r.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  {r.label}
                </Link>
              );
            })}

            <Link href="/user" className="block px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50">
              User
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}