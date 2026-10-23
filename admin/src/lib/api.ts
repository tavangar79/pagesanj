// JSON client for /admin/api/*. Sends the session cookie and the CSRF token on writes (PRD §9).
let csrfToken: string | null = null;

export function setCsrfToken(token: string) {
  csrfToken = token;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (method !== 'GET' && csrfToken) headers.set('X-CSRF-Token', csrfToken);

  const res = await fetch(`/admin/api${path}`, { ...init, headers, credentials: 'same-origin' });
  if (!res.ok) throw new Error(`API ${method} ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}
