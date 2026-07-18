import type { ResolvedConfig } from "../types/config";
import { log } from "../utils/logger";

export const DEFAULT_COMMENT = "Bạn này làm rẻ và đẹp nè bạn";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: unknown }>;
    };
  }>;
  error?: { message?: string };
}

interface GeneratedCommentsPayload {
  comments?: unknown;
}

interface LangfusePromptResponse {
  prompt?: unknown;
  error?: { message?: string };
}

const PRICE_WORDS = /rẻ|giá|tiết kiệm|mềm|hợp lý|bình dân|hạt dẻ|đáng tiền/i;
const QUALITY_WORDS = /đẹp|xinh|chất lượng|ưng|tuyệt|xịn|ổn/i;

const normalizeComment = (comment: string): string =>
  comment
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^['"“”]+|['"“”]+$/g, "");

const wordCount = (comment: string): number =>
  normalizeComment(comment).split(/\s+/u).filter(Boolean).length;

const isValidComment = (comment: string, maxWords: number): boolean => {
  const normalized = normalizeComment(comment);
  if (!normalized || wordCount(normalized) > maxWords) return false;
  if (/https?:\/\/|www\.|#\w+/iu.test(normalized)) return false;
  return PRICE_WORDS.test(normalized) && QUALITY_WORDS.test(normalized);
};

const parseComments = (raw: unknown): string[] => {
  if (typeof raw !== "string") return [];

  const text = raw.trim();
  const candidates = [
    text,
    text.replace(/^```(?:json)?\s*|\s*```$/gi, "").trim(),
  ];
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) candidates.push(objectMatch[0]);

  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      const comments = Array.isArray(parsed)
        ? parsed
        : (parsed as GeneratedCommentsPayload | null)?.comments;

      if (Array.isArray(comments)) {
        return comments.filter(
          (comment): comment is string => typeof comment === "string",
        );
      }
    } catch {
      // Try the next common Gemini response format.
    }
  }

  return [];
};

const describeGenerationError = (error: unknown): string => {
  if (error instanceof TypeError && error.message === "fetch failed") {
    return "Không kết nối được Gemini API. Kiểm tra mạng và GEMINI_API_KEY.";
  }
  return String(error);
};

const compilePrompt = (
  template: string,
  variables: Record<"sourceComment" | "maxWords" | "variants", string>,
): string =>
  template.replace(
    /{{\s*(sourceComment|maxWords|variants)\s*}}/g,
    (_, key: keyof typeof variables) => variables[key],
  );

export class CommentGenerator {
  private readonly recentComments = new Set<string>();
  private cachedPrompt: { template: string; expiresAt: number } | null = null;

  public constructor(private readonly config: ResolvedConfig["aiComment"]) {}

  private async getPromptTemplate(): Promise<string> {
    if (this.cachedPrompt && this.cachedPrompt.expiresAt > Date.now()) {
      return this.cachedPrompt.template;
    }

    const {
      langfuseBaseUrl,
      langfusePromptLabel,
      langfusePromptName,
      langfusePublicKey,
      langfuseSecretKey,
    } = this.config;
    if (
      !langfuseBaseUrl ||
      !langfusePromptName ||
      !langfusePublicKey ||
      !langfuseSecretKey
    ) {
      throw new Error(
        "Langfuse configuration is incomplete. Set LANGFUSE_BASE_URL, LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, and LANGFUSE_PROMPT_NAME.",
      );
    }

    const baseUrl = langfuseBaseUrl.replace(/\/$/, "");
    const promptUrl = new URL(
      `/api/public/v2/prompts/${encodeURIComponent(langfusePromptName)}`,
      baseUrl,
    );
    promptUrl.searchParams.set("label", langfusePromptLabel);

    const credentials = Buffer.from(
      `${langfusePublicKey}:${langfuseSecretKey}`,
    ).toString("base64");
    const response = await fetch(promptUrl, {
      headers: { authorization: `Basic ${credentials}` },
      signal: AbortSignal.timeout(10_000),
    });
    const payload = (await response.json()) as LangfusePromptResponse;
    if (!response.ok) {
      throw new Error(
        payload.error?.message || `Langfuse returned HTTP ${response.status}`,
      );
    }
    if (typeof payload.prompt !== "string" || !payload.prompt.trim()) {
      throw new Error("Langfuse prompt must be a non-empty text prompt.");
    }

    this.cachedPrompt = {
      template: payload.prompt,
      expiresAt: Date.now() + this.config.langfuseCacheTtlSeconds * 1_000,
    };
    return payload.prompt;
  }

  public async generate(sourceComment?: string): Promise<string | undefined> {
    if (!this.config.enabled) return sourceComment;

    const source = normalizeComment(sourceComment || DEFAULT_COMMENT);
    if (!this.config.apiKey) {
      log.warn("GEMINI_API_KEY is missing; using source comment.");
      return sourceComment || DEFAULT_COMMENT;
    }

    try {
      const promptTemplate = await this.getPromptTemplate();
      const prompt = compilePrompt(promptTemplate, {
        sourceComment: source,
        maxWords: String(this.config.maxWords),
        variants: String(this.config.variants),
      });
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.config.model)}:generateContent`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.config.apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.9,
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(20_000),
      });

      const payload = (await response.json()) as GeminiResponse;
      if (!response.ok) {
        throw new Error(
          payload.error?.message || `Gemini returned HTTP ${response.status}`,
        );
      }

      const rawText = payload.candidates?.[0]?.content?.parts
        ?.map((part) => (typeof part.text === "string" ? part.text : ""))
        .join("");
      const candidates = parseComments(rawText)
        .map(normalizeComment)
        .filter((comment) => isValidComment(comment, this.config.maxWords));

      const available = candidates.filter((comment) => {
        const key = comment.toLocaleLowerCase("vi");
        return !this.recentComments.has(key);
      });
      const selected = available[0] ?? candidates[0];

      if (!selected) {
        throw new Error("Gemini returned no valid comments");
      }

      this.recentComments.add(selected.toLocaleLowerCase("vi"));
      if (this.recentComments.size > 20) {
        const oldest = this.recentComments.values().next().value;
        if (oldest) this.recentComments.delete(oldest);
      }
      log.info(`AI comment selected: ${selected}`);
      return selected;
    } catch (error) {
      log.warn(
        `AI comment generation unavailable; using source comment. ${describeGenerationError(error)}`,
      );
      return sourceComment || DEFAULT_COMMENT;
    }
  }
}
