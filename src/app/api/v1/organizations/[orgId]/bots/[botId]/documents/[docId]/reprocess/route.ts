import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { AuthError, createId } from "@/server/auth";
import { apiError } from "@/server/http";
import { requireBot, requireOrganization } from "@/server/organization";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; botId: string; docId: string }> }
) {
  try {
    const { orgId, botId, docId } = await params;
    await requireOrganization(req, orgId);
    await requireBot(orgId, botId);

    const now = new Date();
    await db
      .update(documents)
      .set({
        status: "completed",
        updatedAt: now,
      })
      .where(
        and(
          eq(documents.id, docId),
          eq(documents.botId, botId),
          eq(documents.organizationId, orgId)
        )
      );

    return NextResponse.json({
      id: createId("job"),
      document_id: docId,
      bot_id: botId,
      celery_task_id: null,
      status: "running",
      progress: 0,
      total_pages: null,
      processed_pages: null,
      total_chunks: null,
      error_message: null,
      started_at: now.toISOString(),
      completed_at: null,
      created_at: now.toISOString(),
      document_name: null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to reprocess document", 500);
  }
}
