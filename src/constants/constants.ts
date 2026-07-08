import type { Cookie } from "playwright";
import { Locale } from "../types/config";
import type { ChromeSameSite } from "../types/types";

export const TIMEOUT = {
  navigation: 20_000,
  comment: 12_000,
  verification: 8_000,
} as const;

export const DELAY = {
  afterLoad: [2_000, 4_000],
  afterScroll: [1_000, 2_500],
  beforeClick: [500, 1_200],
  afterClick: [1_000, 2_000],
  betweenKeypress: [60, 180],
  beforeSubmit: [1_500, 3_000],
  afterSubmit: [2_000, 4_000],
} as const satisfies Record<string, [number, number]>;

export const BROWSER_ARGS = [
  "--disable-blink-features=AutomationControlled",
  "--use-fake-ui-for-media-stream",
  "--no-sandbox",
] as const;

export const createContextOptions = (locale: Locale) =>
  ({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    locale: locale === Locale.VN ? "vi-VN" : "en-US",
    timezoneId: "Asia/Ho_Chi_Minh",
  }) as const;

/** URL patterns indicating expired cookies or a checkpoint. */
export const AUTH_FAILURE_PATTERNS = ["/login", "checkpoint"] as const;

export const SAME_SITE_MAP: Record<ChromeSameSite, Cookie["sameSite"]> = {
  no_restriction: "None",
  lax: "Lax",
  strict: "Strict",
  unspecified: "None",
};
