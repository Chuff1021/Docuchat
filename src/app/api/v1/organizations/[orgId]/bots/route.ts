import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bots } from "@/db/schema";
import { AuthError, createId } from "@/server/auth";
import { apiError } from "@/server/http";
import { getBotStats, requireOrganization } from "@/server/organization";
import { toBot } from "@/server/serializers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrganization(req, orgId);

    const rows = await db.select().from(bots).where(eq(bots.organizationId, orgId));
    const stats = await getBotStats(rows.map((row) => row.id));

    return NextResponse.json({
      bots: rows.map((row) => toBot(row, stats.get(row.id))),
      total: rows.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to load bots", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrganization(req, orgId);
    const body = await req.json() as {
      name?: string;
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
    };

    const name = body.name?.trim();
    if (!name) {
      return apiError("Bot name is required", 400);
    }

    const now = new Date();
    const row = {
      id: createId("bot"),
      organizationId: orgId,
      name,
      greeting: body.greeting ?? "Hi! How can I help you?",
      brandColor: body.brand_color ?? "#6366f1",
      logoUrl: body.logo_url ?? null,
      fallbackMessage: body.fallback_message ?? null,
      systemPrompt: body.system_prompt ?? null,
      isActive: true,
      chatModel: "gpt-4.1-mini",
      temperature: 0.3,
      maxTokens: 1024,
      citationMode: body.citation_mode ?? true,
      strictMode: body.strict_mode ?? true,
      leadCapture: body.lead_capture ?? false,
      escalationEmail: body.escalation_email ?? null,
      escalationWebhook: body.escalation_webhook ?? null,
      allowedDomains: body.allowed_domains ? JSON.stringify(body.allowed_domains) : null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(bots).values(row);
    return NextResponse.json(toBot(row, { documentCount: 0, chunkCount: 0 }));
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to create bot", 500);
  }
}
