'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TrackCard from '@/components/TrackCard';
import ArtistCard from '@/components/ArtistCard';
import TimeRangeSelector from '@/components/TimeRangeSelector';
import Loading from '@/components/Loading';
import { SpotifyTrack, SpotifyArtist, TimeRange } from '@/types';
import { cn } from '@/lib/utils';

type ContentType = 'tracks' | 'artists';

export default function TopPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>('tracks');
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term');
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [artists, setArtists] = useState<SpotifyArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          '/api/spotify/top?type=' + contentType + '&time_range=' + timeRange + '&limit=50'
        );
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (contentType === 'tracks') {
          setTracks(data.items || []);
        } else {
          setArtists(data.items || []);
        }
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session, contentType, timeRange]);

  if (status === 'loading') return <Loading />;
  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Your Top {contentType === 'tracks' ? 'Tracks' : 'Artists'}</h1>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-8">
        <div className="flex space-x-2">
          <button
            onClick={() => setContentType('tracks')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              contentType === 'tracks'
                ? 'bg-white text-black'
                : 'bg-spotify-darkgray text-spotify-lightgray hover:text-white'
            )}
          >
            Tracks
          </button>
          <button
            onClick={() => setContentType('artists')}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              contentType === 'artists'
                ? 'bg-white text-black'
                : 'bg-spotify-darkgray text-spotify-lightgray hover:text-white'
            )}
          >
            Artists
          </button>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-3">
          {contentType === 'tracks'
            ? tracks.map((track, i) => <TrackCard key={track.id} track={track} rank={i + 1} />)
            : artists.map((artist, i) => <ArtistCard key={artist.id} artist={artist} rank={i + 1} />)}
        </div>
      )}
    </div>
  );
}
