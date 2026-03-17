import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken, applyTokenCookies, fetchWithRetry } from '@/app/lib/spotify';

const moodKeywords: Record<string, string[]> = {
  '우울함': ['sad songs', 'melancholic', 'heartbreak ballad', 'emotional'],
  '신남': ['upbeat hits', 'dance party', 'energetic pop', 'feel good'],
  '나른함': ['lofi chill', 'relaxing', 'lazy afternoon', 'study beats'],
  '화남': ['aggressive rock', 'intense', 'angry playlist', 'hard rock'],
  '설렘': ['romantic', 'love songs', 'exciting pop', 'crush playlist'],
  '평온함': ['peaceful', 'calm acoustic', 'serene ambient', 'meditation'],
};

const weatherKeywords: Record<string, string[]> = {
  '맑음': ['sunny day', 'summer vibes'],
  '비': ['rainy day', 'rain mood'],
  '흐림': ['cloudy mood', 'grey sky'],
  '눈': ['winter cozy', 'snow day'],
};

export async function GET(req: NextRequest) {
  const token = await getValidAccessToken(req);
  if (!token) {
    return NextResponse.json(
      { error: 'unauthorized', message: '로그인이 필요해요' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const mood = searchParams.get('mood') || '';
  const weather = searchParams.get('weather') || '';

  const headers = { Authorization: `Bearer ${token.accessToken}` };

  // 사용자 Top Artists 가져오기 (개인화용)
  let topArtistName = '';
  try {
    const topRes = await fetchWithRetry(
      'https://api.spotify.com/v1/me/top/artists?limit=3&time_range=short_term',
      { headers }
    );
    if (topRes.ok) {
      const topData = await topRes.json();
      const artists = topData.items || [];
      if (artists.length > 0) {
        topArtistName = artists[Math.floor(Math.random() * artists.length)].name;
      }
    }
  } catch {
    // 폴백: Top Artists 없이 진행
  }

  const moodWords = moodKeywords[mood] || ['music'];
  const weatherWords = weatherKeywords[weather] || ['playlist'];

  const queries: string[] = [
    moodWords[Math.floor(Math.random() * moodWords.length)],
    `${weatherWords[0]} ${moodWords[0].split(' ')[0]}`,
  ];

  if (topArtistName) {
    queries.push(`${topArtistName} ${moodWords[0].split(' ')[0]}`);
  }

  try {
    const fetchTracks = (query: string) =>
      fetchWithRetry(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=10&market=KR`,
        { headers }
      ).then((res) => (res.ok ? res.json() : { tracks: { items: [] } }));

    const results = await Promise.all(queries.map(fetchTracks));

    const seenIds = new Set<string>();
    const merged = [];

    for (const result of results) {
      const items = result.tracks?.items || [];
      for (const track of items) {
        if (track && !seenIds.has(track.id)) {
          seenIds.add(track.id);
          merged.push(track);
        }
      }
    }

    const response = NextResponse.json({ tracks: merged.slice(0, 15) });
    applyTokenCookies(response, token);
    return response;
  } catch {
    return NextResponse.json(
      { error: 'network_error', message: '네트워크 연결을 확인해주세요' },
      { status: 503 }
    );
  }
}
