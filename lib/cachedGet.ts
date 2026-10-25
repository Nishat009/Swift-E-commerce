import apiClient from './apiClient';

/**
 * Shared, cached GET for public data many components need on every page (categories, hero slides,
 * languages, currencies):
 * - parallel calls for the same URL share one request
 * - a fresh answer is reused for `maxAge` while browsing (no refetch on every page change)
 * - the last answer is kept in localStorage, so a repeat visit can draw the navbar / footer at once
 *   with `peekCached`, even while a sleeping backend is waking up
 * Admin screens keep calling apiClient directly and call `invalidateCached` after they change data.
 */

type Entry = { at: number; body: unknown };

const memory = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
const STORAGE_PREFIX = 'swiftcart:cache:';

const readStored = (url: string): Entry | undefined => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + url);
    return raw ? (JSON.parse(raw) as Entry) : undefined;
  } catch {
    return undefined;
  }
};

const writeStored = (url: string, entry: Entry) => {
  try {
    localStorage.setItem(STORAGE_PREFIX + url, JSON.stringify(entry));
  } catch {
    /* storage full or blocked: the memory cache still works */
  }
};

/** The last known response body for `url` (memory, then localStorage), without a request. Client only. */
export function peekCached<T = any>(url: string): T | undefined {
  if (typeof window === 'undefined') return undefined;
  const hit = memory.get(url) || readStored(url);
  return hit?.body as T | undefined;
}

/** GET `url` and resolve with the response body (`res.data`), sharing and caching as described above. */
export function cachedGet<T = any>(url: string, { maxAge = 60_000 }: { maxAge?: number } = {}): Promise<T> {
  const hit = memory.get(url);
  if (hit && Date.now() - hit.at < maxAge) return Promise.resolve(hit.body as T);
  const pending = inflight.get(url);
  if (pending) return pending as Promise<T>;

  const request = apiClient
    .get(url)
    .then((res) => {
      const entry = { at: Date.now(), body: res.data };
      memory.set(url, entry);
      if (res.data?.success !== false) writeStored(url, entry);
      return res.data as T;
    })
    .finally(() => inflight.delete(url));
  inflight.set(url, request);
  return request;
}

// Any successful change to cached data (an admin editing categories, hero slides, currencies or
// languages) drops the cached copy, so the next read is fresh
const CACHED_ROOTS = ['/categories', '/hero', '/currencies', '/languages'];
apiClient.interceptors.response.use((res) => {
  const method = (res.config?.method || 'get').toLowerCase();
  const url = res.config?.url || '';
  if (method !== 'get') {
    const root = CACHED_ROOTS.find((r) => url === r || url.startsWith(`${r}/`) || url.startsWith(`${r}?`));
    if (root) invalidateCached(root);
  }
  return res;
});

/** Forget cached answers whose URL starts with `prefix` (call after an admin changes that data). */
export function invalidateCached(prefix: string) {
  for (const key of [...memory.keys()]) if (key.startsWith(prefix)) memory.delete(key);
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX + prefix)) localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
