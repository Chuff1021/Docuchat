// Core types matching backend schemas

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  website: string | null;
  plan: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface OAuthAuthorizeResponse {
  authorize_url: string;
}

export interface OAuthStatus {
  connected: boolean;
  provider: "openai" | null;
  expires_at: string | null;
}

export interface Bot {
  id: string;
  organization_id: string;
  name: string;
  greeting: string | null;
  brand_color: string | null;
  logo_url: string | null;
  fallback_message: string | null;
  system_prompt: string | null;
  is_active: boolean;
  chat_model: string | null;
  temperature: number | null;
  max_tokens: number | null;
  citation_mode: boolean;
  strict_mode: boolean;
  lead_capture: boolean;
  escalation_email: string | null;
  escalation_webhook: string | null;
  allowed_domains: string[] | null;
  created_at: string;
  updated_at: string;
  document_count: number;
  chunk_count: number;
}

export interface BotCreate {
  name: string;
  greeting?: string;
  brand_color?: string;
  logo_url?: string;
  fallback_message?: string;
  system_prompt?: string;
  citation_mode?: boolean;
  strict_mode?: boolean;
  lead_capture?: boolean;
  escalation_email?: string;
  escalation_webhook?: string;
  allowed_domains?: string[];
}

export interface Document {
  id: string;
  bot_id: string;
  organization_id: string;
  source_type?: "upload" | "url";
  file_name: string;
  original_file_name: string;
  file_size: number | null;
  mime_type: string | null;
  status: "pending" | "processing" | "completed" | "failed" | "deleted";
  page_count: number | null;
  chunk_count: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface IngestionJob {
  id: string;
  document_id: string;
  bot_id: string;
  celery_task_id: string | null;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  total_pages: number | null;
  processed_pages: number | null;
  total_chunks: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  document_name: string | null;
}

export interface Citation {
  chunk_id: string;
  document_id: string;
  file_name: string;
  page_number: number | null;
  text_snippet: string;
  score: number | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  sources?: string[];
  confidence?: string;
  answer_found: boolean;
  created_at: string;
}

export interface ChatResponse {
  answer: string;
  session_token: string;
  message_id: string;
  citations: Citation[];
  sources: string[];
  answer_found: boolean;
  confidence: string | null;
  tokens_used: number | null;
  latency_ms: number | null;
}

export interface WidgetToken {
  id: string;
  bot_id: string;
  token: string;
  is_active: boolean;
  created_at: string;
}

export interface ApiKey {
  id: string;
  bot_id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  created_at: string;
  full_key?: string;
}

export interface AnalyticsOverview {
  docs_uploaded: number;
  chunks_indexed: number;
  chats_today: number;
  chats_total: number;
  active_bots: number;
  top_questions: Array<{ question: string; count: number }>;
  unresolved_count: number;
  avg_response_time_ms: number | null;
}

export interface BotAnalytics {
  bot_id: string;
  bot_name: string;
  chats_today: number;
  chats_total: number;
  docs_count: number;
  chunks_count: number;
  top_questions: Array<{ question: string; count: number }>;
  daily_chart: Array<{ date: string; chats: number; resolved: number }>;
}
