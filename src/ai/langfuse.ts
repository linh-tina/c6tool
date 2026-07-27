import { randomUUID } from "node:crypto";

export interface LangfuseCredentials {
  baseUrl: string;
  publicKey: string;
  secretKey: string;
}

const authHeaders = (credentials: LangfuseCredentials): HeadersInit => ({
  authorization: `Basic ${Buffer.from(`${credentials.publicKey}:${credentials.secretKey}`).toString("base64")}`,
  "content-type": "application/json",
});

const apiUrl = (credentials: LangfuseCredentials, path: string): string =>
  `${credentials.baseUrl.replace(/\/$/, "")}/api/public${path}`;

export const saveLangfusePrompt = async (
  credentials: LangfuseCredentials,
  input: { name: string; prompt: string; labels?: string[] },
): Promise<void> => {
  const response = await fetch(apiUrl(credentials, "/v2/prompts"), {
    method: "POST",
    headers: authHeaders(credentials),
    body: JSON.stringify({
      name: input.name,
      type: "text",
      prompt: input.prompt,
      ...(input.labels && { labels: input.labels }),
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`Langfuse prompt save failed with HTTP ${response.status}`);
  }
};

export const recordLangfuseGeneration = async (
  credentials: LangfuseCredentials,
  input: {
    name: string;
    prompt: string;
    output?: string;
    model: string;
    promptName?: string;
    promptVersion?: number;
    metadata?: Record<string, unknown>;
    error?: string;
  },
): Promise<void> => {
  const now = new Date().toISOString();
  const traceId = randomUUID();
  const generationId = randomUUID();
  const body = {
    batch: [
      {
        id: randomUUID(),
        timestamp: now,
        event: "trace-create",
        body: { id: traceId, name: "c6tool-comment", timestamp: now },
      },
      {
        id: randomUUID(),
        timestamp: now,
        event: "generation-create",
        body: {
          id: generationId,
          traceId,
          name: input.name,
          input: input.prompt,
          ...(input.output !== undefined && { output: input.output }),
          model: input.model,
          ...(input.promptName && { promptName: input.promptName }),
          ...(input.promptVersion !== undefined && {
            promptVersion: input.promptVersion,
          }),
          ...(input.metadata && { metadata: input.metadata }),
          ...(input.error && { statusMessage: input.error, level: "ERROR" }),
          startTime: now,
          endTime: now,
        },
      },
    ],
  };

  const response = await fetch(apiUrl(credentials, "/ingestion"), {
    method: "POST",
    headers: authHeaders(credentials),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    throw new Error(`Langfuse generation recording failed with HTTP ${response.status}`);
  }
};
