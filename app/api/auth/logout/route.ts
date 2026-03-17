import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = NextResponse.redirect(appUrl);

  response.cookies.delete('spotify_access_token');
  response.cookies.delete('spotify_refresh_token');
  response.cookies.delete('spotify_auth_state');

  return response;
}
