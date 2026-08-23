import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, checkCredentials, makeSessionToken } from '@/lib/adminAuth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { username?: string; password?: string };
    if (!checkCredentials(String(body.username || ''), String(body.password || ''))) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_COOKIE, makeSessionToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}
