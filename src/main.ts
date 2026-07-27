import "dotenv/config";

import { startCommentBot } from "c6tool";
import { CommentGenerator } from "./ai/commentGenerator";
import { configFromEnv } from "./config/fromEnv";
import { resolveConfig } from "./config/resolveConfig";

export async function bootstrap(): Promise<void> {
  const config = resolveConfig(configFromEnv());
  const comment = await new CommentGenerator(config.aiComment).generate(
    config.comment,
  );

  await startCommentBot({
    botToken: config.botToken,
    cookiesPath: config.cookiesPath,
    ...(config.screenshotDir && { screenshotDir: config.screenshotDir }),
    ...(comment && { comment }),
    ...(config.tagUser && { tagUser: config.tagUser }),
    locale: config.locale,
    headless: config.headless,
  });
}
