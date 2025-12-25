export interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

export interface SpotifyArtist {
  id: string;
  name: string;
  external_urls: { spotify: string };
  images?: SpotifyImage[];
  genres?: string[];
  popularity?: number;
  followers?: { total: number };
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  external_urls: { spotify: string };
  release_date: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  duration_ms: number;
  external_urls: { spotify: string };
  preview_url: string | null;
  is_playing?: boolean;
  progress_ms?: number;
}

export interface TopTracksResponse {
  items: SpotifyTrack[];
  total: number;
  limit: number;
  offset: number;
}

export interface TopArtistsResponse {
  items: SpotifyArtist[];
  total: number;
  limit: number;
  offset: number;
}

export interface RecentlyPlayedItem {
  track: SpotifyTrack;
  played_at: string;
}

export interface RecentlyPlayedResponse {
  items: RecentlyPlayedItem[];
  cursors?: { after: string; before: string };
  limit: number;
}

export interface CurrentlyPlayingResponse {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
  timestamp: number;
  currently_playing_type: 'track' | 'episode' | 'ad' | 'unknown';
}

export interface ApiErrorResponse {
  error: string;
  message: string;
}

export type TimeRange = 'short_term' | 'medium_term' | 'long_term';
