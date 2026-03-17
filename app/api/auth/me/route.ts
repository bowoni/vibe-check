import { NextRequest, NextResponse } from 'next/server';
import { getValidAccessToken, applyTokenCookies } from '@/app/lib/spotify';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const token = await getValidAccessToken(req);

  if (!token) {
    return NextResponse.json({ user: null }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token.accessToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ user: null }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  const user = await res.json();
  const response = NextResponse.json(
    {
      user: {
        id: user.id,
        name: user.display_name,
        email: user.email,
        image: user.images?.[0]?.url || null,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );

  applyTokenCookies(response, token);
  return response;
}
