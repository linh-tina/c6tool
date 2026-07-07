// ─── Job ──────────────────────────────────────────────────────────────────────

export interface CommentJob {
  fbLink: string;
  comment: string;
  tagUser?: {
    uidOrName: string;
  };
}

// ─── Result ───────────────────────────────────────────────────────────────────

export type CommentResult =
  | { success: true; screenshotPath: string }
  | { success: false; screenshotPath: string | null; error: string };

// ─── Internal ─────────────────────────────────────────────────────────────────

/** sameSite value exported by the Chrome extension */
export type ChromeSameSite =
  "no_restriction" | "lax" | "strict" | "unspecified" | string;

export interface RawCookie {
  name: string;
  value: string;
  domain: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: ChromeSameSite;
  expirationDate?: number;
}
