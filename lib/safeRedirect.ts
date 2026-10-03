// Only same-site paths may be used as a post-login redirect. Browsers treat "/\evil.com"
// like "//evil.com", so the path is resolved against this origin instead of string-checked.
export function safeRedirectPath(target?: string | null): string | null {
  if (!target || typeof window === 'undefined') return null;
  if (!target.startsWith('/') || target.includes('\\')) return null;
  try {
    const url = new URL(target, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (url.pathname.startsWith('/auth/')) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
