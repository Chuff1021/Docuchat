import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { widgetTokens } from "@/db/schema";
import { AuthError, createId } from "@/server/auth";
import { apiError } from "@/server/http";
import { requireBot, requireOrganization } from "@/server/organization";
import { toWidgetToken } from "@/server/serializers";

function createWidgetTokenValue() {
  return `db_widget_${createId("tok").slice(-24)}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; botId: string }> }
) {
  try {
    const { orgId, botId } = await params;
    await requireOrganization(req, orgId);
    await requireBot(orgId, botId);

    const rows = await db
      .select()
      .from(widgetTokens)
      .where(eq(widgetTokens.botId, botId));

    return NextResponse.json(rows.map(toWidgetToken));
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to load widget tokens", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; botId: string }> }
) {
  try {
    const { orgId, botId } = await params;
    await requireOrganization(req, orgId);
    await requireBot(orgId, botId);

    await db
      .update(widgetTokens)
      .set({ isActive: false })
      .where(and(eq(widgetTokens.botId, botId), eq(widgetTokens.isActive, true)));

    const row = {
      id: createId("wt"),
      botId,
      token: createWidgetTokenValue(),
      isActive: true,
      createdAt: new Date(),
    };

    await db.insert(widgetTokens).values(row);
    return NextResponse.json(toWidgetToken(row));
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to create widget token", 500);
  }
}
