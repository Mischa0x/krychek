'use client';

import dynamic from 'next/dynamic';

const HolographicOrb = dynamic(
  () => import('@/components/hologram/HolographicOrb'),
  { ssr: false }
);

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Holographic Orb - Hero focal point */}
      <div className="flex flex-col items-center">
        <HolographicOrb size={420} className="relative z-10" />

        {/* Minimal typography - reduced weight, increased spacing */}
        <div className="text-center mt-12">
          <h1 className="text-3xl font-light text-white/90 tracking-widest uppercase">
            Krychek
          </h1>
          <p className="text-zinc-500 text-sm mt-3 tracking-wide">
            2025
          </p>
        </div>
      </div>

      {/* Single action - Spotify embed compact */}
      <div className="mt-20 w-full max-w-md">
        <iframe
          style={{ borderRadius: '12px' }}
          src="https://open.spotify.com/embed/playlist/37i9dQZEVXd5ynzijJWavy?utm_source=generator&theme=0"
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
}
