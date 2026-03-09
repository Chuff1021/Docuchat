import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { AuthError, createId } from "@/server/auth";
import { apiError } from "@/server/http";
import { requireBot, requireOrganization } from "@/server/organization";
import { toDocument } from "@/server/serializers";

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
      .from(documents)
      .where(and(eq(documents.organizationId, orgId), eq(documents.botId, botId)));

    return NextResponse.json({
      documents: rows.map(toDocument),
      total: rows.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to load documents", 500);
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

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return apiError("File is required", 400);
    }

    const now = new Date();
    const row = {
      id: createId("doc"),
      botId,
      organizationId: orgId,
      fileName: file.name.toLowerCase().replace(/\s+/g, "-"),
      originalFileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "application/pdf",
      status: "completed",
      pageCount: Math.max(1, Math.round(file.size / 24000)),
      chunkCount: Math.max(5, Math.round(file.size / 3200)),
      errorMessage: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(documents).values(row);
    return NextResponse.json(toDocument(row));
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to upload document", 500);
  }
}
