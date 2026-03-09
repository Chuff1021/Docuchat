import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { AuthError, createId } from "@/server/auth";
import { apiError } from "@/server/http";
import { requireBot, requireOrganization } from "@/server/organization";
import { toDocument } from "@/server/serializers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; botId: string }> }
) {
  try {
    const { orgId, botId } = await params;
    await requireOrganization(req, orgId);
    await requireBot(orgId, botId);

    const body = (await req.json()) as { urls?: string[] };
    const urls = (body.urls ?? []).map((url) => url.trim()).filter(Boolean);

    if (urls.length === 0) {
      return apiError("At least one URL is required", 400);
    }

    const now = new Date();
    const created = urls.map((url, index) => {
      const safeName = `manual-url-${index + 1}`;
      return {
        id: createId("doc"),
        botId,
        organizationId: orgId,
        fileName: safeName,
        originalFileName: url,
        fileSize: null,
        mimeType: "text/uri-list",
        status: "processing" as const,
        pageCount: null,
        chunkCount: null,
        errorMessage: null,
        createdAt: now,
        updatedAt: now,
      };
    });

    await db.insert(documents).values(created);

    return NextResponse.json({
      documents: created.map(toDocument),
      total: created.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to import manual URLs", 500);
  }
}
