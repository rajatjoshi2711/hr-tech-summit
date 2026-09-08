import { NextResponse } from 'next/server';
import { PIN_COOKIE, getPin, pinToken } from '@/lib/pin';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/** A wrong PIN costs a beat, which takes the shine off guessing at it. */
const WRONG_PIN_DELAY_MS = 400;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const pin = typeof (body as { pin?: unknown }).pin === 'string' ? (body as { pin: string }).pin : '';

  if (pin !== getPin()) {
    await new Promise((resolve) => setTimeout(resolve, WRONG_PIN_DELAY_MS));
    return NextResponse.json({ error: 'wrong_pin' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: PIN_COOKIE,
    value: await pinToken(pin),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12,
  });
  return response;
}
