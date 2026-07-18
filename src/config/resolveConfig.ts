import path from "node:path";
import { Locale, type C6Config, type ResolvedConfig } from "../types/config";

const DEFAULT_AI_MODEL = "gemini-3.5-flash";
const DEFAULT_LANGFUSE_CACHE_TTL_SECONDS = 300;
const DEFAULT_AI_VARIANTS = 5;
const DEFAULT_AI_MAX_WORDS = 20;

const boundedInteger = (
  value: number | undefined,
  fallback: number,
): number => {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(1, Math.floor(value!));
};

export const resolveConfig = (config: C6Config): ResolvedConfig => {
  if (!config.botToken?.trim()) {
    throw new Error("[c6tool] Missing required config field: botToken");
  }

  if (!config.cookiesPath?.trim()) {
    throw new Error("[c6tool] Missing required config field: cookiesPath");
  }

  return {
    botToken: config.botToken.trim(),
    cookiesPath: path.resolve(config.cookiesPath),
    ...(config.screenshotDir && {
      screenshotDir: path.resolve(config.screenshotDir),
    }),
    ...(config.comment && { comment: config.comment }),
    ...(config.tagUser && { tagUser: config.tagUser }),
    locale: config.locale === Locale.VN ? Locale.VN : Locale.EN,
    headless: config.headless ?? true,
    aiComment: {
      enabled: config.aiComment?.enabled ?? false,
      model: config.aiComment?.model?.trim() || DEFAULT_AI_MODEL,
      variants: Math.min(
        10,
        boundedInteger(config.aiComment?.variants, DEFAULT_AI_VARIANTS),
      ),
      maxWords: Math.min(
        20,
        boundedInteger(config.aiComment?.maxWords, DEFAULT_AI_MAX_WORDS),
      ),
      apiKey: config.aiComment?.apiKey?.trim() || "",
      langfusePromptName: config.aiComment?.langfusePromptName?.trim() || "",
      langfusePromptLabel:
        config.aiComment?.langfusePromptLabel?.trim() || "production",
      langfuseBaseUrl: config.aiComment?.langfuseBaseUrl?.trim() || "",
      langfusePublicKey: config.aiComment?.langfusePublicKey?.trim() || "",
      langfuseSecretKey: config.aiComment?.langfuseSecretKey?.trim() || "",
      langfuseCacheTtlSeconds: Math.min(
        3_600,
        boundedInteger(
          config.aiComment?.langfuseCacheTtlSeconds,
          DEFAULT_LANGFUSE_CACHE_TTL_SECONDS,
        ),
      ),
    },
  };
};
