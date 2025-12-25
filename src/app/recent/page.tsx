'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TrackCard from '@/components/TrackCard';
import Loading from '@/components/Loading';
import { SpotifyTrack } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface PlayHistoryItem {
  track: SpotifyTrack;
  played_at: string;
}

export default function RecentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<PlayHistoryItem[]>([]);
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
        const res = await fetch('/api/spotify/recent?limit=50');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setItems(data.items || []);
      } catch (err) {
        setError('Failed to load recently played');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  if (status === 'loading') return <Loading />;
  if (!session) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Recently Played</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? (
        <Loading />
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <TrackCard
              key={item.track.id + '-' + i}
              track={item.track}
              showPlayedAt={formatRelativeTime(item.played_at)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
