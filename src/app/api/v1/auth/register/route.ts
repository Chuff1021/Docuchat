import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizationMembers, organizations, users } from "@/db/schema";
import { createId, createSession, hashPassword } from "@/server/auth";
import { apiError } from "@/server/http";
import { toUser } from "@/server/serializers";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: string;
      password?: string;
      full_name?: string;
      organization_name?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password?.trim();
    const organizationName = body.organization_name?.trim();

    if (!email || !password || !organizationName) {
      return apiError("Missing required fields", 400);
    }

    if (password.length < 8) {
      return apiError("Password must be at least 8 characters", 400);
    }

    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return apiError("Email is already registered", 409);
    }

    const userId = createId("usr");
    const baseSlug = slugify(organizationName) || "workspace";
    const orgId = createId("org");
    const orgSlug = `${baseSlug}-${orgId.slice(-6)}`;
    const now = new Date();

    await db.insert(users).values({
      id: userId,
      email,
      fullName: body.full_name?.trim() || null,
      passwordHash: hashPassword(password),
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    await db.insert(organizations).values({
      id: orgId,
      name: organizationName,
      slug: orgSlug,
      plan: "starter",
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

    const tokenPayload = await createSession(userId);
    const user = (await db.select().from(users).where(eq(users.id, userId)))[0];

    return NextResponse.json({
      ...tokenPayload,
      user: toUser(user),
    });
  } catch (error) {
    console.error(error);
    return apiError("Registration failed", 500);
  }
}
