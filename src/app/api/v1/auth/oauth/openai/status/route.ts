import { NextRequest, NextResponse } from "next/server";
import { AuthError, getSessionUser } from "@/server/auth";
import { apiError } from "@/server/http";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getSessionUser(req);
    const connected = user.oauthProvider === "openai" && !!user.oauthAccessToken;

    return NextResponse.json({
      connected,
      provider: connected ? "openai" : null,
      expires_at: user.oauthTokenExpiresAt ? user.oauthTokenExpiresAt.toISOString() : null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to fetch OpenAI connection status", 500);
  }
}
