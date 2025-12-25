import { SpotifyTrack } from '@/types';
import { formatDuration } from '@/lib/utils';

interface TrackCardProps {
  track: SpotifyTrack;
  rank?: number;
  showPlayedAt?: string;
}

export default function TrackCard({ track, rank, showPlayedAt }: TrackCardProps) {
  const albumImage = track.album.images[0]?.url;

  return (
    <div className="flex items-center space-x-4 p-4 bg-spotify-darkgray rounded-lg hover:bg-spotify-gray transition-colors">
      {rank !== undefined && (
        <span className="text-2xl font-bold text-spotify-lightgray w-8">{rank}</span>
      )}
      {albumImage && (
        <img
          src={albumImage}
          alt={track.album.name}
          className="w-16 h-16 rounded shadow-lg"
        />
      )}
      <div className="flex-1 min-w-0">
        <a
          href={track.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white font-medium hover:underline truncate block"
        >
          {track.name}
        </a>
        <p className="text-spotify-lightgray text-sm truncate">
          {track.artists.map((a) => a.name).join(', ')}
        </p>
        {showPlayedAt && (
          <p className="text-spotify-lightgray text-xs mt-1">{showPlayedAt}</p>
        )}
      </div>
      <span className="text-spotify-lightgray text-sm">{formatDuration(track.duration_ms)}</span>
    </div>
  );
}
