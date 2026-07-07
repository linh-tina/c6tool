import { startCommentBot } from "./bot/bot";

async function main() {
  await startCommentBot();
}

main().catch((error) => {
  console.error("Failed to start:", error);
  process.exitCode = 1;
});
