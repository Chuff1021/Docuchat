import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { organizationMembers, organizations, users } from "@/db/schema";
import { createId, createSession } from "@/server/auth";
import {
  exchangeOAuthCode,
  fetchOAuthUserInfo,
  parseOAuthState,
} from "@/server/oauth";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const stateRaw = req.nextUrl.searchParams.get("state");
  const error = req.nextUrl.searchParams.get("error");

  const appOrigin = req.nextUrl.origin;
  const redirectTo = (path: string, query?: Record<string, string>) => {
    const url = new URL(path, appOrigin);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        url.searchParams.set(key, value);
      }
    }
    return NextResponse.redirect(url);
  };

  try {
    if (error) {
      return redirectTo("/auth/login", { oauth_error: error });
    }

    if (!code || !stateRaw) {
      return redirectTo("/auth/login", { oauth_error: "missing_callback_params" });
    }

    const state = parseOAuthState(stateRaw);
    const token = await exchangeOAuthCode(code);
    const profile = await fetchOAuthUserInfo(token.access_token);
    const now = new Date();
    const expiresAt = token.expires_in ? new Date(now.getTime() + token.expires_in * 1000) : null;

    if (state.intent === "link") {
      if (!state.userId) {
        return redirectTo("/dashboard", { oauth_error: "invalid_link_state" });
      }

      const currentUser = (await db.select().from(users).where(eq(users.id, state.userId)))[0];
      if (!currentUser) {
        return redirectTo("/auth/login", { oauth_error: "user_not_found" });
      }

      await db
        .update(users)
        .set({
          oauthProvider: "openai",
          oauthProviderId: profile.id,
          oauthAccessToken: token.access_token,
          oauthRefreshToken: token.refresh_token ?? null,
          oauthTokenExpiresAt: expiresAt,
          updatedAt: now,
        })
        .where(eq(users.id, currentUser.id));

      return redirectTo("/dashboard", { oauth: "connected" });
    }

    let user = (
      await db
        .select()
        .from(users)
        .where(and(eq(users.oauthProvider, "openai"), eq(users.oauthProviderId, profile.id)))
    )[0];

    if (!user && profile.email) {
      user = (await db.select().from(users).where(eq(users.email, profile.email.toLowerCase())))[0];
    }

    if (!user) {
      const userId = createId("usr");
      const inferredOrgName = profile.name ? `${profile.name.split(" ")[0]}'s Workspace` : "My Workspace";
      const orgId = createId("org");
      const baseSlug = slugify(inferredOrgName) || "workspace";

      await db.insert(users).values({
        id: userId,
        email: (profile.email ?? `openai_${profile.id}@example.com`).toLowerCase(),
        fullName: profile.name ?? "OpenAI User",
        passwordHash: null,
        isActive: true,
        isVerified: true,
        avatarUrl: null,
        oauthProvider: "openai",
        oauthProviderId: profile.id,
        oauthAccessToken: token.access_token,
        oauthRefreshToken: token.refresh_token ?? null,
        oauthTokenExpiresAt: expiresAt,
        createdAt: now,
        updatedAt: now,
      });

      await db.insert(organizations).values({
        id: orgId,
        name: inferredOrgName,
        slug: `${baseSlug}-${orgId.slice(-6)}`,
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

      user = (await db.select().from(users).where(eq(users.id, userId)))[0];
    } else {
      await db
        .update(users)
        .set({
          oauthProvider: "openai",
          oauthProviderId: profile.id,
          oauthAccessToken: token.access_token,
          oauthRefreshToken: token.refresh_token ?? null,
          oauthTokenExpiresAt: expiresAt,
          fullName: user.fullName ?? profile.name ?? null,
          updatedAt: now,
        })
        .where(eq(users.id, user.id));

      user = (await db.select().from(users).where(eq(users.id, user.id)))[0];
    }

    const session = await createSession(user.id);
    return redirectTo("/auth/oauth/callback", {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } catch (oauthError) {
    console.error(oauthError);
    return redirectTo("/auth/login", { oauth_error: "oauth_callback_failed" });
  }
}
