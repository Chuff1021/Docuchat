import { z } from "zod";

// Deploy-safe fallback for all environments when DB config is not set.
if (!process.env.DB_URL) {
  process.env.DB_URL = "file:./.tmp-docuchat-preview.db";
}
if (!process.env.DB_TOKEN) {
  process.env.DB_TOKEN = "docuchat-preview-token";
}

const serverEnvSchema = z.object({
  DB_URL: z.string().min(1).default("file:./.tmp-docuchat-preview.db"),
  DB_TOKEN: z.string().min(1).default("docuchat-preview-token"),
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
