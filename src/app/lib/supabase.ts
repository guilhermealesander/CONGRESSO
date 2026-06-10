const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

const AUTH_STORAGE_KEY = "arena-cju:supabase-session";

export type SupabaseAuthUser = {
  id: string;
  email?: string;
};

export type SupabaseAuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  user: SupabaseAuthUser;
};

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getStoredAuthSession(): SupabaseAuthSession | null {
  if (!canUseLocalStorage()) {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) as SupabaseAuthSession : null;
  } catch {
    return null;
  }
}

function storeAuthSession(session: SupabaseAuthSession | null) {
  if (!canUseLocalStorage()) {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!response.ok) {
    throw new Error(text || `Supabase request failed with status ${response.status}`);
  }

  if (!text) {
    return null as T;
  }

  return JSON.parse(text) as T;
}

function getAccessToken() {
  return getStoredAuthSession()?.access_token ?? supabaseAnonKey;
}

function getHeaders() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase nao configurado");
  }

  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${getAccessToken()}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function buildRestUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${supabaseUrl}/rest/v1${normalizedPath}`;
}

function buildAuthUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${supabaseUrl}/auth/v1${normalizedPath}`;
}

function mapAuthResponse(payload: any): SupabaseAuthSession {
  const expiresIn = typeof payload.expires_in === "number" ? payload.expires_in : 3600;

  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    user: {
      id: payload.user?.id,
      email: payload.user?.email,
    },
  };
}

export async function supabaseSignIn(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase nao configurado");
  }

  const response = await fetch(buildAuthUrl("/token?grant_type=password"), {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const session = mapAuthResponse(await parseResponse<any>(response));
  storeAuthSession(session);
  return session;
}

export async function supabaseRefreshSession() {
  const current = getStoredAuthSession();

  if (!current?.refresh_token || !isSupabaseConfigured()) {
    return null;
  }

  const response = await fetch(buildAuthUrl("/token?grant_type=refresh_token"), {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: current.refresh_token }),
  });

  const session = mapAuthResponse(await parseResponse<any>(response));
  storeAuthSession(session);
  return session;
}

export async function supabaseSignOut() {
  const session = getStoredAuthSession();

  if (session && isSupabaseConfigured()) {
    await fetch(buildAuthUrl("/logout"), {
      method: "POST",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`,
      },
    }).catch(() => undefined);
  }

  storeAuthSession(null);
}

export async function supabaseSelect<T>(path: string): Promise<T> {
  const response = await fetch(buildRestUrl(path), {
    method: "GET",
    headers: getHeaders(),
  });

  return parseResponse<T>(response);
}

export async function supabaseInsert<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildRestUrl(path), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function supabaseUpdate<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildRestUrl(path), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function supabaseDelete<T>(path: string): Promise<T> {
  const response = await fetch(buildRestUrl(path), {
    method: "DELETE",
    headers: getHeaders(),
  });

  return parseResponse<T>(response);
}

export async function supabaseRpc<T>(name: string, body: unknown): Promise<T> {
  const response = await fetch(buildRestUrl(`/rpc/${name}`), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}
