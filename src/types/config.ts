/**
 * Configuration object passed by the user when initialising c6tool.
 * Only `botToken` and `cookiesPath` are required.
 */
export enum Locale {
  VN = "vn",
  EN = "en",
}

export interface AICommentConfig {
  /** Enable local AI comment variation generation. */
  enabled?: boolean;
  /** Gemini model name, for example `gemini-3.5-flash`. */
  model?: string;
  /** Number of variants requested from the model. */
  variants?: number;
  /** Maximum number of words allowed in each generated comment. */
  maxWords?: number;
  /** Gemini API key. Prefer setting this through GEMINI_API_KEY. */
  apiKey?: string;
  /** Langfuse prompt name used to generate the Gemini input. */
  langfusePromptName?: string;
  /** Langfuse prompt label, usually `production`. */
  langfusePromptLabel?: string;
  /** Langfuse Cloud or self-hosted base URL. */
  langfuseBaseUrl?: string;
  /** Langfuse project public key. */
  langfusePublicKey?: string;
  /** Langfuse project secret key. */
  langfuseSecretKey?: string;
  /** Runtime cache duration for the prompt in seconds. */
  langfuseCacheTtlSeconds?: number;
}

export interface C6Config {
  /** Telegram Bot token obtained from @BotFather. */
  botToken: string;

  /**
   * Absolute (or cwd-relative) path to the Facebook cookies JSON file
   * exported from the browser.
   *
   * @example "/home/user/data/facebook_cookies.json"
   */
  cookiesPath: string;

  /**
   * Directory where screenshots are saved.
   */
  screenshotDir?: string;

  /**
   * Comment content to post.
   * Omit this field to skip typing a comment body.
   */
  comment?: string;

  /**
   * Facebook account to tag in every comment.
   * Omit this field to disable tagging.
   */
  tagUser?: {
    /** Username or UID visible in the Facebook mention popup. */
    uidOrName: string;
  };

  /**
   * UI language for all bot messages and logs.
   * Defaults to `en`.
   */
  locale?: Locale;

  /**
   * Whether to run Chromium without a visible window.
   * Defaults to true. Set to false when debugging locally.
   */
  headless?: boolean;

  /** Optional Gemini comment generation settings. */
  aiComment?: AICommentConfig;
}

/**
 * Same as C6Config but with all optional fields filled in.
 * Created by `resolveConfig()` — consumers never construct this directly.
 */
export interface ResolvedConfig {
  botToken: string;
  cookiesPath: string;
  screenshotDir?: string;
  comment?: string;
  tagUser?: { uidOrName: string };
  locale: Locale;
  headless: boolean;
  aiComment: {
    enabled: boolean;
    model: string;
    variants: number;
    maxWords: number;
    apiKey: string;
    langfusePromptName: string;
    langfusePromptLabel: string;
    langfuseBaseUrl: string;
    langfusePublicKey: string;
    langfuseSecretKey: string;
    langfuseCacheTtlSeconds: number;
  };
}
