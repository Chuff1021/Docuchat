import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE: z.string().default("/api/v1"),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
});
