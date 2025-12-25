import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getTopTracks, getTopArtists } from '@/lib/spotify';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { TimeRange } from '@/types';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimitResult = rateLimit(`spotify-top-${ip}`);
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
    );
  }
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.error === 'RefreshAccessTokenError') {
    return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'tracks';
  const timeRange = (searchParams.get('time_range') || 'medium_term') as TimeRange;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  try {
    const data = type === 'artists'
      ? await getTopArtists(session.accessToken, timeRange, limit)
      : await getTopTracks(session.accessToken, timeRange, limit);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: error.status || 500 }
    );
  }
}
