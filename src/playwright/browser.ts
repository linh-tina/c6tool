import { chromium } from "playwright";
import type { Browser, BrowserContext } from "playwright";

import { BROWSER_ARGS, createContextOptions } from "../constants/constants";
import { Locale } from "../types/config";
import { loadCookies } from "./cookies";

export interface BrowserHandle {
  browser: Browser;
  context: BrowserContext;
}

/**
 * @param cookiesPath - Absolute path to the Facebook cookies file (from ResolvedConfig).
 */
export const createBrowserHandle = async (
  cookiesPath: string,
  locale: Locale,
): Promise<BrowserHandle> => {
  const browser = await chromium.launch({
    headless: true,
    args: [...BROWSER_ARGS],
  });

  const context = await browser.newContext(createContextOptions(locale));

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  await context.addCookies(loadCookies(cookiesPath, locale));

  return { browser, context };
};

export const closeBrowserHandle = async ({
  browser,
  context,
}: Partial<BrowserHandle>): Promise<void> => {
  await context?.close();
  await browser?.close();
};
