'use client';

const TOKEN_KEY = 'mc_access_token';
const REFRESH_KEY = 'mc_refresh_token';
const ADMIN_KEY = 'mc_admin';
const LAST_ACTIVE_KEY = 'mc_last_active';

export const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  updateLastActive(); // stamp activity on login
}

export function saveAdmin(admin: object) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
}

export function getAdmin() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(ADMIN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(LAST_ACTIVE_KEY);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

/** Call this on every user interaction to keep the session alive. */
export function updateLastActive(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

/**
 * Returns true if the stored last-active timestamp is older than
 * IDLE_TIMEOUT_MS, or if no timestamp exists at all.
 */
export function isSessionExpired(): boolean {
  if (typeof window === 'undefined') return false;
  const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);
  if (!lastActive) return true;
  return Date.now() - parseInt(lastActive, 10) > IDLE_TIMEOUT_MS;
}