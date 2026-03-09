import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { organizationMembers, organizations, sessions, users } from "@/db/schema";
import { env } from "@/lib/env";

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_LEN = 64;

export class AuthError extends Error {
  constructor(message: string, public status = 401) {
    super(message);
    this.name = "AuthError";
  }
}

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "")}`;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const hash = scryptSync(password, salt, PASSWORD_KEY_LEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [saltHex, hashHex] = encoded.split(":");
  if (!saltHex || !hashHex) {
    return false;
  }
  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export async function createSession(userId: string) {
  const accessToken = randomBytes(24).toString("hex");
  const refreshToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + env.AUTH_ACCESS_TOKEN_TTL_SECONDS * 1000);

  await db.insert(sessions).values({
    id: createId("sess"),
    userId,
    accessToken,
    refreshToken,
    expiresAt,
  });

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: "bearer",
    expires_in: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
  };
}

function readBearerToken(req: NextRequest): string {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing bearer token", 401);
  }
  return authHeader.slice(7).trim();
}

export async function getSessionUser(req: NextRequest) {
  const accessToken = readBearerToken(req);
  const rows = await db
    .select({
      user: users,
      sessionId: sessions.id,
      organization: organizations,
      membershipId: organizationMembers.id,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(organizationMembers, eq(organizationMembers.userId, users.id))
    .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
    .where(and(eq(sessions.accessToken, accessToken), gt(sessions.expiresAt, new Date())));

  const row = rows[0];
  if (!row) {
    throw new AuthError("Invalid or expired session", 401);
  }

  return {
    user: row.user,
    organization: row.organization,
    sessionId: row.sessionId,
    membershipId: row.membershipId,
  };
}
