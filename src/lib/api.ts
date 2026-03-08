/**
 * API client for ManualBot
 * Uses mock data for demo preview (no backend required)
 */

import {
  DEMO_USER,
  DEMO_ORGANIZATION,
  DEMO_BOTS,
  DEMO_DOCUMENTS,
  DEMO_ANALYTICS,
  DEMO_WIDGET_TOKEN,
  getMockChatResponse,
} from "./mock-data";
import type {
  TokenResponse,
  User,
  Organization,
  Bot,
  BotCreate,
  Document,
  IngestionJob,
  ChatResponse,
  WidgetToken,
  AnalyticsOverview,
  BotAnalytics,
} from "@/types";

// Simulate network delay
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () => delay(300 + Math.random() * 500);

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

// In-memory state for demo mutations
let demoBots = [...DEMO_BOTS];
let demoDocuments = { ...DEMO_DOCUMENTS };
let botIdCounter = 100;
let docIdCounter = 100;

// Auth
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    full_name?: string;
    organization_name: string;
  }): Promise<TokenResponse> => {
    await randomDelay();
    return {
      access_token: "demo_access_token",
      refresh_token: "demo_refresh_token",
      token_type: "bearer",
      expires_in: 3600,
      user: {
        ...DEMO_USER,
        email: data.email,
        full_name: data.full_name || DEMO_USER.full_name,
      },
    };
  },

  login: async (_data: { email: string; password: string }): Promise<TokenResponse> => {
    await randomDelay();
    return {
      access_token: "demo_access_token",
      refresh_token: "demo_refresh_token",
      token_type: "bearer",
      expires_in: 3600,
      user: DEMO_USER,
    };
  },

  me: async (_token: string): Promise<User> => {
    await randomDelay();
    return DEMO_USER;
  },

  myOrganizations: async (_token: string): Promise<Organization[]> => {
    await randomDelay();
    return [DEMO_ORGANIZATION];
  },
};

// Bots
export const botsApi = {
  list: async (
    _orgId: string,
    _token: string
  ): Promise<{ bots: Bot[]; total: number }> => {
    await randomDelay();
    return { bots: demoBots, total: demoBots.length };
  },

  create: async (
    _orgId: string,
    data: BotCreate,
    _token: string
  ): Promise<Bot> => {
    await randomDelay();
    botIdCounter++;
    const newBot: Bot = {
      id: `bot_${botIdCounter}`,
      organization_id: "org_demo_001",
      name: data.name,
      greeting: data.greeting || "Hi! How can I help you?",
      brand_color: data.brand_color || "#6366f1",
      logo_url: null,
      fallback_message: null,
      system_prompt: null,
      is_active: true,
      chat_model: "gpt-4o-mini",
      temperature: 0.3,
      max_tokens: 1024,
      citation_mode: data.citation_mode ?? true,
      strict_mode: data.strict_mode ?? true,
      lead_capture: data.lead_capture ?? false,
      escalation_email: data.escalation_email || null,
      escalation_webhook: data.escalation_webhook || null,
      allowed_domains: data.allowed_domains || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      document_count: 0,
      chunk_count: 0,
    };
    demoBots = [newBot, ...demoBots];
    demoDocuments[newBot.id] = [];
    return newBot;
  },

  get: async (
    _orgId: string,
    botId: string,
    _token: string
  ): Promise<Bot> => {
    await randomDelay();
    const bot = demoBots.find((b) => b.id === botId);
    if (!bot) throw new ApiError(404, "Bot not found");
    return bot;
  },

  update: async (
    _orgId: string,
    botId: string,
    data: Partial<BotCreate>,
    _token: string
  ): Promise<Bot> => {
    await randomDelay();
    const idx = demoBots.findIndex((b) => b.id === botId);
    if (idx === -1) throw new ApiError(404, "Bot not found");
    demoBots[idx] = { ...demoBots[idx], ...data, updated_at: new Date().toISOString() };
    return demoBots[idx];
  },

  delete: async (
    _orgId: string,
    botId: string,
    _token: string
  ): Promise<void> => {
    await randomDelay();
    demoBots = demoBots.filter((b) => b.id !== botId);
    delete demoDocuments[botId];
  },

  getWidgetTokens: async (
    _orgId: string,
    botId: string,
    _token: string
  ): Promise<WidgetToken[]> => {
    await randomDelay();
    return [{ ...DEMO_WIDGET_TOKEN, bot_id: botId }];
  },

  createWidgetToken: async (
    _orgId: string,
    botId: string,
    _token: string
  ): Promise<WidgetToken> => {
    await randomDelay();
    return {
      id: "wt_" + Date.now(),
      bot_id: botId,
      token: "mb_widget_" + Math.random().toString(36).slice(2, 14),
      is_active: true,
      created_at: new Date().toISOString(),
    };
  },
};

