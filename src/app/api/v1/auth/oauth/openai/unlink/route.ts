import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AuthError, getSessionUser } from "@/server/auth";
import { apiError } from "@/server/http";

export async function DELETE(req: NextRequest) {
  try {
    const { user } = await getSessionUser(req);

    await db
      .update(users)
      .set({
        oauthProvider: null,
        oauthProviderId: null,
        oauthAccessToken: null,
        oauthRefreshToken: null,
        oauthTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to unlink OpenAI account", 500);
  }
}
