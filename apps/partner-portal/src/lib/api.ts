const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const TOKEN_KEY = 'partner_token';

export const auth = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const token = auth.getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && !path.startsWith('/referrals/partner-login')) {
    auth.clear();
    if (typeof window !== 'undefined') window.location.href = '/';
  }
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(' ') : body?.message;
    throw new Error(message || 'Request failed');
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data || {}) }),
  patch: <T>(path: string, data: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(data) }),
};

export function naira(value?: number | null) {
  return `₦${Number(value || 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export function statusLabel(status?: string) {
  if (status === 'awaiting_checks') return 'Awaiting checks';
  if (status === 'needs_review') return 'Needs review';
  if (status === 'approved') return 'Approved';
  if (status === 'paid') return 'Paid';
  if (status === 'reversed') return 'Reversed';
  if (status === 'in_progress') return 'Project in progress';
  if (status === 'enquiry') return 'Project enquiry';
  if (status === 'completed') return 'Completed project';
  if (status === 'registered') return 'Registered';
  return status || '—';
}
