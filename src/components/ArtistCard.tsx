import { SpotifyArtist } from '@/types';

interface ArtistCardProps {
  artist: SpotifyArtist;
  rank?: number;
}

export default function ArtistCard({ artist, rank }: ArtistCardProps) {
  const artistImage = artist.images?.[0]?.url;

  return (
    <div className="flex items-center space-x-4 p-4 bg-spotify-darkgray rounded-lg hover:bg-spotify-gray transition-colors">
      {rank !== undefined && (
        <span className="text-2xl font-bold text-spotify-lightgray w-8">{rank}</span>
      )}
      {artistImage && (
        <img
          src={artistImage}
          alt={artist.name}
          className="w-16 h-16 rounded-full shadow-lg object-cover"
        />
      )}
      <div className="flex-1 min-w-0">
        <a
          href={artist.external_urls.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white font-medium hover:underline truncate block"
        >
          {artist.name}
        </a>
        <p className="text-spotify-lightgray text-sm truncate capitalize">
          {artist.genres?.slice(0, 3).join(', ') || 'No genres'}
        </p>
      </div>
      {artist.popularity !== undefined && (
        <div className="text-right">
          <span className="text-spotify-green text-sm font-medium">{artist.popularity}%</span>
          <p className="text-spotify-lightgray text-xs">popularity</p>
        </div>
      )}
    </div>
  );
}
