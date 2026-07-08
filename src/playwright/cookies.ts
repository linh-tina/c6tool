import fs from "node:fs";
import type { Cookie } from "playwright";

import { SAME_SITE_MAP } from "../constants/constants";
import { getMessages } from "../constants/messages";
import { Locale } from "../types/config";
import type { RawCookie } from "../types/types";

const normalizeOne = (raw: RawCookie): Cookie => ({
  name: raw.name,
  value: raw.value,
  domain: raw.domain,
  path: raw.path ?? "/",
  secure: raw.secure ?? false,
  httpOnly: raw.httpOnly ?? false,
  sameSite: SAME_SITE_MAP[raw.sameSite?.toLowerCase() ?? ""] ?? "None",
  expires: raw.expirationDate ?? -1,
});

/**
 * Loads and normalises Facebook cookies from the path provided by the user.
 *
 * @param cookiesPath - Absolute path to the cookies JSON file (from ResolvedConfig).
 */
export const loadCookies = (cookiesPath: string, locale: Locale): Cookie[] => {
  const messages = getMessages(locale);

  if (!fs.existsSync(cookiesPath)) {
    throw new Error(
      `${messages.cookies.fileNotFound(cookiesPath)}\n${messages.cookies.hint}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(cookiesPath, "utf-8"));
  } catch {
    throw new Error(messages.cookies.invalidJson(cookiesPath));
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(messages.cookies.emptyArray(cookiesPath));
  }

  return (parsed as RawCookie[]).map(normalizeOne);
};
