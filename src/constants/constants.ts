import path from "node:path";
import type { Cookie } from "playwright";

import type { ChromeSameSite } from "../types/types";

// ─── Paths ────────────────────────────────────────────────────────────────────

export const COOKIES_PATH = path.join(
  process.cwd(),
  "src/playwright/facebook_cookies.json",
);
export const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "src/constants/screenshots",
);

// ─── Timeouts (ms) ────────────────────────────────────────────────────────────

export const TIMEOUT = {
  navigation: 20_000,
  comment: 12_000,
  verification: 8_000,
} as const;

// ─── Human Simulation Delays (ms) ─────────────────────────────────────────────

export const DELAY = {
  afterLoad: [2_000, 4_000],
  afterScroll: [1_000, 2_500],
  beforeClick: [500, 1_200],
  afterClick: [1_000, 2_000],
  betweenKeypress: [60, 180],
  beforeSubmit: [1_500, 3_000],
  afterSubmit: [2_000, 4_000],
} as const satisfies Record<string, [number, number]>;

// ─── Browser ──────────────────────────────────────────────────────────────────

export const BROWSER_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--use-fake-ui-for-media-stream",
  "--no-sandbox",
] as const;

export const CONTEXT_OPTIONS = {
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  viewport: { width: 1366, height: 768 },
  deviceScaleFactor: 1,
  isMobile: false,
  hasTouch: false,
  locale: "vi-VN",
  timezoneId: "Asia/Ho_Chi_Minh",
} as const;

// ─── Facebook Selectors ───────────────────────────────────────────────────────

/** Try each selector in order — Facebook changes aria-label by language and version. */
export const COMMENT_BOX_SELECTORS = [
  '[aria-label="Viết bình luận…"]',
  '[aria-label="Write a comment…"]',
  '[contenteditable="true"][role="textbox"]',
] as const;

/** URL patterns indicating expired cookies or a checkpoint. */
export const AUTH_FAILURE_PATTERNS = ["/login", "checkpoint"] as const;

// ─── sameSite Map ─────────────────────────────────────────────────────────────

export const SAME_SITE_MAP: Record<ChromeSameSite, Cookie["sameSite"]> = {
  no_restriction: "None",
  lax: "Lax",
  strict: "Strict",
  unspecified: "None",
};

export const DEFAULT_COMMENT = "Bạn này làm rẻ và đẹp nè bạn ";
export const TARGET_TAG_NAME = "quynhnhu.17101999";
