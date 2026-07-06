import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";

import { SCREENSHOT_DIR } from "../constants/constants";

// ─── Capture ──────────────────────────────────────────────────────────────────

export const captureScreenshot = async (
  page: Page,
  label: string,
): Promise<string> => {
  await mkdir(SCREENSHOT_DIR, { recursive: true });

  const filename = `${label}_${Date.now()}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  await page.screenshot({ path: filepath });

  return filepath;
};
