import { env } from "@/lib/env";

type OAuthIntent = "login" | "link";

interface OAuthState {
  intent: OAuthIntent;
  nonce: string;
  userId?: string;
}

function toEncoded(value: string) {
  return encodeURIComponent(value);
}

function fromEncoded(value: string) {
  return decodeURIComponent(value);
}

export function createOAuthState(input: { intent: OAuthIntent; userId?: string }) {
  const payload: OAuthState = {
    intent: input.intent,
    userId: input.userId,
    nonce: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  };
  return toEncoded(JSON.stringify(payload));
}

export function parseOAuthState(state: string | null): OAuthState {
  if (!state) {
    throw new Error("Missing state");
  }

  const parsed = JSON.parse(fromEncoded(state)) as OAuthState;
  if (!parsed.intent || !parsed.nonce) {
    throw new Error("Invalid state payload");
  }

  return parsed;
}

export function buildOAuthAuthorizeUrl(state: string) {
  if (!env.CHATGPT_OAUTH_CLIENT_ID || !env.CHATGPT_OAUTH_REDIRECT_URI) {
    throw new Error("OpenAI OAuth is not configured");
  }

  const url = new URL(env.CHATGPT_OAUTH_AUTHORIZE_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", env.CHATGPT_OAUTH_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.CHATGPT_OAUTH_REDIRECT_URI);
  url.searchParams.set("scope", "openid profile email model.read model.request offline_access");
  url.searchParams.set("state", state);
  return url.toString();
}

interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export async function exchangeOAuthCode(code: string): Promise<OAuthTokenResponse> {
  if (!env.CHATGPT_OAUTH_CLIENT_ID || !env.CHATGPT_OAUTH_CLIENT_SECRET || !env.CHATGPT_OAUTH_REDIRECT_URI) {
    throw new Error("OpenAI OAuth is not configured");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: env.CHATGPT_OAUTH_CLIENT_ID,
    client_secret: env.CHATGPT_OAUTH_CLIENT_SECRET,
    redirect_uri: env.CHATGPT_OAUTH_REDIRECT_URI,
  });

  const res = await fetch(env.CHATGPT_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status})`);
  }

  const payload = (await res.json()) as OAuthTokenResponse;
  if (!payload.access_token) {
    throw new Error("Token exchange failed: missing access_token");
  }

  return payload;
}

interface OAuthUserInfo {
  id: string;
  email?: string;
  name?: string;
}

export async function fetchOAuthUserInfo(accessToken: string): Promise<OAuthUserInfo> {
  const res = await fetch(env.CHATGPT_OAUTH_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch OpenAI user profile (${res.status})`);
  }

  const raw = (await res.json()) as Record<string, unknown>;
  const id = typeof raw.id === "string" ? raw.id : typeof raw.sub === "string" ? raw.sub : "";
  const email = typeof raw.email === "string" ? raw.email : undefined;
  const name = typeof raw.name === "string" ? raw.name : undefined;

  if (!id) {
    throw new Error("OpenAI profile missing user id");
  }

  return { id, email, name };
}
