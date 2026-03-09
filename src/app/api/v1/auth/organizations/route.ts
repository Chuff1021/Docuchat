import { NextRequest, NextResponse } from "next/server";
import { AuthError, getSessionUser } from "@/server/auth";
import { apiError } from "@/server/http";
import { toOrganization } from "@/server/serializers";

export async function GET(req: NextRequest) {
  try {
    const { organization } = await getSessionUser(req);
    return NextResponse.json([toOrganization(organization)]);
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    return apiError("Failed to load organizations", 500);
  }
}
