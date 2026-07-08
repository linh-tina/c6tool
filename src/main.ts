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
  });

  await startCommentBot(config);
}
