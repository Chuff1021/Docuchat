import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizationMembers, organizations, users } from "@/db/schema";
import { createId, createSession, hashPassword, verifyPassword } from "@/server/auth";
import { apiError } from "@/server/http";
import { toUser } from "@/server/serializers";

const DEMO_EMAIL = "demo@docubot.ai";
const DEMO_PASSWORD = "demo1234";

async function ensureDemoAccount() {
  const existing = (await db.select().from(users).where(eq(users.email, DEMO_EMAIL)))[0];
  if (existing) {
    return existing;
  }

  const now = new Date();
  const userId = createId("usr");
  const orgId = createId("org");

  await db.insert(users).values({
    id: userId,
    email: DEMO_EMAIL,
    fullName: "Alex Chen",
    passwordHash: hashPassword(DEMO_PASSWORD),
    isActive: true,
    isVerified: true,
    avatarUrl: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(organizations).values({
    id: orgId,
    name: "Acme Corp",
    slug: `acme-corp-${orgId.slice(-6)}`,
    logoUrl: null,
    website: null,
    plan: "pro",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(organizationMembers).values({
    id: createId("mem"),
    organizationId: orgId,
    userId,
    role: "owner",
    createdAt: now,
  });

  return (await db.select().from(users).where(eq(users.id, userId)))[0];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();

    if (!email || !password) {
      return apiError("Email and password are required", 400);
    }

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const demoUser = await ensureDemoAccount();
      const tokenPayload = await createSession(demoUser.id);
      return NextResponse.json({
        ...tokenPayload,
        user: toUser(demoUser),
      });
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
