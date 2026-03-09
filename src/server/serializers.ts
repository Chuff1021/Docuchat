import type { bots, documents, organizations, users, widgetTokens } from "@/db/schema";

type UserRow = typeof users.$inferSelect;
type OrganizationRow = typeof organizations.$inferSelect;
type BotRow = typeof bots.$inferSelect;
type DocumentRow = typeof documents.$inferSelect;
type WidgetTokenRow = typeof widgetTokens.$inferSelect;

export function toUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    full_name: row.fullName,
    is_active: row.isActive,
    is_verified: row.isVerified,
    avatar_url: row.avatarUrl,
    created_at: row.createdAt.toISOString(),
  };
}

export function toOrganization(row: OrganizationRow) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo_url: row.logoUrl,
    website: row.website,
    plan: row.plan,
    is_active: row.isActive,
    created_at: row.createdAt.toISOString(),
  };
}

export function toBot(row: BotRow, stats?: { documentCount: number; chunkCount: number }) {
  return {
    id: row.id,
    organization_id: row.organizationId,
    name: row.name,
    greeting: row.greeting,
    brand_color: row.brandColor,
    logo_url: row.logoUrl,
    fallback_message: row.fallbackMessage,
    system_prompt: row.systemPrompt,
    is_active: row.isActive,
    chat_model: row.chatModel,
    temperature: row.temperature,
    max_tokens: row.maxTokens,
    citation_mode: row.citationMode,
    strict_mode: row.strictMode,
    lead_capture: row.leadCapture,
    escalation_email: row.escalationEmail,
    escalation_webhook: row.escalationWebhook,
    allowed_domains: row.allowedDomains ? JSON.parse(row.allowedDomains) as string[] : null,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
    document_count: stats?.documentCount ?? 0,
    chunk_count: stats?.chunkCount ?? 0,
  };
}

export function toDocument(row: DocumentRow) {
  return {
    id: row.id,
    bot_id: row.botId,
    organization_id: row.organizationId,
    file_name: row.fileName,
    original_file_name: row.originalFileName,
    file_size: row.fileSize,
    mime_type: row.mimeType,
    status: row.status,
    page_count: row.pageCount,
    chunk_count: row.chunkCount,
    error_message: row.errorMessage,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  };
}

export function toWidgetToken(row: WidgetTokenRow) {
  return {
    id: row.id,
    bot_id: row.botId,
    token: row.token,
    is_active: row.isActive,
    created_at: row.createdAt.toISOString(),
  };
}
