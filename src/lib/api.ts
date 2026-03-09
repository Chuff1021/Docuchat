import { clientEnv } from "@/lib/env-client";
import type {
  AnalyticsOverview,
  Bot,
  BotAnalytics,
  BotCreate,
  ChatResponse,
  Document,
  IngestionJob,
  OAuthAuthorizeResponse,
  OAuthStatus,
  Organization,
  TokenResponse,
  User,
  WidgetToken,
} from "@/types";

const API_BASE = clientEnv.NEXT_PUBLIC_API_BASE;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, payload?.error || "Request failed", payload);
  }
  return payload as T;
}

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    full_name?: string;
    organization_name: string;
  }) => request<TokenResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<TokenResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: (token: string) => request<User>("/auth/me", {}, token),

  myOrganizations: (token: string) => request<Organization[]>("/auth/organizations", {}, token),

  oauthOpenAIUrl: (intent: "login" | "link", token?: string) =>
    request<OAuthAuthorizeResponse>(`/auth/oauth/openai?intent=${intent}`, {}, token),

  oauthOpenAIStatus: (token: string) => request<OAuthStatus>("/auth/oauth/openai/status", {}, token),

  unlinkOpenAI: (token: string) => request<{ success: boolean }>("/auth/oauth/openai/unlink", { method: "DELETE" }, token),

  oauthFinalizeSession: async (accessToken: string, refreshToken: string): Promise<TokenResponse> => {
    const user = await request<User>("/auth/me", {}, accessToken);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "bearer",
      expires_in: 3600,
      user,
    };
  },
};

export const botsApi = {
  list: (orgId: string, token: string) =>
    request<{ bots: Bot[]; total: number }>(`/organizations/${orgId}/bots`, {}, token),

  create: (orgId: string, data: BotCreate, token: string) =>
    request<Bot>(`/organizations/${orgId}/bots`, { method: "POST", body: JSON.stringify(data) }, token),

  get: (orgId: string, botId: string, token: string) =>
    request<Bot>(`/organizations/${orgId}/bots/${botId}`, {}, token),

  update: (orgId: string, botId: string, data: Partial<BotCreate>, token: string) =>
    request<Bot>(`/organizations/${orgId}/bots/${botId}`, { method: "PATCH", body: JSON.stringify(data) }, token),

  delete: (orgId: string, botId: string, token: string) =>
    request<void>(`/organizations/${orgId}/bots/${botId}`, { method: "DELETE" }, token),

  getWidgetTokens: (orgId: string, botId: string, token: string) =>
    request<WidgetToken[]>(`/organizations/${orgId}/bots/${botId}/widget-tokens`, {}, token),

  createWidgetToken: (orgId: string, botId: string, token: string) =>
    request<WidgetToken>(`/organizations/${orgId}/bots/${botId}/widget-tokens`, { method: "POST" }, token),
};

export const documentsApi = {
  list: (orgId: string, botId: string, token: string) =>
    request<{ documents: Document[]; total: number }>(
      `/organizations/${orgId}/bots/${botId}/documents`,
      {},
      token
    ),

  upload: async (orgId: string, botId: string, file: File, token: string) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<Document>(
      `/organizations/${orgId}/bots/${botId}/documents`,
      { method: "POST", body: formData },
      token
    );
  },

  importUrls: (
    orgId: string,
    botId: string,
    urls: string[],
    token: string
  ) =>
    request<{ documents: Document[]; total: number }>(
      `/organizations/${orgId}/bots/${botId}/documents/import-urls`,
      { method: "POST", body: JSON.stringify({ urls }) },
      token
    ),

  delete: (orgId: string, botId: string, docId: string, token: string) =>
    request<void>(`/organizations/${orgId}/bots/${botId}/documents/${docId}`, { method: "DELETE" }, token),

  reprocess: (orgId: string, botId: string, docId: string, token: string) =>
    request<IngestionJob>(
      `/organizations/${orgId}/bots/${botId}/documents/${docId}/reprocess`,
      { method: "POST" },
      token
    ),

  getJobs: async () => [],
  listAllJobs: async () => [],
};

export const chatApi = {
  send: (orgId: string, botId: string, data: { message: string; session_token?: string }, token: string) =>
    request<ChatResponse>(`/organizations/${orgId}/bots/${botId}/chat`, { method: "POST", body: JSON.stringify(data) }, token),
};

export const analyticsApi = {
  overview: (orgId: string, token: string) =>
    request<AnalyticsOverview>(`/organizations/${orgId}/analytics/overview`, {}, token),

  botAnalytics: async (orgId: string, botId: string, token: string): Promise<BotAnalytics> => {
    const [bot, docs] = await Promise.all([
      botsApi.get(orgId, botId, token),
      documentsApi.list(orgId, botId, token),
    ]);

    return {
      bot_id: botId,
      bot_name: bot.name,
      chats_today: 0,
      chats_total: 0,
      docs_count: docs.total,
      chunks_count: docs.documents.reduce((sum, doc) => sum + (doc.chunk_count ?? 0), 0),
      top_questions: [],
      daily_chart: [],
    };
  },
};
