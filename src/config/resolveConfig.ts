import path from "node:path";
import { Locale, type C6Config, type ResolvedConfig } from "../types/config";

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
  };
};