// Documents
export const documentsApi = {
  list: async (
    _orgId: string,
    botId: string,
    _token: string
  ): Promise<{ documents: Document[]; total: number }> => {
    await randomDelay();
    const docs = demoDocuments[botId] || [];
    return { documents: docs, total: docs.length };
  },

  upload: async (
    _orgId: string,
    botId: string,
    file: File,
    _token: string
  ): Promise<Document> => {
    await delay(1000 + Math.random() * 1000); // Simulate upload time
    docIdCounter++;
    const newDoc: Document = {
      id: `doc_${docIdCounter}`,
      bot_id: botId,
      organization_id: "org_demo_001",
      file_name: file.name.toLowerCase().replace(/\s+/g, "-"),
      original_file_name: file.name,
      file_size: file.size,
      mime_type: file.type || "application/pdf",
      status: "completed",
      page_count: Math.floor(Math.random() * 30) + 5,
      chunk_count: Math.floor(Math.random() * 200) + 20,
      error_message: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (!demoDocuments[botId]) demoDocuments[botId] = [];
    demoDocuments[botId] = [newDoc, ...demoDocuments[botId]];
    return newDoc;
  },

  delete: async (
    _orgId: string,
    botId: string,
    docId: string,
    _token: string
  ): Promise<void> => {
    await randomDelay();
    if (demoDocuments[botId]) {
      demoDocuments[botId] = demoDocuments[botId].filter((d) => d.id !== docId);
    }
  },

  reprocess: async (
    _orgId: string,
    _botId: string,
    docId: string,
    _token: string
  ): Promise<IngestionJob> => {
    await randomDelay();
    return {
      id: "job_" + Date.now(),
      document_id: docId,
      bot_id: _botId,
      celery_task_id: null,
      status: "running",
      progress: 0,
      total_pages: null,
      processed_pages: null,
      total_chunks: null,
      error_message: null,
      started_at: new Date().toISOString(),
      completed_at: null,
      created_at: new Date().toISOString(),
      document_name: null,
    };
  },

  getJobs: async (
    _orgId: string,
    _botId: string,
    _docId: string,
    _token: string
  ): Promise<IngestionJob[]> => {
    await randomDelay();
    return [];
  },

  listAllJobs: async (
    _orgId: string,
    _token: string
  ): Promise<IngestionJob[]> => {
    await randomDelay();
    return [];
  },
};

// Chat
export const chatApi = {
  send: async (
    _orgId: string,
    _botId: string,
    data: { message: string; session_token?: string },
    _token: string
  ): Promise<ChatResponse> => {
    await delay(800 + Math.random() * 1200); // Simulate AI thinking time
    return getMockChatResponse(data.message);
  },
};

// Analytics
export const analyticsApi = {
  overview: async (
    _orgId: string,
    _token: string
  ): Promise<AnalyticsOverview> => {
    await randomDelay();
    return DEMO_ANALYTICS;
  },

  botAnalytics: async (
    _orgId: string,
    botId: string,
    _token: string
  ): Promise<BotAnalytics> => {
    await randomDelay();
    const bot = demoBots.find((b) => b.id === botId);
    return {
      bot_id: botId,
      bot_name: bot?.name || "Bot",
      chats_today: 12,
      chats_total: 342,
      docs_count: bot?.document_count || 0,
      chunks_count: bot?.chunk_count || 0,
      top_questions: DEMO_ANALYTICS.top_questions.slice(0, 5),
      daily_chart: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split("T")[0],
        chats: Math.floor(Math.random() * 30) + 5,
        resolved: Math.floor(Math.random() * 25) + 3,
      })),
    };
  },
};

export { ApiError };
