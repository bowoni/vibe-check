import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken, applyTokenCookies, fetchWithRetry } from '@/app/lib/spotify';

const moodKeywords: Record<string, string> = {
  '우울함': 'sad melancholic heartbreak emotional',
  '신남': 'energetic upbeat party dance',
  '나른함': 'lofi chill relax study',
  '화남': 'angry intense aggressive rock',
  '설렘': 'romantic hopeful love exciting',
  '평온함': 'peaceful calm ambient serene',
};

const weatherKeywords: Record<string, string> = {
  '맑음': 'sunny bright happy summer',
  '비': 'rain rainy cozy melancholy',
  '흐림': 'cloudy grey moody atmospheric',
  '눈': 'winter snow acoustic cozy',
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

  const moodQuery = moodKeywords[mood] || mood;
  const weatherQuery = weatherKeywords[weather] || weather;
  const combinedQuery = `${weatherQuery} ${moodQuery.split(' ')[0]}`;

  const headers = { Authorization: `Bearer ${token.accessToken}` };

  try {
    const [moodRes, combinedRes] = await Promise.all([
      fetchWithRetry(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(moodQuery)}&type=playlist&limit=6&market=KR`,
        { headers }
      ),
      fetchWithRetry(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(combinedQuery)}&type=playlist&limit=6&market=KR`,
        { headers }
      ),
    ]);

    if (moodRes.status === 401 || combinedRes.status === 401) {
      return NextResponse.json(
        { error: 'token_expired', message: '세션이 만료되었어요' },
        { status: 401 }
      );
    }

    if (moodRes.status === 429 || combinedRes.status === 429) {
      return NextResponse.json(
        { error: 'rate_limit', message: '요청이 너무 많아요. 잠시 후 다시 시도해주세요' },
        { status: 429 }
      );
    }

    if (!moodRes.ok && !combinedRes.ok) {
      return NextResponse.json(
        { error: 'spotify_error', message: 'Spotify 서비스에 문제가 생겼어요' },
        { status: 502 }
      );
    }

    const [moodData, combinedData] = await Promise.all([
      moodRes.ok ? moodRes.json() : { playlists: { items: [] } },
      combinedRes.ok ? combinedRes.json() : { playlists: { items: [] } },
    ]);

    const moodPlaylists = (moodData.playlists?.items || []).filter(Boolean);
    const combinedPlaylists = (combinedData.playlists?.items || []).filter(Boolean);

    const seenIds = new Set<string>();
    const merged = [];

    for (const playlist of [...combinedPlaylists, ...moodPlaylists]) {
      if (!seenIds.has(playlist.id)) {
        seenIds.add(playlist.id);
        merged.push(playlist);
      }
      if (merged.length >= 10) break;
    }

    const response = NextResponse.json({ playlists: merged });
    applyTokenCookies(response, token);
    return response;
  } catch {
    return NextResponse.json(
      { error: 'network_error', message: '네트워크 연결을 확인해주세요' },
      { status: 503 }
    );
  }
}
