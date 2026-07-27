import type { C6Config } from "../types/config";
import { Locale } from "../types/config";

const optional = (value: string | undefined): string | undefined =>
  value?.trim() || undefined;

const boolean = (value: string | undefined, fallback: boolean): boolean => {
  if (value === undefined) return fallback;
  return value.trim().toLowerCase() === "true";
};

const number = (value: string | undefined): number | undefined => {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const configFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
): C6Config => {
  const screenshotDir = optional(env.SCREENSHOT_DIR);
  const comment = optional(env.DEFAULT_COMMENT);
  const tagUser = optional(env.TAG_USER);
  const model = optional(env.GEMINI_MODEL);
  const variants = number(env.AI_COMMENT_VARIANTS);
  const maxWords = number(env.AI_COMMENT_MAX_WORDS);
  const apiKey = optional(env.GEMINI_API_KEY);
  const promptName = optional(env.LANGFUSE_PROMPT_NAME);
  const promptLabel = optional(env.LANGFUSE_PROMPT_LABEL);
  const baseUrl = optional(env.LANGFUSE_BASE_URL);
  const publicKey = optional(env.LANGFUSE_PUBLIC_KEY);
  const secretKey = optional(env.LANGFUSE_SECRET_KEY);
  const cacheTtl = number(env.LANGFUSE_PROMPT_CACHE_TTL_SECONDS);

  return {
    botToken: env.BOT_TOKEN ?? "",
    cookiesPath: env.COOKIES_PATH ?? "",
    ...(screenshotDir && { screenshotDir }),
    ...(comment && { comment }),
    ...(tagUser && { tagUser: { uidOrName: tagUser } }),
    locale: env.LOCALE?.trim().toLowerCase() === "vn" ? Locale.VN : Locale.EN,
    headless: boolean(env.PLAYWRIGHT_HEADLESS, true),
    aiComment: {
      enabled: boolean(env.AI_COMMENT_ENABLED, false),
      ...(model && { model }),
      ...(variants !== undefined && { variants }),
      ...(maxWords !== undefined && { maxWords }),
      ...(apiKey && { apiKey }),
      ...(promptName && { langfusePromptName: promptName }),
      ...(promptLabel && { langfusePromptLabel: promptLabel }),
      ...(baseUrl && { langfuseBaseUrl: baseUrl }),
      ...(publicKey && { langfusePublicKey: publicKey }),
      ...(secretKey && { langfuseSecretKey: secretKey }),
      ...(cacheTtl !== undefined && { langfuseCacheTtlSeconds: cacheTtl }),
      ...(env.LANGFUSE_TRACE_ENABLED !== undefined && {
        langfuseTracingEnabled: boolean(env.LANGFUSE_TRACE_ENABLED, true),
      }),
    },
  };
};
