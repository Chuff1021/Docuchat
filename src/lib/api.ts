/**
 * API client for ManualBot backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Remove Content-Type for FormData
  if (options.body instanceof FormData) {
    delete headers["Content-Type"];
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = { detail: response.statusText };
    }
    const message =
      (errorData as { detail?: string })?.detail || `HTTP ${response.status}`;
    throw new ApiError(response.status, message, errorData);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Auth
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    full_name?: string;
    organization_name: string;
  }) =>
    request<import("@/types").TokenResponse>("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<import("@/types").TokenResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: (token: string) =>
    request<import("@/types").User>("/api/v1/auth/me", {}, token),

  myOrganizations: (token: string) =>
    request<import("@/types").Organization[]>(
      "/api/v1/auth/me/organizations",
      {},
      token
    ),
};

// Bots
export const botsApi = {
  list: (orgId: string, token: string) =>
    request<{ bots: import("@/types").Bot[]; total: number }>(
      `/api/v1/orgs/${orgId}/bots`,
      {},
      token
    ),

  create: (
    orgId: string,
    data: import("@/types").BotCreate,
    token: string
  ) =>
    request<import("@/types").Bot>(`/api/v1/orgs/${orgId}/bots`, {
      method: "POST",
      body: JSON.stringify(data),
    }, token),

  get: (orgId: string, botId: string, token: string) =>
    request<import("@/types").Bot>(
      `/api/v1/orgs/${orgId}/bots/${botId}`,
      {},
      token
    ),

  update: (
    orgId: string,
    botId: string,
    data: Partial<import("@/types").BotCreate>,
    token: string
  ) =>
    request<import("@/types").Bot>(
      `/api/v1/orgs/${orgId}/bots/${botId}`,
      { method: "PATCH", body: JSON.stringify(data) },
      token
    ),

  delete: (orgId: string, botId: string, token: string) =>
    request<void>(
      `/api/v1/orgs/${orgId}/bots/${botId}`,
      { method: "DELETE" },
      token
    ),

  getWidgetTokens: (orgId: string, botId: string, token: string) =>
    request<import("@/types").WidgetToken[]>(
      `/api/v1/orgs/${orgId}/bots/${botId}/widget-tokens`,
      {},
      token
    ),

  createWidgetToken: (orgId: string, botId: string, token: string) =>
    request<import("@/types").WidgetToken>(
      `/api/v1/orgs/${orgId}/bots/${botId}/widget-tokens`,
      { method: "POST" },
      token
    ),
};

// Documents
export const documentsApi = {
  list: (orgId: string, botId: string, token: string) =>
    request<{ documents: import("@/types").Document[]; total: number }>(
      `/api/v1/orgs/${orgId}/bots/${botId}/documents`,
      {},
      token
    ),

  upload: async (
    orgId: string,
    botId: string,
    file: File,
    token: string
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<import("@/types").Document>(
      `/api/v1/orgs/${orgId}/bots/${botId}/documents`,
      { method: "POST", body: formData },
      token
    );
  },

  delete: (orgId: string, botId: string, docId: string, token: string) =>
    request<void>(
      `/api/v1/orgs/${orgId}/bots/${botId}/documents/${docId}`,
      { method: "DELETE" },
      token
    ),

  reprocess: (orgId: string, botId: string, docId: string, token: string) =>
    request<import("@/types").IngestionJob>(
      `/api/v1/orgs/${orgId}/bots/${botId}/documents/${docId}/reprocess`,
      { method: "POST" },
      token
    ),

  getJobs: (orgId: string, botId: string, docId: string, token: string) =>
    request<import("@/types").IngestionJob[]>(
      `/api/v1/orgs/${orgId}/bots/${botId}/documents/${docId}/jobs`,
      {},
      token
    ),

  listAllJobs: (orgId: string, token: string) =>
    request<import("@/types").IngestionJob[]>(
      `/api/v1/orgs/${orgId}/ingestion-jobs`,
      {},
      token
    ),
};

// Chat
export const chatApi = {
  send: (
    orgId: string,
    botId: string,
    data: { message: string; session_token?: string },
    token: string
  ) =>
    request<import("@/types").ChatResponse>(
      `/api/v1/orgs/${orgId}/bots/${botId}/chat`,
      { method: "POST", body: JSON.stringify(data) },
      token
    ),
};

// Analytics
export const analyticsApi = {
  overview: (orgId: string, token: string) =>
    request<import("@/types").AnalyticsOverview>(
      `/api/v1/orgs/${orgId}/analytics/overview`,
      {},
      token
    ),

  botAnalytics: (orgId: string, botId: string, token: string) =>
    request<import("@/types").BotAnalytics>(
      `/api/v1/orgs/${orgId}/analytics/bots/${botId}`,
      {},
      token
    ),
};

export { ApiError };
