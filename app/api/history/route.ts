import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabase';
import { getValidAccessToken, applyTokenCookies } from '@/app/lib/spotify';

async function getSpotifyUserId(accessToken: string): Promise<string | null> {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user.id;
}

export async function GET(req: NextRequest) {
  const token = await getValidAccessToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getSpotifyUserId(token.accessToken);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('mood_history')
    .select('*')
    .eq('spotify_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const history = (data || []).map((row) => ({
    id: row.id,
    mood: row.mood,
    emoji: row.emoji,
    weather: row.weather,
    weatherEmoji: row.weather_emoji,
    trackCount: row.track_count,
    createdAt: row.created_at,
  }));

  const response = NextResponse.json({ history });
  applyTokenCookies(response, token);
  return response;
}

export async function POST(req: NextRequest) {
  const token = await getValidAccessToken(req);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = await getSpotifyUserId(token.accessToken);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();

  const { error } = await supabase.from('mood_history').insert({
    spotify_user_id: userId,
    mood: body.mood,
    emoji: body.emoji,
    weather: body.weather,
    weather_emoji: body.weatherEmoji,
    track_count: body.trackCount,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = NextResponse.json({ success: true });
  applyTokenCookies(response, token);
  return response;
}
