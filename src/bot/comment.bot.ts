import { Telegraf, Markup, Context } from "telegraf";
import "dotenv/config";

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN chưa được cấu hình trong .env");
}

const bot = new Telegraf(BOT_TOKEN);

// 1. Định nghĩa cấu trúc rõ ràng cho Session công việc
interface UserSession {
  step: "idle" | "waiting_link";
  fbLink: string | null;
  selectedComment: string | null;
}

// Định nghĩa Record chứa session của toàn bộ user với key là chatId (string)
const userSessions: Record<string, UserSession> = {};

const COMMENT_TEMPLATES: string[] = [
  "bài viết hay quá",
  "bài viết thật tệ",
  "đỉnh quá shop ơi",
  "qua đây làm nè",
];

// Escape ký tự đặc biệt cho MarkdownV2
const escapeMD = (text: string): string =>
  text.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, "\\$&");

const shortenLink = (link: string, maxLen = 40): string => {
  if (link.length <= maxLen) return link;
  return link.slice(0, maxLen - 3) + "...";
};

// Ép kiểu cụ thể cho giá trị trả về của session
const getSession = (chatId: string | number): UserSession => {
  const key = chatId.toString();
  if (!userSessions[key]) {
    userSessions[key] = {
      step: "idle",
      fbLink: null,
      selectedComment: null,
    };
  }
  return userSessions[key];
};

// 2. Thay vì dùng `any` cho ctx, sử dụng `Context` chuẩn của Telegraf
const sendMainMenu = async (ctx: Context): Promise<void> => {
  if (!ctx.chat) return;
  const session = getSession(ctx.chat.id);

  const linkStatus = session.fbLink ? "✅" : "⭕";
  const commentStatus = session.selectedComment ? "✅" : "⭕";
  const readyToRun = session.fbLink && session.selectedComment;

  const rawLines = [
    "🤖 BOT AUTO COMMENT",
    "━━━━━━━━━━━━━━━━━━",
    "",
    `${linkStatus} Link bài viết`,
    session.fbLink ? `   └ ${shortenLink(session.fbLink)}` : "   └ Chưa nhập",
    "",
    `${commentStatus} Nội dung comment`,
    session.selectedComment
      ? `   └ "${session.selectedComment}"`
      : "   └ Chưa chọn",
    "",
    "━━━━━━━━━━━━━━━━━━",
    readyToRun
      ? "🟢 Sẵn sàng! Bấm Xác Nhận để chạy."
      : "🟡 Vui lòng hoàn tất cấu hình bên dưới.",
  ];

  const statusText = escapeMD(rawLines.join("\n"))
    .replace(
      escapeMD("🤖 BOT AUTO COMMENT"),
      `*${escapeMD("🤖 BOT AUTO COMMENT")}*`,
    )
    .replace(
      escapeMD(`${linkStatus} Link bài viết`),
      `*${escapeMD(`${linkStatus} Link bài viết`)}*`,
    )
    .replace(
      escapeMD(`${commentStatus} Nội dung comment`),
      `*${escapeMD(`${commentStatus} Nội dung comment`)}*`,
    );

  const buttons = [
    [
      Markup.button.callback(
        `${linkStatus} Nhập Link Bài Viết`,
        "btn_input_link",
      ),
    ],
    [
      Markup.button.callback(
        `${commentStatus} Chọn Mẫu Nội Dung`,
        "btn_select_comment",
      ),
    ],
    [
      Markup.button.callback(
        readyToRun ? "🚀 Xác Nhận & Chạy" : "⚙️ Cấu Hình & Xác Nhận",
        "btn_config_confirm",
      ),
    ],
    [Markup.button.callback("🔄 Làm Mới Cấu Hình", "btn_reset")],
  ];

  await ctx.replyWithMarkdownV2(statusText, Markup.inlineKeyboard(buttons));
};

