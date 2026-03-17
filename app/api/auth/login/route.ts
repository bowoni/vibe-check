import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: 'Spotify credentials not configured' }, { status: 500 });
  }

  const state = Math.random().toString(36).substring(2, 15);

  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    state,
    scope: scopes,
    show_dialog: 'true',
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set('spotify_auth_state', state, {
    httpOnly: true,
    maxAge: 600,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  return response;
}
