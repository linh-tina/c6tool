import { chromium } from "playwright";
import type { Browser, BrowserContext } from "playwright";

import { BROWSER_ARGS, CONTEXT_OPTIONS } from "../constants/constants";
import { loadCookies } from "./cookies";

export interface BrowserHandle {
  browser: Browser;
  context: BrowserContext;
}

// ─── Factory ──────────────────────────────────────────────────────────────────

export const createBrowserHandle = async (): Promise<BrowserHandle> => {
  const browser = await chromium.launch({
    headless: true,
    args: [...BROWSER_ARGS],
  });

  const context = await browser.newContext(CONTEXT_OPTIONS);

  // Remove webdriver traces from every frame before page scripts run.
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  await context.addCookies(loadCookies());

  return { browser, context };
};

// ─── Teardown ─────────────────────────────────────────────────────────────────

export const closeBrowserHandle = async ({
  browser,
  context,
}: Partial<BrowserHandle>): Promise<void> => {
  await context?.close();
  await browser?.close();
};
