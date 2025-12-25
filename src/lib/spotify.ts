import {
  TopTracksResponse,
  TopArtistsResponse,
  RecentlyPlayedResponse,
  CurrentlyPlayingResponse,
  TimeRange,
} from '@/types';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

class SpotifyApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'SpotifyApiError';
  }
}

async function spotifyFetch<T>(endpoint: string, accessToken: string): Promise<T> {
  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 60 },
  });
  if (!response.ok) {
    if (response.status === 204) return null as T;
    throw new SpotifyApiError(`Spotify API error: ${response.statusText}`, response.status);
  }
  const text = await response.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export async function getTopTracks(
  accessToken: string,
  timeRange: TimeRange = 'medium_term',
  limit: number = 20
): Promise<TopTracksResponse> {
  return spotifyFetch<TopTracksResponse>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
    accessToken
  );
}

export async function getTopArtists(
  accessToken: string,
  timeRange: TimeRange = 'medium_term',
  limit: number = 20
): Promise<TopArtistsResponse> {
  return spotifyFetch<TopArtistsResponse>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`,
    accessToken
  );
}

export async function getRecentlyPlayed(
  accessToken: string,
  limit: number = 20
): Promise<RecentlyPlayedResponse> {
  return spotifyFetch<RecentlyPlayedResponse>(
    `/me/player/recently-played?limit=${limit}`,
    accessToken
  );
}

export async function getCurrentlyPlaying(
  accessToken: string
): Promise<CurrentlyPlayingResponse | null> {
  return spotifyFetch<CurrentlyPlayingResponse | null>(
    '/me/player/currently-playing',
    accessToken
  );
}

export { SpotifyApiError };
