import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bots } from "@/db/schema";
import { AuthError } from "@/server/auth";
import { apiError } from "@/server/http";
import { getBotStats, requireBot, requireOrganization } from "@/server/organization";
import { toBot } from "@/server/serializers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; botId: string }> }
) {
  try {
    const { orgId, botId } = await params;
    await requireOrganization(req, orgId);
    const bot = await requireBot(orgId, botId);
    const stats = await getBotStats([bot.id]);
    return NextResponse.json(toBot(bot, stats.get(bot.id)));
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to load bot", 500);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; botId: string }> }
) {
  try {
    const { orgId, botId } = await params;
    await requireOrganization(req, orgId);
    const current = await requireBot(orgId, botId);
    const body = await req.json() as Record<string, unknown>;

    const updateData: Partial<typeof bots.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.name === "string") updateData.name = body.name;
    if (typeof body.greeting === "string") updateData.greeting = body.greeting;
    if (typeof body.brand_color === "string") updateData.brandColor = body.brand_color;
    if (typeof body.logo_url === "string") updateData.logoUrl = body.logo_url;
    if (typeof body.fallback_message === "string") updateData.fallbackMessage = body.fallback_message;
    if (typeof body.system_prompt === "string") updateData.systemPrompt = body.system_prompt;
    if (typeof body.is_active === "boolean") updateData.isActive = body.is_active;
    if (typeof body.temperature === "number") updateData.temperature = body.temperature;
    if (typeof body.max_tokens === "number") updateData.maxTokens = body.max_tokens;
    if (typeof body.citation_mode === "boolean") updateData.citationMode = body.citation_mode;
    if (typeof body.strict_mode === "boolean") updateData.strictMode = body.strict_mode;
    if (typeof body.lead_capture === "boolean") updateData.leadCapture = body.lead_capture;
    if (typeof body.escalation_email === "string") updateData.escalationEmail = body.escalation_email;
    if (typeof body.escalation_webhook === "string") updateData.escalationWebhook = body.escalation_webhook;
    if (Array.isArray(body.allowed_domains)) {
      updateData.allowedDomains = JSON.stringify(body.allowed_domains);
    }

    await db
      .update(bots)
      .set(updateData)
      .where(and(eq(bots.id, botId), eq(bots.organizationId, orgId)));

    const updated = (await db.select().from(bots).where(eq(bots.id, current.id)))[0];
    const stats = await getBotStats([updated.id]);
    return NextResponse.json(toBot(updated, stats.get(updated.id)));
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to update bot", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; botId: string }> }
) {
  try {
    const { orgId, botId } = await params;
    await requireOrganization(req, orgId);
    await requireBot(orgId, botId);

    await db.delete(bots).where(and(eq(bots.id, botId), eq(bots.organizationId, orgId)));
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to delete bot", 500);
  }
}
