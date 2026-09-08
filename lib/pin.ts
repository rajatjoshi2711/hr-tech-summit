/** Shared PIN gate helpers. Used by the middleware, the verify route, and the page. */

export const PIN_COOKIE = 'hrts_pin';
export const PIN_LENGTH = 6;

/** The PIN. Override it per environment with ACCESS_PIN; 111111 is the default. */
export function getPin(): string {
  const pin = process.env.ACCESS_PIN?.trim();
  return pin && pin.length > 0 ? pin : '111111';
}

/**
 * The cookie carries a hash of the PIN, not the PIN itself, so a leaked cookie
 * does not hand over the code. Web Crypto keeps this usable on the edge runtime.
 */
export async function pinToken(pin: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`hrts:${pin}`));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** Constant-time compare, so a wrong PIN does not leak how much of it matched. */
export function sameToken(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
