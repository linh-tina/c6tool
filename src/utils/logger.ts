const timestamp = (): string => new Date().toISOString();

const writeLog = (
  level: "info" | "ok" | "warn" | "error" | "step",
  message: string,
): void => {
  const prefix = `[${timestamp()}]`;
  const output = `${prefix} ${
    {
      info: "ℹ️",
      ok: "✅",
      warn: "⚠️",
      error: "❌",
      step: "▶",
    }[level]
  } ${message}`;

  if (level === "warn") {
    console.warn(output);
    return;
  }

  if (level === "error") {
    console.error(output);
    return;
  }

  console.log(output);
};

export const log = {
  info: (message: string) => writeLog("info", message),
  ok: (message: string) => writeLog("ok", message),
  warn: (message: string) => writeLog("warn", message),
  error: (message: string) => writeLog("error", message),
  step: (message: string) => writeLog("step", message),
};
