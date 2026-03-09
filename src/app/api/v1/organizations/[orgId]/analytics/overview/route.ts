import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bots, chatMessages, chatSessions, documents } from "@/db/schema";
import { AuthError } from "@/server/auth";
import { apiError } from "@/server/http";
import { requireOrganization } from "@/server/organization";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params;
    await requireOrganization(req, orgId);

    const [botRows, docRows] = await Promise.all([
      db.select().from(bots).where(eq(bots.organizationId, orgId)),
      db.select().from(documents).where(eq(documents.organizationId, orgId)),
    ]);

    const activeBotIds = botRows.filter((bot) => bot.isActive).map((bot) => bot.id);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const messages = await db
      .select()
      .from(chatMessages)
      .innerJoin(chatSessions, eq(chatMessages.chatSessionId, chatSessions.id))
      .where(and(eq(chatMessages.role, "assistant"), eq(chatSessions.organizationId, orgId)));

    const chatsTotal = messages.length;
    const chatsToday = messages.filter((item) => item.chat_messages.createdAt >= todayStart).length;

    return NextResponse.json({
      docs_uploaded: docRows.length,
      chunks_indexed: docRows.reduce((sum, doc) => sum + (doc.chunkCount ?? 0), 0),
      chats_today: chatsToday,
      chats_total: chatsTotal,
      active_bots: activeBotIds.length,
      top_questions: [],
      unresolved_count: 0,
      avg_response_time_ms: null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to load analytics", 500);
  }
}
