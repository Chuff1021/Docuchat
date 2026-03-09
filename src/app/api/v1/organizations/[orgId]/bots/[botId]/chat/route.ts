import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bots, chatMessages, chatSessions, documents } from "@/db/schema";
import { env } from "@/lib/env";
import { AuthError, createId } from "@/server/auth";
import { apiError } from "@/server/http";
import { requireBot, requireOrganization } from "@/server/organization";

interface OpenAIResponse {
  output?: Array<{
    content?: Array<{ type: string; text?: string }>;
  }>;
}

async function resolveChatSession(sessionToken: string | undefined, botId: string, orgId: string, userId: string) {
  if (sessionToken) {
    const existing = (
      await db.select().from(chatSessions).where(eq(chatSessions.sessionToken, sessionToken))
    )[0];
    if (existing) {
      await db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, existing.id));
      return existing;
    }
  }

  const created = {
    id: createId("cs"),
    botId,
    organizationId: orgId,
    userId,
    sessionToken: createId("session"),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insert(chatSessions).values(created);
  return created;
}

async function generateOpenAIAnswer(input: string, context: string, oauthToken: string) {
  const res = await fetch(`${env.OPENAI_API_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${oauthToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "You are a documentation assistant. Use only provided context. If context is insufficient, say that clearly.",
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion:\n${input}`,
        },
      ],
      max_output_tokens: 400,
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI request failed (${res.status})`);
  }

  const data = (await res.json()) as OpenAIResponse;
  const answer =
    data.output
      ?.flatMap((item) => item.content ?? [])
      .find((content) => content.type === "output_text")
      ?.text ?? "I could not generate an answer for that question.";

  return answer;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgId: string; botId: string }> }
) {
  try {
    const { orgId, botId } = await params;
    const auth = await requireOrganization(req, orgId);
    const bot = await requireBot(orgId, botId);
    const body = await req.json() as { message?: string; session_token?: string };

    const message = body.message?.trim();
    if (!message) {
      return apiError("Message is required", 400);
    }

    const session = await resolveChatSession(body.session_token, botId, orgId, auth.user.id);
    const docs = await db
      .select()
      .from(documents)
      .where(and(eq(documents.organizationId, orgId), eq(documents.botId, botId)));

    const context = docs
      .slice(0, 5)
      .map((doc) => `${doc.originalFileName} (${doc.pageCount ?? "?"} pages)`)
      .join("\n");

    const fallback =
      "I can only answer based on uploaded documentation. Connect your ChatGPT OAuth provider to use live model responses.";

    const answer = auth.user.oauthAccessToken
      ? await generateOpenAIAnswer(message, context || "No documents uploaded.", auth.user.oauthAccessToken)
      : fallback;

    const now = new Date();
    await db.insert(chatMessages).values([
      {
        id: createId("msg"),
        chatSessionId: session.id,
        role: "user",
        content: message,
        citations: null,
        sources: null,
        answerFound: true,
        confidence: null,
        createdAt: now,
      },
      {
        id: createId("msg"),
        chatSessionId: session.id,
        role: "assistant",
        content: answer,
        citations: null,
        sources: null,
        answerFound: true,
        confidence: auth.user.oauthAccessToken ? "high" : "low",
        createdAt: now,
      },
    ]);

    const firstDoc = docs[0];
    const citations = firstDoc
      ? [
          {
            chunk_id: createId("chunk"),
            document_id: firstDoc.id,
            file_name: firstDoc.originalFileName,
            page_number: 1,
            text_snippet: `Reference from ${firstDoc.originalFileName}`,
            score: 0.8,
          },
        ]
      : [];

    return NextResponse.json({
      answer,
      session_token: session.sessionToken,
      message_id: createId("msg"),
      citations,
      sources: citations.map((citation) => citation.file_name),
      answer_found: true,
      confidence: auth.user.oauthAccessToken ? "high" : "low",
      tokens_used: null,
      latency_ms: null,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return apiError(error.message, error.status);
    }
    console.error(error);
    return apiError("Failed to send chat message", 500);
  }
}
