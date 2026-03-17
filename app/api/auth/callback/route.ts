import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const storedState = req.cookies.get('spotify_auth_state')?.value;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  if (error) {
    return NextResponse.redirect(`${appUrl}/?error=access_denied`);
  }

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(`${appUrl}/?error=state_mismatch`);
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(`${appUrl}/?error=token_failed`);
  }

  const tokens = await tokenResponse.json();

  const response = new NextResponse(null, {
    status: 302,
    headers: { Location: appUrl },
  });

  response.cookies.set('spotify_access_token', tokens.access_token, {
    httpOnly: true,
    maxAge: tokens.expires_in,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  if (tokens.refresh_token) {
    response.cookies.set('spotify_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  response.cookies.delete('spotify_auth_state');

  return response;
}
