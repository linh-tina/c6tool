import "dotenv/config";

import { startCommentBot } from "./bot/bot";
import { resolveConfig } from "./config/resolveConfig";
import { Locale } from "./types/config";

export async function bootstrap() {
  const config = resolveConfig({
    botToken: process.env.BOT_TOKEN ?? "",
    cookiesPath: process.env.COOKIES_PATH ?? "",
    ...(process.env.SCREENSHOT_DIR && {
      screenshotDir: process.env.SCREENSHOT_DIR,
    }),
    ...(process.env.DEFAULT_COMMENT && {
      comment: process.env.DEFAULT_COMMENT,
    }),
    ...(process.env.TAG_USER && {
      tagUser: { uidOrName: process.env.TAG_USER },
    }),
    locale: process.env.LOCALE?.toLowerCase() === "vn" ? Locale.VN : Locale.EN,
    ...(process.env.PLAYWRIGHT_HEADLESS !== undefined && {
      headless: process.env.PLAYWRIGHT_HEADLESS.toLowerCase() !== "false",
    }),
    aiComment: {
      enabled: process.env.AI_COMMENT_ENABLED?.toLowerCase() === "true",
      ...(process.env.GEMINI_MODEL && {
        model: process.env.GEMINI_MODEL,
      }),
      ...(process.env.AI_COMMENT_VARIANTS && {
        variants: Number(process.env.AI_COMMENT_VARIANTS),
      }),
      ...(process.env.AI_COMMENT_MAX_WORDS && {
        maxWords: Number(process.env.AI_COMMENT_MAX_WORDS),
      }),
      ...(process.env.GEMINI_API_KEY && {
        apiKey: process.env.GEMINI_API_KEY,
      }),
      ...(process.env.LANGFUSE_PROMPT_NAME && {
        langfusePromptName: process.env.LANGFUSE_PROMPT_NAME,
      }),
      ...(process.env.LANGFUSE_PROMPT_LABEL && {
        langfusePromptLabel: process.env.LANGFUSE_PROMPT_LABEL,
      }),
      ...(process.env.LANGFUSE_BASE_URL && {
        langfuseBaseUrl: process.env.LANGFUSE_BASE_URL,
      }),
      ...(process.env.LANGFUSE_PUBLIC_KEY && {
        langfusePublicKey: process.env.LANGFUSE_PUBLIC_KEY,
      }),
      ...(process.env.LANGFUSE_SECRET_KEY && {
        langfuseSecretKey: process.env.LANGFUSE_SECRET_KEY,
      }),
      ...(process.env.LANGFUSE_PROMPT_CACHE_TTL_SECONDS && {
        langfuseCacheTtlSeconds: Number(
          process.env.LANGFUSE_PROMPT_CACHE_TTL_SECONDS,
        ),
      }),
    },
  });

  await startCommentBot(config);
}
