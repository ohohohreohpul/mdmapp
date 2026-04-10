/**
 * apiCache — simple module-level memory cache for GET requests.
 *
 * Because Next.js App Router keeps layouts mounted during client-side
 * navigation, this Map persists across page switches. Tab pages that
 * previously showed a full loading spinner on every visit can now
 * show stale data instantly and refresh silently in the background.
 *
 * TTL: 60 s (cache entries older than this are treated as stale and
 * re-fetched in the background, but stale data is still shown immediately).
 */
import axios from 'axios';

interface Entry { data: any; ts: number; }

const cache = new Map<string, Entry>();
const TTL = 60_000; // 1 minute

/** Return cached value synchronously (undefined if missing or expired) */
export function getCached(url: string): any | undefined {
  const e = cache.get(url);
  return e ? e.data : undefined; // always return stale data — caller decides
}

/** True only if cached AND fresh */
export function isFresh(url: string): boolean {
  const e = cache.get(url);
  return !!e && Date.now() - e.ts < TTL;
}

/** Store a value */
export function setCached(url: string, data: any) {
  cache.set(url, { data, ts: Date.now() });
}

/**
 * Fetch with stale-while-revalidate:
 * - If a cached value exists (even stale) → return it immediately AND
 *   kick off a background refresh.
 * - If no cache → fetch normally and await.
 */
export async function cachedGet(url: string): Promise<any> {
  const entry = cache.get(url);

  if (entry) {
    // Return stale data right away
    const stale = entry.data;
    // Refresh in background if entry is old
    if (Date.now() - entry.ts >= TTL) {
      axios.get(url).then(r => setCached(url, r.data)).catch(() => {});
    }
    return stale;
  }

  // Cold miss — fetch and cache
  const res = await axios.get(url);
  setCached(url, res.data);
  return res.data;
}

/** Drop all entries whose key starts with the given prefix */
export function invalidate(urlPrefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(urlPrefix)) cache.delete(key);
  }
}
