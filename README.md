# c6tool

`c6tool` is a small npm library for launching a Telegram bot that posts a Facebook comment through Playwright.

It is designed as a library first:

- import `startCommentBot()` from the package root
- configure language with `Locale.EN` or `Locale.VN`
- keep the bot text, errors, and logs in a single message catalog

---

## Install

```bash
pnpm add c6tool
```

or

```bash
npm install c6tool
```

---

## Quick Start

```ts
import { Locale, startCommentBot } from "c6tool";

await startCommentBot({
  botToken: process.env.BOT_TOKEN!,
  cookiesPath: "./cookies.json",
  comment: "This is a great post!",
  tagUser: { uidOrName: "sample.account" },
  screenshotDir: "./screenshots",
  locale: Locale.EN,
});
```

If you want Vietnamese output, switch to:

```ts
locale: Locale.VN;
```

---

## What This Package Does

1. Starts a Telegram bot.
2. Waits for a Facebook post link.
3. Loads Facebook cookies from a JSON file.
4. Opens the post in Playwright.
5. Types the configured comment.
6. Optionally tags one Facebook account.
7. Returns success or failure back to Telegram.
8. Optionally saves a screenshot.

---

## Public API

The package root exports the following:

```ts
import {
  Locale,
  resolveConfig,
  startCommentBot,
  type C6Config,
  type ResolvedConfig,
} from "c6tool";
```

### `startCommentBot(config)`

Starts the Telegram bot and keeps it running.

### `resolveConfig(config)`

Normalises and validates the config.

### `Locale`

Language enum used by the bot and all user-facing messages:

- `Locale.EN`
- `Locale.VN`

---

## Config

```ts
export interface C6Config {
  botToken: string;
  cookiesPath: string;
  screenshotDir?: string;
  comment?: string;
  tagUser?: {
    uidOrName: string;
  };
  locale?: Locale;
}
```

### Required Fields

- `botToken`: Telegram bot token from `@BotFather`
- `cookiesPath`: path to the Facebook cookies JSON file

### Optional Fields

- `screenshotDir`: directory used to save screenshots
- `comment`: text to post as the comment
- `tagUser`: Facebook account to tag in the comment
- `locale`: UI language, defaults to `Locale.EN`
- `headless`: run Chromium without a visible window, defaults to `true`. Set to `false` to watch Playwright while testing.
- `aiComment`: optionally generate short Vietnamese comment variants through Gemini.

### Defaults

- `locale` defaults to `en`
- if `comment` is omitted, the bot will not type a comment body
- if `tagUser` is omitted, the bot will not attempt tagging

---

## Environment Variables

When running the local bot entrypoint, the following env vars are used:

- `BOT_TOKEN`
- `COOKIES_PATH`
- `SCREENSHOT_DIR` optional
- `DEFAULT_COMMENT` optional
- `TAG_USER` optional
- `LOCALE` optional, defaults to `en`, set to `vn` for Vietnamese output
- `PLAYWRIGHT_HEADLESS` optional
- `AI_COMMENT_ENABLED` optional
- `GEMINI_MODEL` optional, defaults to `gemini-3.5-flash`
- `GEMINI_API_KEY` required when AI comments are enabled

Example:

```env
BOT_TOKEN=123456:abc...
COOKIES_PATH=./cookies.json
SCREENSHOT_DIR=./screenshots
DEFAULT_COMMENT=This is a great post!
TAG_USER=sample.account
LOCALE=en
PLAYWRIGHT_HEADLESS=false
AI_COMMENT_ENABLED=true
AI_COMMENT_VARIANTS=5
AI_COMMENT_MAX_WORDS=20
GEMINI_MODEL=gemini-3.5-flash
GEMINI_API_KEY=your-key-here
```

To show the Playwright Chromium window during local testing, set `PLAYWRIGHT_HEADLESS=false` and run `pnpm dev` (or `npm run dev`).

### Gemini AI comments

Set a Gemini API key in `.env`:

```env
AI_COMMENT_ENABLED=true
GEMINI_MODEL=gemini-3.5-flash
GEMINI_API_KEY=your-key-here
```

Set `AI_COMMENT_ENABLED=true` to generate comment variants from `DEFAULT_COMMENT`. If `DEFAULT_COMMENT` is omitted, c6tool uses `Bạn này làm rẻ và đẹp nè bạn` as the source sentence. Every generated comment is validated to be no longer than 20 words, contain the price/value and quality meaning, and avoid links or hashtags. If Gemini is unavailable or returns invalid output, c6tool falls back to the source comment. Keep the API key only in `.env`; never commit it.

### Langfuse prompt management

The Gemini input is fetched from Langfuse instead of being hardcoded. The prompt can be fully self-contained or use these optional variables:

```text
{{sourceComment}}
{{maxWords}}
{{variants}}
```

Configure the prompt and project credentials in `.env`:

```env
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PROMPT_NAME=random-comment
LANGFUSE_PROMPT_LABEL=production
LANGFUSE_PROMPT_CACHE_TTL_SECONDS=300
```

The app fetches the labeled Langfuse prompt with Basic Auth, compiles any of the optional variables above, and caches it for 300 seconds. If Langfuse cannot be reached or the prompt is not a text prompt, c6tool safely uses the source comment instead. The `random-comment` prompt in this project is currently available with the `latest` label; assign it the `production` label in Langfuse before changing the environment back to `production`.

---

## Running Locally

For local development, the repo runs the CLI bootstrap:

```bash
pnpm dev
```

or

```bash
pnpm start
```

The library entry point is still `src/index.ts`, and the CLI bootstrap is separate.

---

## Behavior Notes

- The bot accepts direct link input or the menu button.
- The bot uses the language selected by `locale`.
- If the cookies file is missing or invalid, startup fails with a clear error.
- If another instance is already polling the same Telegram bot token, you will get a friendly `409 Conflict` message.
- If a comment cannot be verified in the DOM, the bot still returns success but marks the screenshot as `warn_unverified`.

---

## Troubleshooting

### `409 Conflict`

This means another bot instance is already running with the same token.

Stop the other instance before starting `c6tool` again.

### Cookie file not found

Make sure `cookiesPath` points to a real JSON file, for example:

```ts
cookiesPath: "./cookies.json";
```

If the file name is wrong, fix the spelling and try again.

---

## Notes

- This project uses Playwright and Telegram long polling.
- The package is published as a CommonJS library with `exports` and `types` configured in `package.json`.
- User-facing text is centralized in `src/constants/messages.ts`.