const sendCommentMenu = async (ctx: Context): Promise<void> => {
  if (!ctx.chat) return;
  const session = getSession(ctx.chat.id);

  const buttons = COMMENT_TEMPLATES.map((comment, index) => {
    const isSelected = session.selectedComment === comment;
    return [
      Markup.button.callback(
        `${isSelected ? "✅ " : ""}${comment}`,
        `comment_${index}`,
      ),
    ];
  });

  buttons.push([Markup.button.callback("⬅️ Quay lại Menu", "btn_back_main")]);

  await ctx.reply(
    "💬 Chọn mẫu nội dung comment bên dưới:",
    Markup.inlineKeyboard(buttons),
  );
};

bot.start(async (ctx) => {
  const chatId = ctx.chat.id;
  userSessions[chatId.toString()] = {
    step: "idle",
    fbLink: null,
    selectedComment: null,
  };
  await ctx.reply("👋 Chào mừng bạn đến với Bot Auto Comment!");
  await sendMainMenu(ctx);
});

bot.action("btn_input_link", async (ctx) => {
  if (!ctx.chat) return;
  const session = getSession(ctx.chat.id);
  session.step = "waiting_link";
  await ctx.answerCbQuery();
  await ctx.reply(
    "🔗 Vui lòng gửi link bài viết\n(bắt đầu bằng http:// hoặc https://)",
    Markup.inlineKeyboard([
      [Markup.button.callback("❌ Hủy", "btn_back_main")],
    ]),
  );
});

bot.action("btn_select_comment", async (ctx) => {
  await ctx.answerCbQuery();
  await sendCommentMenu(ctx);
});

bot.action("btn_back_main", async (ctx) => {
  if (!ctx.chat) return;
  const session = getSession(ctx.chat.id);
  session.step = "idle";
  await ctx.answerCbQuery();
  await sendMainMenu(ctx);
});

bot.action("btn_reset", async (ctx) => {
  if (!ctx.chat) return;
  const chatId = ctx.chat.id;
  userSessions[chatId.toString()] = {
    step: "idle",
    fbLink: null,
    selectedComment: null,
  };
  await ctx.answerCbQuery("Đã làm mới cấu hình");
  await sendMainMenu(ctx);
});

bot.action("btn_config_confirm", async (ctx) => {
  if (!ctx.chat) return;
  const session = getSession(ctx.chat.id);

  if (!session.fbLink || !session.selectedComment) {
    await ctx.answerCbQuery("⚠️ Chưa đủ thông tin!", { show_alert: true });
    return;
  }

  await ctx.answerCbQuery();

  await ctx.reply(
    `✅ XÁC NHẬN CẤU HÌNH\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🔗 Link: ${shortenLink(session.fbLink)}\n` +
      `💬 Nội dung: "${session.selectedComment}"\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `🚀 Đang xử lý...`,
  );
});

// 3. Sử dụng Narrowing Type bằng cách kiểm tra 'match' để lấy Regex index an toàn
bot.action(/^comment_(\d+)$/, async (ctx) => {
  if (!ctx.chat || !ctx.match) return;
  const session = getSession(ctx.chat.id);
  const index = Number(ctx.match[1]);

  session.selectedComment = COMMENT_TEMPLATES[index] as string;

  await ctx.answerCbQuery("✅ Đã chọn");
  await sendCommentMenu(ctx);
});

// 4. Sử dụng ctx.has để thu hẹp kiểu dữ liệu tin nhắn (Message.TextMessage)
bot.on("text", async (ctx) => {
  const session = getSession(ctx.chat.id);

  if (session.step === "waiting_link") {
    const text = ctx.message.text;
    if (text.startsWith("http://") || text.startsWith("https://")) {
      session.fbLink = text;
      session.step = "idle";
      await ctx.reply("✅ Đã lưu link thành công!");
      await sendMainMenu(ctx);
    } else {
      await ctx.reply(
        "❌ Link không hợp lệ.\nVui lòng gửi lại link bắt đầu bằng http:// hoặc https://",
      );
    }
  } else {
    await sendMainMenu(ctx);
  }
});

export async function startCommentBot(): Promise<void> {
  await bot.launch();
  console.log("🚀 Telegram Bot đã sẵn sàng chạy!");
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
}
