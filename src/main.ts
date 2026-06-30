import { startCommentBot } from "./bot/comment.bot";

async function main() {
  await startCommentBot();
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
