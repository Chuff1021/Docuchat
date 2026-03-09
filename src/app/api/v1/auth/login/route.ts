import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, verifyPassword } from "@/server/auth";
import { apiError } from "@/server/http";
import { toUser } from "@/server/serializers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return apiError("Email and password are required", 400);
    }

    const user = (await db.select().from(users).where(eq(users.email, email)))[0];
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      return apiError("Invalid credentials", 401);
    }

    const tokenPayload = await createSession(user.id);
    return NextResponse.json({
      ...tokenPayload,
      user: toUser(user),
    });
  } catch (error) {
    console.error(error);
    return apiError("Login failed", 500);
  }
}
