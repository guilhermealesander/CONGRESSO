const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

function getHeaders() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase nao configurado");
  }

  return {
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
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

function buildUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${supabaseUrl}/rest/v1${normalizedPath}`;
}

export async function supabaseSelect<T>(path: string): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "GET",
    headers: getHeaders(),
  });

  return parseResponse<T>(response);
}

export async function supabaseInsert<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function supabaseUpdate<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

export async function supabaseRpc<T>(name: string, body: unknown): Promise<T> {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}
