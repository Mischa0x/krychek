import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { getCurrentlyPlaying } from '@/lib/spotify';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimitResult = rateLimit(`spotify-now-${ip}`, { windowMs: 10000, maxRequests: 6 });
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
  try {
    const data = await getCurrentlyPlaying(session.accessToken);
    return NextResponse.json(data || { is_playing: false });
  } catch (error: any) {
    console.error('Spotify API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch data' },
      { status: error.status || 500 }
    );
  }
}
