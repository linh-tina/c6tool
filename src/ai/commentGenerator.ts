import dictionary from "@vntk/dictionary";

import commentVariants from "../data/commentVariants.json";
import type { ResolvedConfig } from "../types/config";
import { log } from "../utils/logger";

export const DEFAULT_COMMENT = "Bạn này làm rẻ và đẹp nè bạn";

const PRICE_WORDS =
  /rẻ|giá|tiết kiệm|mềm|hợp lý|bình dân|hạt dẻ|đáng tiền|vừa túi tiền/i;
const QUALITY_WORDS = /đẹp|xinh|chất lượng|ưng|tuyệt|xịn|ổn|chỉn chu|bắt mắt/i;

const REQUIRED_DICTIONARY_WORDS = [
  "rẻ",
  "mềm",
  "hợp",
  "lý",
  "bình",
  "dân",
  "hạt",
  "dẻ",
  "đáng",
  "tiền",
  "tiết",
  "kiệm",
  "đẹp",
  "xinh",
  "chất",
  "lượng",
  "ổn",
  "xịn",
  "ưng",
  "chỉn",
  "chu",
  "bắt",
  "mắt",
  "tốt",
  "tuyệt",
] as const;

interface VietnameseDictionary {
  has(word: string): boolean;
}

const vietnameseDictionary = dictionary as VietnameseDictionary;

export const normalizeComment = (comment: string): string =>
  comment
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^['"“”]+|['"“”]+$/g, "")
    .replace(/[.\u2024\u2026\u3002\uff0e]+$/u, "")
    .trimEnd();

const wordCount = (comment: string): number =>
  normalizeComment(comment).split(/\s+/u).filter(Boolean).length;

const isValidComment = (comment: string, maxWords: number): boolean => {
  const normalized = normalizeComment(comment);
  if (!normalized || wordCount(normalized) > maxWords) return false;
  if (/https?:\/\/|www\.|#\w+/iu.test(normalized)) return false;
  return PRICE_WORDS.test(normalized) && QUALITY_WORDS.test(normalized);
};

const choose = <T>(values: readonly T[]): T | undefined =>
  values[Math.floor(Math.random() * values.length)];

export const COMMENT_VARIANTS = commentVariants.comments.map(normalizeComment);

const dictionarySupportsSynonyms = REQUIRED_DICTIONARY_WORDS.every((word) =>
  vietnameseDictionary.has(word),
);

export class CommentGenerator {
  private readonly recentComments = new Set<string>();

  public constructor(private readonly config: ResolvedConfig["aiComment"]) {}

  public async generate(sourceComment?: string): Promise<string | undefined> {
    if (!this.config.enabled) {
      return sourceComment ? normalizeComment(sourceComment) : undefined;
    }

    const source = normalizeComment(sourceComment || DEFAULT_COMMENT);
    if (!dictionarySupportsSynonyms) {
      log.warn(
        "Vietnamese synonym dictionary unavailable; using source comment.",
      );
      return source;
    }

    const candidates = COMMENT_VARIANTS.filter((comment) =>
      isValidComment(comment, this.config.maxWords),
    );
    const available = candidates.filter(
      (comment) => !this.recentComments.has(comment.toLocaleLowerCase("vi")),
    );
    const selected = choose(available.length > 0 ? available : candidates);

    if (!selected) {
      log.warn("Local synonym generation unavailable; using source comment.");
      return source;
    }

    this.recentComments.add(selected.toLocaleLowerCase("vi"));
    if (this.recentComments.size > 20) {
      const oldest = this.recentComments.values().next().value;
      if (oldest) this.recentComments.delete(oldest);
    }

    log.info(`Local synonym comment selected: ${selected}`);
    return selected;
  }
}
