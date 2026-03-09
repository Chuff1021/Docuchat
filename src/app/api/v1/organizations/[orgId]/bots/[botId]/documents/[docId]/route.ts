import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { AuthError } from "@/server/auth";
import { apiError } from "@/server/http";
import { requireBot, requireOrganization } from "@/server/organization";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; botId: string; docId: string }> }
) {
  try {
    const { orgId, botId, docId } = await params;
    await requireOrganization(req, orgId);
    await requireBot(orgId, botId);

    await db
      .delete(documents)
      .where(
        and(
          eq(documents.id, docId),
          eq(documents.botId, botId),
          eq(documents.organizationId, orgId)
        )
      );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to delete document", 500);
  }
}
