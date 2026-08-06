export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
};

export type AuthenticatedUser = {
  id: string;
  displayName: string | null;
  email: string;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_KEY = "epsilon.auth.session";

function config() {
  if (!url || !anonKey) throw new Error("Supabase authentication is not configured.");
  return { url, anonKey };
}

async function request(path: string, body: Record<string, unknown>) {
  const auth = config();
  const response = await fetch(`${auth.url}/auth/v1${path}`, {
    method: "POST",
    headers: { apikey: auth.anonKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.msg || payload.message || "Authentication failed. Please try again.");
  }

  return payload;
}

export async function signIn(email: string, password: string) {
  return request("/token?grant_type=password", { email, password });
}

export async function signUp(name: string, email: string, password: string) {
  const emailRedirectTo =
    typeof window === "undefined"
      ? undefined
      : `${window.location.origin}/auth/callback`;

  return request("/signup", {
    email,
    password,
    data: { display_name: name },
    ...(emailRedirectTo ? { email_redirect_to: emailRedirectTo } : {}),
  });
}

export function saveSession(session: AuthSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;

  const session = window.localStorage.getItem(SESSION_KEY);
  if (!session) return null;

  try {
    return parseSession(JSON.parse(session));
  } catch {
    return null;
  }
}

export function clearSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = getSession();
  if (!session) return null;

  const auth = config();
  const response = await fetch(`${auth.url}/auth/v1/user`, {
    headers: {
      apikey: auth.anonKey,
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) return null;

  const user: unknown = await response.json().catch(() => null);
  if (typeof user !== "object" || user === null) {
    return null;
  }

  const userRecord = user as Record<string, unknown>;
  if (typeof userRecord.email !== "string") return null;
  if (typeof userRecord.id !== "string") return null;

  const metadata =
    typeof userRecord.user_metadata === "object" && userRecord.user_metadata !== null
      ? (userRecord.user_metadata as Record<string, unknown>)
      : null;
  const displayName =
    metadata && typeof metadata.display_name === "string"
      ? metadata.display_name.trim() || null
      : null;

  return { id: userRecord.id, displayName, email: userRecord.email };
}

function parseSession(payload: unknown): AuthSession | null {
  if (typeof payload !== "object" || payload === null) return null;

  const source = "session" in payload ? payload.session : payload;
  if (typeof source !== "object" || source === null) return null;

  const { access_token, refresh_token, expires_at, expires_in } = source as Record<
    string,
    unknown
  >;

  if (typeof access_token !== "string" || typeof refresh_token !== "string") {
    return null;
  }

  const expiresIn =
    typeof expires_in === "number"
      ? expires_in
      : typeof expires_in === "string"
        ? Number(expires_in)
        : undefined;

  const expiresAt =
    typeof expires_at === "number"
      ? expires_at
      : typeof expires_at === "string"
        ? Number(expires_at)
        : expiresIn !== undefined
          ? Math.floor(Date.now() / 1000) + expiresIn
          : undefined;

  if (
    expiresAt !== undefined &&
    (!Number.isFinite(expiresAt) || expiresAt <= Date.now() / 1000)
  ) {
    throw new Error("The authentication link has expired. Please sign in again.");
  }

  return {
    access_token,
    refresh_token,
    ...(expiresAt ? { expires_at: expiresAt } : {}),
  };
}

function hashParams(url: URL) {
  return new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash);
}

export function isEmailConfirmationCallback(url: URL) {
  const params = hashParams(url);
  const type = params.get("type") ?? url.searchParams.get("type");
  return type === "signup" || type === "email";
}

export async function getCallbackSession(url: URL): Promise<AuthSession | null> {
  const params = hashParams(url);
  const error = params.get("error") ?? url.searchParams.get("error");

  if (error) {
    throw new Error(
      params.get("error_description") ??
        url.searchParams.get("error_description") ??
        "Authentication could not be completed. Please try again."
    );
  }

  const directSession = parseSession({
    access_token: params.get("access_token") ?? url.searchParams.get("access_token"),
    refresh_token: params.get("refresh_token") ?? url.searchParams.get("refresh_token"),
    expires_at: params.get("expires_at") ?? url.searchParams.get("expires_at"),
    expires_in: params.get("expires_in") ?? url.searchParams.get("expires_in"),
  });

  if (directSession) return directSession;

  const tokenHash = params.get("token_hash") ?? url.searchParams.get("token_hash");
  const type = params.get("type") ?? url.searchParams.get("type");

  if (!tokenHash || !type) return null;

  return parseSession(await request("/verify", { token_hash: tokenHash, type }));
}

export function googleSignInUrl(origin: string) {
  const auth = config();
  return `${auth.url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(`${origin}/auth/callback`)}`;
}
