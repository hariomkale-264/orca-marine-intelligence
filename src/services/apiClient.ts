/**
 * ORCA API Client
 *
 * Supports:
 * 1. Single-domain / Vercel serverless deployments (default: relative /api endpoints)
 * 2. Separate frontend + backend deployments via VITE_API_URL environment variable
 * 3. Graceful handling of non-JSON / HTML error responses (prevents SyntaxError JSON parsing crashes)
 */

const RAW_API_URL = (import.meta.env.VITE_API_URL || '').trim();

/**
 * Returns normalized base API URL without trailing slash.
 */
export function getApiBaseUrl(): string {
  if (!RAW_API_URL) return '';
  return RAW_API_URL.replace(/\/+$/, '');
}

/**
 * Constructs a fully qualified or clean relative URL for the given endpoint.
 */
export function buildApiUrl(endpoint: string): string {
  const base = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return base ? `${base}${cleanEndpoint}` : cleanEndpoint;
}

/**
 * Robust JSON fetcher that will never crash with:
 * "SyntaxError: Unexpected token 'T', 'The page c'... is not valid JSON"
 */
export async function safeFetchJson<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = buildApiUrl(endpoint);
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (err: any) {
    return {
      error: `Network connection error: ${err.message || 'Unable to connect to the server'}. Please check your connection or backend status.`,
    } as unknown as T;
  }

  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const data = await res.json();
      return data;
    } catch {
      return {
        error: `Invalid JSON response received from server (${res.status}).`,
      } as unknown as T;
    }
  }

  // Non-JSON response (e.g. HTML 404/500 from Vercel proxy or static file fallback)
  const text = await res.text();
  const isHtml = text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('The page c');

  if (!res.ok) {
    if (res.status === 404) {
      return {
        error: `API route not found (404) at ${url}. Please ensure the backend is running or Vercel serverless function is configured.`,
      } as unknown as T;
    }

    return {
      error: isHtml
        ? `Server error (${res.status}). Received non-JSON response from server.`
        : (text.slice(0, 160) || `Request failed with status ${res.status}`),
    } as unknown as T;
  }

  // If 200 OK but text/plain
  try {
    return JSON.parse(text);
  } catch {
    return { success: true, message: text } as unknown as T;
  }
}
