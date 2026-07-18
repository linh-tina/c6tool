import { Locale } from "../types/config";

export type MessageBundle = {
  bot: {
    menuTitle: string;
    emptyContent: string;
    contentLabel: (content: string) => string;
    tagLabel: (tag: string) => string;
    tagNone: string;
    instruction: string;
    inputLinkButton: string;
    processing: (link: string) => string;
    success: string;
    failure: (error: string) => string;
    unknownReason: string;
    welcome: string;
    promptLink: string;
    cancelButton: string;
    invalidLink: string;
    ready: string;
    telegramConflict: string;
  };
  commenter: {
    foundCommentBox: (selector: string) => string;
    opening: (fbLink: string) => string;
    cookieExpired: string;
    noCommentBox: string;
    typingComment: string;
    taggingAccount: (targetName: string) => string;
    tagSelected: (targetName: string) => string;
    tagFallback: string;
    tagFailed: (error: string) => string;
    submitted: string;
    verifiedSuccess: string;
    verifiedWarn: string;
    unexpectedError: (error: string) => string;
    browserClosed: string;
  };
  cookies: {
    fileNotFound: (cookiesPath: string) => string;
    invalidJson: (cookiesPath: string) => string;
    emptyArray: (cookiesPath: string) => string;
    hint: string;
  };
  facebook: {
    commentBoxSelectors: readonly string[];
  };
};

