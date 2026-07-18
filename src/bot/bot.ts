import { Markup, Telegraf, type Context } from "telegraf";

import { resolveConfig } from "../config/resolveConfig";
import { getMessages } from "../constants/messages";
import type { C6Config } from "../types/config";
import { postCommentOnFacebook } from "../playwright/commenter";
import { log } from "../utils/logger";

interface UserSession {
  step: "idle" | "waiting_link";
}

/**
 * Creates and launches the Telegram bot using the user-supplied config.
 * All comment text and tag settings come from `config` — nothing is hardcoded.
 *
 * @example
 * ```ts
 * import { startCommentBot } from "c6tool";
 *
 * startCommentBot({
 *   botToken:     process.env.BOT_TOKEN!,
 *   cookiesPath:  "./facebook_cookies.json",
 *   screenshotDir: "./screenshots",
 *   comment:      "This is a great post!",
 *   tagUser:      { uidOrName: "sample.account" },
 * });
 * ```
 */
export async function startCommentBot(config: C6Config): Promise<void> {
  const resolvedConfig = resolveConfig(config);
  const messages = getMessages(resolvedConfig.locale);
  const bot = new Telegraf(resolvedConfig.botToken);
  const userSessions = new Map<string, UserSession>();

  const isTelegramConflict = (error: unknown): boolean => {
    if (typeof error !== "object" || error === null) return false;

    const candidate = error as { response?: { error_code?: unknown } };
    return candidate.response?.error_code === 409;
  };

  const getSession = (chatId: string | number): UserSession => {
    const key = String(chatId);
    if (!userSessions.has(key)) {
      userSessions.set(key, { step: "idle" });
    }
    return userSessions.get(key)!;
  };

  const sendMainMenu = async (ctx: Context): Promise<void> => {
    await ctx.reply(
      [
        messages.bot.menuTitle,
        "",
        messages.bot.contentLabel(
          resolvedConfig.comment ?? messages.bot.emptyContent,
        ),
        resolvedConfig.tagUser
          ? messages.bot.tagLabel(resolvedConfig.tagUser.uidOrName)
          : messages.bot.tagNone,
        "",
        messages.bot.instruction,
      ].join("\n"),
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            messages.bot.inputLinkButton,
            "btn_input_link",
          ),
        ],
      ]),
    );
  };

  const runJob = async (ctx: Context, fbLink: string): Promise<void> => {
    await ctx.reply(messages.bot.processing(fbLink));
    const result = await postCommentOnFacebook(
      {
        fbLink,
        ...(resolvedConfig.comment && { comment: resolvedConfig.comment }),
        ...(resolvedConfig.screenshotDir && {
          screenshotDir: resolvedConfig.screenshotDir,
        }),
        ...(resolvedConfig.tagUser && { tagUser: resolvedConfig.tagUser }),
      },
      resolvedConfig.cookiesPath,
      resolvedConfig.locale,
      resolvedConfig.headless,
    );

    if (result.success) {
      await ctx.reply(
        `${messages.bot.success}` +
          (result.screenshotPath ? `\n📸 ${result.screenshotPath}` : ""),
      );
    } else {
      await ctx.reply(
        messages.bot.failure(result.error ?? messages.bot.unknownReason),
      );
    }
  };

  bot.start(async (ctx) => {
    userSessions.set(String(ctx.chat.id), { step: "idle" });
    await ctx.reply(messages.bot.welcome);
    await sendMainMenu(ctx);
  });

  bot.action("btn_input_link", async (ctx) => {
    if (!ctx.chat) return;
    getSession(ctx.chat.id).step = "waiting_link";
    await ctx.answerCbQuery();
    await ctx.reply(
      messages.bot.promptLink,
      Markup.inlineKeyboard([
        [Markup.button.callback(messages.bot.cancelButton, "btn_cancel")],
      ]),
    );
  });

  bot.action("btn_cancel", async (ctx) => {
    if (!ctx.chat) return;
    getSession(ctx.chat.id).step = "idle";
    await ctx.answerCbQuery();
    await sendMainMenu(ctx);
  });

  bot.on("text", async (ctx) => {
    const session = getSession(ctx.chat.id);
    const text = ctx.message.text.trim();
    const isLink = text.startsWith("http://") || text.startsWith("https://");

    if (session.step === "waiting_link" || isLink) {
      if (!isLink) {
        await ctx.reply(messages.bot.invalidLink);
        return;
      }
      session.step = "idle";
      void runJob(ctx, text).catch(async (error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        log.error(`Background comment job failed: ${message}`);
        try {
          await ctx.reply(messages.bot.failure(message));
        } catch (replyError) {
          log.error(
            `Could not report comment job failure: ${String(replyError)}`,
          );
        }
      });
      return;
    }

    await sendMainMenu(ctx);
  });

  try {
    await bot.launch();
  } catch (error) {
    if (isTelegramConflict(error)) {
      throw new Error(messages.bot.telegramConflict, { cause: error });
    }
    throw error;
  }
  console.log(messages.bot.ready);
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
