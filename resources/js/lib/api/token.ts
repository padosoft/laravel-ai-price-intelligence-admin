// Bearer-token storage for headless / cross-domain deployments (auth.mode === 'bearer').
// In the default cookie (Sanctum SPA) mode this is unused. localStorage access is guarded
// since it can throw in privacy modes.

const TOKEN_KEY = 'pi-admin-token';

export function getBearerToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setBearerToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore persistence failures */
  }
}

export function clearBearerToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}
