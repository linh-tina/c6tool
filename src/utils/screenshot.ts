import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";

/**
 * @param page         - Playwright page to screenshot.
 * @param label        - Filename prefix (e.g. "success", "err_no_comment_box").
 * @param screenshotDir - Directory to save into (from ResolvedConfig).
 */
export const captureScreenshot = async (
  page: Page,
  label: string,
  screenshotDir: string,
): Promise<string> => {
  await mkdir(screenshotDir, { recursive: true });

  const filename = `${label}_${Date.now()}.png`;
  const filepath = path.join(screenshotDir, filename);

  await page.screenshot({ path: filepath });

  return filepath;
};
