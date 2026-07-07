import { Markup, Telegraf, type Context } from "telegraf";

import { DEFAULT_COMMENT, TARGET_TAG_NAME } from "../constants/constants";
import { env } from "../config/env";
import { postCommentOnFacebook } from "../playwright/commenter";

const bot = new Telegraf(env.botToken);

// ─── Session ──────────────────────────────────────────────────────────────────

interface UserSession {
  step: "idle" | "waiting_link";
}

const userSessions = new Map<string, UserSession>();

const getSession = (chatId: string | number): UserSession => {
  const key = String(chatId);
  if (!userSessions.has(key)) {
    userSessions.set(key, { step: "idle" });
  }

  return userSessions.get(key)!;
};

// ─── Menu ─────────────────────────────────────────────────────────────────────

const sendMainMenu = async (ctx: Context): Promise<void> => {
  await ctx.reply(
    [
      "🤖 Bot Auto Comment & Tag",
      "",
      `💬 Nội dung: "${DEFAULT_COMMENT}"`,
      `👤 Tag: @${TARGET_TAG_NAME}`,
      "",
      "Bấm nút bên dưới hoặc gửi link trực tiếp để bắt đầu.",
    ].join("\n"),
    Markup.inlineKeyboard([
      [Markup.button.callback("🔗 Nhập Link Bài Viết", "btn_input_link")],
    ]),
  );
};

// ─── Handlers ─────────────────────────────────────────────────────────────────

const runJob = async (ctx: Context, fbLink: string): Promise<void> => {
  await ctx.reply(`⏳ Đang xử lý...\n🔗 ${fbLink}`);

  const result = await postCommentOnFacebook({
    fbLink,
    comment: DEFAULT_COMMENT,
    tagUser: { uidOrName: TARGET_TAG_NAME },
  });

  if (result.success) {
    await ctx.reply(
      `✅ Đã bình luận và tag thành công!` +
        (result.screenshotPath ? `\n📸 ${result.screenshotPath}` : ""),
    );
  } else {
    await ctx.reply(`❌ Thất bại: ${result.error ?? "Không rõ nguyên do"}`);
  }
};

// ─── Bot ──────────────────────────────────────────────────────────────────────

bot.start(async (ctx) => {
  userSessions.set(String(ctx.chat.id), { step: "idle" });
  await ctx.reply("👋 Chào mừng bạn đến với Bot Auto Comment & Tag!");
  await sendMainMenu(ctx);
});

bot.action("btn_input_link", async (ctx) => {
  if (!ctx.chat) return;
  getSession(ctx.chat.id).step = "waiting_link";
  await ctx.answerCbQuery();
  await ctx.reply(
    "🔗 Gửi link bài viết Facebook (http:// hoặc https://):",
    Markup.inlineKeyboard([[Markup.button.callback("❌ Hủy", "btn_cancel")]]),
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

  // Allow direct link input even when the button was not used.
  const isLink = text.startsWith("http://") || text.startsWith("https://");

  if (session.step === "waiting_link" || isLink) {
    if (!isLink) {
      await ctx.reply(
        "❌ Link không hợp lệ. Vui lòng gửi link bắt đầu bằng http:// hoặc https://",
      );
      return;
    }

    session.step = "idle";
    await runJob(ctx, text);
    return;
  }

  await sendMainMenu(ctx);
});

// ─── Launch ───────────────────────────────────────────────────────────────────

export async function startCommentBot(): Promise<void> {
  await bot.launch();
  console.log("🚀 Telegram Bot đã sẵn sàng!");
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
