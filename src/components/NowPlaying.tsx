'use client';

import { useEffect, useState } from 'react';
import { CurrentlyPlayingResponse } from '@/types';
import { formatDuration } from '@/lib/utils';

export default function NowPlaying() {
  const [data, setData] = useState<CurrentlyPlayingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await fetch('/api/spotify/now');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
        setError(null);
      } catch (err) {
        setError('Failed to fetch currently playing');
      } finally {
        setLoading(false);
      }
    };

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse bg-spotify-darkgray rounded-lg p-8">
        <div className="flex items-center space-x-6">
          <div className="w-32 h-32 bg-spotify-gray rounded" />
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-spotify-gray rounded w-3/4" />
            <div className="h-4 bg-spotify-gray rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-spotify-darkgray rounded-lg p-8 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!data || !data.is_playing || !data.item) {
    return (
      <div className="bg-spotify-darkgray rounded-lg p-8 text-center">
        <p className="text-spotify-lightgray text-lg">Nothing playing right now</p>
        <p className="text-spotify-lightgray text-sm mt-2">Start playing something on Spotify!</p>
      </div>
    );
  }

  const track = data.item;
  const albumImage = track.album.images[0]?.url;
  const progress = data.progress_ms || 0;
  const duration = track.duration_ms;
  const progressPercent = (progress / duration) * 100;

  return (
    <div className="bg-spotify-darkgray rounded-lg p-8">
      <div className="flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8">
        {albumImage && (
          <img
            src={albumImage}
            alt={track.album.name}
            className="w-48 h-48 rounded-lg shadow-2xl"
          />
        )}
        <div className="flex-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
            <span className="inline-flex items-center space-x-1 text-spotify-green text-sm">
              <span className="w-2 h-2 bg-spotify-green rounded-full animate-pulse" />
              <span>Now Playing</span>
            </span>
          </div>
          <a
            href={track.external_urls.spotify}
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl font-bold text-white hover:underline block"
          >
            {track.name}
          </a>
          <p className="text-spotify-lightgray text-lg mt-1">
            {track.artists.map((a) => a.name).join(', ')}
          </p>
          <p className="text-spotify-lightgray text-sm mt-1">{track.album.name}</p>
          <div className="mt-4">
            <div className="w-full bg-spotify-gray rounded-full h-1">
              <div
                className="bg-spotify-green h-1 rounded-full transition-all duration-1000"
                style={{ width: progressPercent + '%' }}
              />
            </div>
            <div className="flex justify-between text-spotify-lightgray text-xs mt-1">
              <span>{formatDuration(progress)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
