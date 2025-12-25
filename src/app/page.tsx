'use client';

import { useSession, signIn } from 'next-auth/react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-spotify-green"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-4">
        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 text-center">
          Your Spotify Stats
        </h1>
        <p className="text-spotify-lightgray text-lg sm:text-xl mb-8 text-center max-w-2xl">
          Discover your top tracks, artists, and see what you are listening to right now.
        </p>
        <button
          onClick={() => signIn('spotify')}
          className="bg-spotify-green text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-opacity-90 transition-colors"
        >
          Sign in with Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">
        Welcome back, {session.user?.name}!
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/top"
          className="bg-spotify-darkgray p-6 rounded-lg hover:bg-spotify-gray transition-colors"
        >
          <h2 className="text-xl font-bold text-white mb-2">Top Tracks & Artists</h2>
          <p className="text-spotify-lightgray">
            See your most played tracks and favorite artists
          </p>
        </Link>
        <Link
          href="/recent"
          className="bg-spotify-darkgray p-6 rounded-lg hover:bg-spotify-gray transition-colors"
        >
          <h2 className="text-xl font-bold text-white mb-2">Recently Played</h2>
          <p className="text-spotify-lightgray">
            View your listening history
          </p>
        </Link>
        <Link
          href="/now"
          className="bg-spotify-darkgray p-6 rounded-lg hover:bg-spotify-gray transition-colors"
        >
          <h2 className="text-xl font-bold text-white mb-2">Now Playing</h2>
          <p className="text-spotify-lightgray">
            See what is currently playing
          </p>
        </Link>
      </div>
    </div>
  );
}
