import assert from "node:assert/strict";
import test from "node:test";

import { configFromEnv } from "../config/fromEnv";
import { resolveConfig } from "../config/resolveConfig";
import type { ResolvedConfig } from "../types/config";
import {
  COMMENT_VARIANTS,
  CommentGenerator,
  normalizeComment,
} from "./commentGenerator";

const PRICE_WORDS =
  /rẻ|giá|tiết kiệm|mềm|hợp lý|bình dân|hạt dẻ|đáng tiền|vừa túi tiền/i;
const QUALITY_WORDS = /đẹp|xinh|chất lượng|ưng|tuyệt|xịn|ổn|chỉn chu|bắt mắt/i;

test("normalizeComment removes terminal periods", () => {
  assert.equal(normalizeComment("Giá rẻ và đẹp."), "Giá rẻ và đẹp");
  assert.equal(normalizeComment("Giá rẻ và đẹp..."), "Giá rẻ và đẹp");
  assert.equal(normalizeComment("Giá rẻ và đẹp…"), "Giá rẻ và đẹp");
  assert.equal(normalizeComment('"Giá rẻ và đẹp."'), "Giá rẻ và đẹp");
});

test("normalizeComment preserves other terminal punctuation", () => {
  assert.equal(normalizeComment("Giá rẻ và đẹp!"), "Giá rẻ và đẹp!");
  assert.equal(normalizeComment("Giá rẻ và đẹp?"), "Giá rẻ và đẹp?");
});

test("configures local synonym generation from environment variables", () => {
  const config = resolveConfig(
    configFromEnv({
      BOT_TOKEN: "bot-token",
      COOKIES_PATH: "./cookies.json",
      AI_COMMENT_ENABLED: "true",
      AI_COMMENT_VARIANTS: "7",
      AI_COMMENT_MAX_WORDS: "15",
      GEMINI_API_KEY: "ignored",
      DEEPSEEK_API_KEY: "ignored",
      OPENAI_API_KEY: "ignored",
    }),
  );

  assert.deepEqual(config.aiComment, {
    enabled: true,
    variants: 7,
    maxWords: 15,
  });
});

test("loads exactly 100 unique comments from JSON", () => {
  assert.equal(COMMENT_VARIANTS.length, 100);
  assert.equal(new Set(COMMENT_VARIANTS).size, 100);
});

test("generates a valid local comment without calling a remote API", async (t) => {
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => {
    fetchCalls += 1;
    throw new Error("Remote API must not be called");
  };

  const config: ResolvedConfig["aiComment"] = {
    enabled: true,
    variants: 5,
    maxWords: 20,
  };
  const comment = await new CommentGenerator(config).generate(
    "Bạn này làm rẻ và đẹp nè bạn",
  );

  assert.ok(comment);
  assert.match(comment, PRICE_WORDS);
  assert.match(comment, QUALITY_WORDS);
  assert.ok(comment.split(/\s+/u).length <= 20);
  assert.ok(COMMENT_VARIANTS.includes(comment));
  assert.equal(fetchCalls, 0);
});

test("randomly selects comments without repeating recent choices", async () => {
  const config: ResolvedConfig["aiComment"] = {
    enabled: true,
    variants: 5,
    maxWords: 20,
  };
  const generator = new CommentGenerator(config);
  const comments = await Promise.all(
    Array.from({ length: 10 }, () =>
      generator.generate("Bạn này làm rẻ và đẹp nè bạn"),
    ),
  );

  assert.equal(new Set(comments).size, 10);
});

test("uses the normalized source comment when local generation is disabled", async () => {
  const config: ResolvedConfig["aiComment"] = {
    enabled: false,
    variants: 5,
    maxWords: 20,
  };

  const comment = await new CommentGenerator(config).generate(
    '"Giá rẻ và đẹp..."',
  );

  assert.equal(comment, "Giá rẻ và đẹp");
});
