import { z } from "zod";

const isProduction = process.env.NODE_ENV === "production";

// Deploy-safe fallback for preview/dev environments where DB_URL is not set yet.
if (!process.env.DB_URL && !isProduction) {
  process.env.DB_URL = "file:./.tmp-docuchat-preview.db";
}

const serverEnvSchema = z.object({
  DB_URL: isProduction
    ? z.string().min(1, "DB_URL is required")
    : z.string().min(1).default("file:./.tmp-docuchat-preview.db"),
  DB_TOKEN: z.string().optional(),
  CHATGPT_OAUTH_CLIENT_ID: z.string().optional(),
  CHATGPT_OAUTH_CLIENT_SECRET: z.string().optional(),
  CHATGPT_OAUTH_REDIRECT_URI: z.string().url().optional(),
  CHATGPT_OAUTH_AUTHORIZE_URL: z.string().url().default("https://auth.openai.com/authorize"),
  CHATGPT_OAUTH_TOKEN_URL: z.string().url().default("https://auth.openai.com/oauth/token"),
  CHATGPT_OAUTH_USERINFO_URL: z.string().url().default("https://api.openai.com/v1/me"),
  OPENAI_API_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(3600),
  AUTH_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
});

export const env = serverEnvSchema.parse(process.env);
