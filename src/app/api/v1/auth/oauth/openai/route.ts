import { NextRequest, NextResponse } from "next/server";
import { AuthError, getSessionUser } from "@/server/auth";
import { apiError } from "@/server/http";
import { buildOAuthAuthorizeUrl, createOAuthState } from "@/server/oauth";

export async function GET(req: NextRequest) {
  try {
    const intent = req.nextUrl.searchParams.get("intent") === "link" ? "link" : "login";

    let userId: string | undefined;
    if (intent === "link") {
      const auth = await getSessionUser(req);
      userId = auth.user.id;
    }

    const state = createOAuthState({ intent, userId });
    const authorizeUrl = buildOAuthAuthorizeUrl(state);

    return NextResponse.json({ authorize_url: authorizeUrl });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    console.error(error);
    return apiError("Failed to initialize OpenAI OAuth", 500);
  }
}
