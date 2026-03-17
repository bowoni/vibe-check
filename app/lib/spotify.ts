import { NextRequest, NextResponse } from 'next/server';

/**
 * Spotify API 호출 시 재시도 로직이 포함된 fetch.
 * 429(Rate Limit), 500, 502, 503 에러 시 최대 2회 재시도.
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    lastResponse = res;

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('Retry-After') || '1', 10);
      await new Promise((r) => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (res.status >= 500 && attempt < maxRetries) {
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      continue;
    }

    return res;
  }

  return lastResponse!;
}

interface TokenResult {
  accessToken: string;
  refreshed: boolean;
  expiresIn?: number;
  newRefreshToken?: string;
}

/**
 * access token 쿠키가 만료되었으면 refresh token으로 자동 갱신.
 * 둘 다 없으면 null 반환.
 */
export async function getValidAccessToken(req: NextRequest): Promise<TokenResult | null> {
  const accessToken = req.cookies.get('spotify_access_token')?.value;
  if (accessToken) {
    return { accessToken, refreshed: false };
  }

  const refreshToken = req.cookies.get('spotify_refresh_token')?.value;
  if (!refreshToken) return null;

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;

  const tokens = await res.json();
  return {
    accessToken: tokens.access_token,
    refreshed: true,
    expiresIn: tokens.expires_in,
    newRefreshToken: tokens.refresh_token,
  };
}

/**
 * 토큰이 갱신된 경우 응답에 새 쿠키를 설정.
 */
export function applyTokenCookies(response: NextResponse, token: TokenResult) {
  if (!token.refreshed) return;

  response.cookies.set('spotify_access_token', token.accessToken, {
    httpOnly: true,
    maxAge: token.expiresIn || 3600,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  if (token.newRefreshToken) {
    response.cookies.set('spotify_refresh_token', token.newRefreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }
}
