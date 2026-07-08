import { bootstrap } from "./main";

bootstrap().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to start: ${message}`);
  process.exitCode = 1;
});
