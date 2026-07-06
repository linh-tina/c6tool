import fs from "node:fs";
import type { Cookie } from "playwright";

import { COOKIES_PATH, SAME_SITE_MAP } from "../constants/constants";
import type { RawCookie } from "../types/types";

// ─── Normalize ────────────────────────────────────────────────────────────────

const normalizeOne = (raw: RawCookie): Cookie => ({
  name: raw.name,
  value: raw.value,
  domain: raw.domain,
  path: raw.path ?? "/",
  secure: raw.secure ?? false,
  httpOnly: raw.httpOnly ?? false,
  sameSite: SAME_SITE_MAP[raw.sameSite?.toLowerCase() ?? ""] ?? "None",
  // Playwright uses -1 to represent a session cookie with no expiry.
  expires: raw.expirationDate ?? -1,
});

// ─── Load ─────────────────────────────────────────────────────────────────────

export const loadCookies = (): Cookie[] => {
  if (!fs.existsSync(COOKIES_PATH)) {
    throw new Error(`Cookie file not found: ${COOKIES_PATH}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(COOKIES_PATH, "utf-8"));
  } catch {
    throw new Error("Cookie file is not valid JSON.");
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Cookie file is empty or not an array.");
  }

  return (parsed as RawCookie[]).map(normalizeOne);
};
