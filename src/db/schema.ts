import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const now = () => new Date();

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  passwordHash: text("password_hash"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  avatarUrl: text("avatar_url"),
  oauthProvider: text("oauth_provider"),
  oauthProviderId: text("oauth_provider_id"),
  oauthAccessToken: text("oauth_access_token"),
  oauthRefreshToken: text("oauth_refresh_token"),
  oauthTokenExpiresAt: integer("oauth_token_expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
  website: text("website"),
  plan: text("plan").notNull().default("starter"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const organizationMembers = sqliteTable("organization_members", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("owner"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token").notNull().unique(),
  refreshToken: text("refresh_token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const bots = sqliteTable("bots", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  greeting: text("greeting"),
  brandColor: text("brand_color"),
  logoUrl: text("logo_url"),
  fallbackMessage: text("fallback_message"),
  systemPrompt: text("system_prompt"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  chatModel: text("chat_model").default("gpt-4.1-mini"),
  temperature: real("temperature").default(0.3),
  maxTokens: integer("max_tokens").default(1024),
  citationMode: integer("citation_mode", { mode: "boolean" }).notNull().default(true),
  strictMode: integer("strict_mode", { mode: "boolean" }).notNull().default(true),
  leadCapture: integer("lead_capture", { mode: "boolean" }).notNull().default(false),
  escalationEmail: text("escalation_email"),
  escalationWebhook: text("escalation_webhook"),
  allowedDomains: text("allowed_domains"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  botId: text("bot_id").notNull().references(() => bots.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  originalFileName: text("original_file_name").notNull(),
  fileSize: integer("file_size"),
  mimeType: text("mime_type"),
  status: text("status").notNull().default("completed"),
  pageCount: integer("page_count"),
  chunkCount: integer("chunk_count"),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const widgetTokens = sqliteTable("widget_tokens", {
  id: text("id").primaryKey(),
  botId: text("bot_id").notNull().references(() => bots.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const chatSessions = sqliteTable("chat_sessions", {
  id: text("id").primaryKey(),
  botId: text("bot_id").notNull().references(() => bots.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionToken: text("session_token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  chatSessionId: text("chat_session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  citations: text("citations"),
  sources: text("sources"),
  answerFound: integer("answer_found", { mode: "boolean" }).notNull().default(true),
  confidence: text("confidence"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(now),
});
