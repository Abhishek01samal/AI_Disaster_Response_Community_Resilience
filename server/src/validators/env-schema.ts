import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["DEVELOPMENT", "PRODUCTION"]),
  PORT: z.string().default("5000").transform(Number),
  SERVICE_NAME: z.string().default("auth-server"),
  LOG_LEVEL: z.string().default("info"),
  FRONTEND_URL: z
    .string()
    .url()
    .min(1, { message: "FRONTEND_URL is required." }),
  BACKEND_URL: z
    .string()
    .url()
    .min(1, { message: "FRONTEND_URL is required." }),
  DATABASE_URL: z.string().min(1, { message: "DATABASE_URL is required." }),
  REDIS_URL: z.string().min(1, { message: "REDIS_URL is required." }),
  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, { message: "GOOGLE_CLIENT_ID is required." }),
  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, { message: "GOOGLE_CLIENT_SECRET is required." }),
  GMAIL_REFRESH_TOKEN: z
    .string()
    .min(1, { message: "GMAIL_REFRESH_TOKEN is required." }),
  EMAIL_USER: z.string().min(1, { message: "EMAIL_USER is required." }),
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(1, { message: "ACCESS_TOKEN_SECRET is required." }),
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(1, { message: "REFRESH_TOKEN_SECRET is required." }),
  GITHUB_CLIENT_ID: z
    .string()
    .min(1, { message: "GITHUB_CLIENT_ID is required." }),
  GITHUB_CLIENT_SECRET: z
    .string()
    .min(1, { message: "GITHUB_CLIENT_SECRET is required." }),
});

export { envSchema };
