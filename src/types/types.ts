export interface CommentJob {
  fbLink: string;
  comment?: string;
  screenshotDir?: string;
  tagUser?: {
    uidOrName: string;
  };
}

export type CommentResult =
  | { success: true; screenshotPath: string | null }
  | { success: false; screenshotPath: string | null; error: string };

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
