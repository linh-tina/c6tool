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
  const variants = number(env.AI_COMMENT_VARIANTS);
  const maxWords = number(env.AI_COMMENT_MAX_WORDS);

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
      ...(variants !== undefined && { variants }),
      ...(maxWords !== undefined && { maxWords }),
    },
  };
};
