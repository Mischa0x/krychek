'use client';

import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

export default function Header() {
  const { data: session, status } = useSession();

  return (
    <header className="bg-spotify-black border-b border-spotify-gray">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-spotify-green font-bold text-xl">
              Spotify Stats
            </Link>
            {session && (
              <div className="hidden sm:flex space-x-4">
                <NavLink href="/top">Top</NavLink>
                <NavLink href="/recent">Recent</NavLink>
                <NavLink href="/now">Now Playing</NavLink>
                {session.user.isAdmin && (
                  <NavLink href="/admin">Admin</NavLink>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-spotify-gray animate-pulse" />
            ) : session ? (
              <div className="flex items-center space-x-4">
                {session.user?.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <span className="text-white hidden sm:block">{session.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="text-spotify-lightgray hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('spotify')}
                className="bg-spotify-green text-black px-4 py-2 rounded-full font-semibold hover:bg-opacity-90 transition-colors"
              >
                Sign in with Spotify
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-spotify-lightgray hover:text-white transition-colors font-medium"
    >
      {children}
    </Link>
  );
}
