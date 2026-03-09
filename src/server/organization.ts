import { and, eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import { db } from "@/db";
import { bots, documents } from "@/db/schema";
import { AuthError, getSessionUser } from "@/server/auth";

export async function requireOrganization(req: NextRequest, orgId: string) {
  const auth = await getSessionUser(req);
  if (auth.organization.id !== orgId) {
    throw new AuthError("Forbidden", 403);
  }
  return auth;
}

export async function getBotStats(botIds: string[]) {
  if (botIds.length === 0) {
    return new Map<string, { documentCount: number; chunkCount: number }>();
  }

  const botRows = await db.select().from(bots).where(inArray(bots.id, botIds));
  const docRows = await db.select().from(documents).where(inArray(documents.botId, botIds));
  const stats = new Map<string, { documentCount: number; chunkCount: number }>();

  for (const bot of botRows) {
    stats.set(bot.id, { documentCount: 0, chunkCount: 0 });
  }

  for (const doc of docRows) {
    const current = stats.get(doc.botId) ?? { documentCount: 0, chunkCount: 0 };
    current.documentCount += 1;
    current.chunkCount += doc.chunkCount ?? 0;
    stats.set(doc.botId, current);
  }

  return stats;
}

export async function requireBot(orgId: string, botId: string) {
  const bot = (
    await db
      .select()
      .from(bots)
      .where(and(eq(bots.id, botId), eq(bots.organizationId, orgId)))
  )[0];

  if (!bot) {
    throw new AuthError("Bot not found", 404);
  }

  return bot;
}
