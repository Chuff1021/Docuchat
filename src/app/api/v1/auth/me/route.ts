import { NextRequest, NextResponse } from "next/server";
import { AuthError, getSessionUser } from "@/server/auth";
import { apiError } from "@/server/http";
import { toUser } from "@/server/serializers";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getSessionUser(req);
    return NextResponse.json(toUser(user));
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to load current user", 500);
  }
}