export const MESSAGE_BUNDLES: Record<Locale, MessageBundle> = {
  [Locale.EN]: {
    bot: {
      menuTitle: "🤖 Auto Comment & Tag Bot",
      emptyContent: "(empty)",
      contentLabel: (content: string) => `💬 Content: "${content}"`,
      tagLabel: (tag: string) => `👤 Tag: @${tag}`,
      tagNone: "👤 Tag: (none)",
      instruction: "Press the button below or send a link directly to start.",
      inputLinkButton: "🔗 Enter Post Link",
      processing: (link: string) => `⏳ Processing...\n🔗 ${link}`,
      success: "✅ Comment and tag sent successfully!",
      failure: (error: string) => `❌ Failed: ${error}`,
      unknownReason: "Unknown reason",
      welcome: "👋 Welcome to Auto Comment & Tag Bot!",
      promptLink: "🔗 Send the Facebook post link (http:// or https://):",
      cancelButton: "❌ Cancel",
      invalidLink:
        "❌ Invalid link. Please send a link starting with http:// or https://",
      ready: "🚀 Telegram Bot is ready!",
      telegramConflict:
        "Another bot instance is already running with this token. Stop the other instance before starting c6tool again.",
    },
    commenter: {
      foundCommentBox: (selector: string) => `Found comment box: ${selector}`,
      opening: (fbLink: string) => `Opening: ${fbLink}`,
      cookieExpired: "Cookie expired or account checkpointed.",
      noCommentBox: "Could not find the comment input.",
      typingComment: "Typing comment body...",
      taggingAccount: (targetName: string) =>
        `Simulating tag for account: @${targetName}`,
      tagSelected: (targetName: string) => `Selected tag: ${targetName}`,
      tagFallback: "Could not click the option, using Tab as fallback.",
      tagFailed: (error: string) => `Tag selection failed: ${error}`,
      submitted: "Comment submitted, waiting for confirmation...",
      verifiedSuccess: "Comment posted successfully.",
      verifiedWarn: "Submitted but could not confirm the comment on the page.",
      unexpectedError: (error: string) => `Unexpected error: ${error}`,
      browserClosed: "Browser closed.",
    },
    cookies: {
      fileNotFound: (cookiesPath: string) =>
        `[c6tool] Không tìm thấy file cookie: ${cookiesPath}`,
      invalidJson: (cookiesPath: string) =>
        `[c6tool] File cookie không phải JSON hợp lệ: ${cookiesPath}`,
      emptyArray: (cookiesPath: string) =>
        `[c6tool] File cookie trống hoặc không phải mảng: ${cookiesPath}`,
      hint: "Gợi ý: xuất cookie Facebook của bạn và trỏ `cookiesPath` đến file đó.",
    },
    facebook: {
      commentBoxSelectors: [
        '[contenteditable="true"][role="textbox"][aria-label^="Write a comment" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Write a public comment" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Leave a comment" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Add a comment" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Comment as" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Viết bình luận" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Để lại bình luận" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Thêm bình luận" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Bình luận dưới tên" i]',
        '[contenteditable="true"][role="textbox"][aria-placeholder*="comment" i]',
        '[contenteditable="true"][role="textbox"][aria-placeholder*="bình luận" i]',
        '[contenteditable="true"][role="textbox"][placeholder*="comment" i]',
        '[contenteditable="true"][role="textbox"][placeholder*="bình luận" i]',
        '[contenteditable="true"][role="textbox"][data-placeholder*="comment" i]',
        '[contenteditable="true"][role="textbox"][data-placeholder*="bình luận" i]',
        '[contenteditable="true"][role="textbox"][data-lexical-editor="true"]',
        '[contenteditable="true"][role="textbox"]',
      ] as const,
    },
  },
  [Locale.VN]: {
    bot: {
      menuTitle: "🤖 Bot Auto Comment & Tag",
      emptyContent: "(trống)",
      contentLabel: (content: string) => `💬 Nội dung: "${content}"`,
      tagLabel: (tag: string) => `👤 Tag: @${tag}`,
      tagNone: "👤 Tag: (không có)",
      instruction: "Bấm nút bên dưới hoặc gửi link trực tiếp để bắt đầu.",
      inputLinkButton: "🔗 Nhập Link Bài Viết",
      processing: (link: string) => `⏳ Đang xử lý...\n🔗 ${link}`,
      success: "✅ Đã bình luận và tag thành công!",
      failure: (error: string) => `❌ Thất bại: ${error}`,
      unknownReason: "Không rõ nguyên do",
      welcome: "👋 Chào mừng bạn đến với Bot Auto Comment & Tag!",
      promptLink: "🔗 Gửi link bài viết Facebook (http:// hoặc https://):",
      cancelButton: "❌ Hủy",
      invalidLink:
        "❌ Link không hợp lệ. Vui lòng gửi link bắt đầu bằng http:// hoặc https://",
      ready: "🚀 Telegram Bot đã sẵn sàng!",
      telegramConflict:
        "Một bot khác đang chạy với token này. Hãy dừng instance đó trước khi khởi động c6tool lại.",
    },
    commenter: {
      foundCommentBox: (selector: string) =>
        `Tìm thấy ô bình luận: ${selector}`,
      opening: (fbLink: string) => `Đang mở: ${fbLink}`,
      cookieExpired: "Cookie hết hạn hoặc tài khoản bị checkpoint.",
      noCommentBox: "Không tìm thấy ô nhập bình luận.",
      typingComment: "Đang nhập nội dung bình luận...",
      taggingAccount: (targetName: string) =>
        `Mô phỏng tag tài khoản: @${targetName}`,
      tagSelected: (targetName: string) =>
        `Đã tìm thấy và click chọn tag: ${targetName}`,
      tagFallback: "Không bắt được element, nhấn Tab dự phòng để chọn tag.",
      tagFailed: (error: string) => `Thao tác chọn thẻ tag thất bại: ${error}`,
      submitted: "Đã gửi bình luận, đang chờ xác nhận...",
      verifiedSuccess: "Bình luận đã được đăng thành công.",
      verifiedWarn: "Đã gửi nhưng chưa xác nhận được bình luận trên trang.",
      unexpectedError: (error: string) => `Lỗi không mong đợi: ${error}`,
      browserClosed: "Trình duyệt đã đóng.",
    },
    cookies: {
      fileNotFound: (cookiesPath: string) =>
        `[c6tool] Cookie file not found: ${cookiesPath}`,
      invalidJson: (cookiesPath: string) =>
        `[c6tool] Cookie file is not valid JSON: ${cookiesPath}`,
      emptyArray: (cookiesPath: string) =>
        `[c6tool] Cookie file is empty or not an array: ${cookiesPath}`,
      hint: "Hint: export your Facebook cookies and point cookiesPath to the file.",
    },
    facebook: {
      commentBoxSelectors: [
        '[contenteditable="true"][role="textbox"][aria-label^="Viết bình luận" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Để lại bình luận" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Thêm bình luận" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Bình luận dưới tên" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Write a comment" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Write a public comment" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Leave a comment" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Add a comment" i]',
        '[contenteditable="true"][role="textbox"][aria-label^="Comment as" i]',
        '[contenteditable="true"][role="textbox"][aria-placeholder*="bình luận" i]',
        '[contenteditable="true"][role="textbox"][aria-placeholder*="comment" i]',
        '[contenteditable="true"][role="textbox"][placeholder*="bình luận" i]',
        '[contenteditable="true"][role="textbox"][placeholder*="comment" i]',
        '[contenteditable="true"][role="textbox"][data-placeholder*="bình luận" i]',
        '[contenteditable="true"][role="textbox"][data-placeholder*="comment" i]',
        '[contenteditable="true"][role="textbox"][data-lexical-editor="true"]',
        '[contenteditable="true"][role="textbox"]',
      ] as const,
    },
  },
} as const;

export const getMessages = (locale: Locale): MessageBundle =>
  MESSAGE_BUNDLES[locale] ?? MESSAGE_BUNDLES[Locale.EN];
