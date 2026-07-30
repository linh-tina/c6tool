#!/usr/bin/env bash

set -euo pipefail

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is required." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required." >&2
  exit 1
fi

if [[ ! -f package.json ]]; then
  echo "Error: run preflight.sh from the package root containing package.json." >&2
  exit 1
fi

node -e '
  const pkg = require("./package.json");
  const missing = ["name", "version"].filter((key) => !pkg[key]);
  if (missing.length) {
    console.error(`Error: package.json is missing ${missing.join(", ")}.`);
    process.exit(1);
  }
  if (pkg.private === true) {
    console.error("Error: package.json is private and must not be published.");
    process.exit(1);
  }
  if (!pkg.scripts || !pkg.scripts.build) {
    console.error("Error: package.json must define a build script.");
    process.exit(1);
  }
'

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Error: lint-staged validation requires a git worktree." >&2
  exit 1
fi

if git diff --cached --quiet; then
  echo "Error: no staged release files; lint-staged would validate nothing." >&2
  exit 1
fi

if [[ ! -x node_modules/.bin/lint-staged ]]; then
  echo "Error: local lint-staged is not installed. Install dependencies first." >&2
  exit 1
fi

echo "==> Running lint-staged"
npm exec --no -- lint-staged

echo "==> Running build"
npm run build

echo "==> Inspecting npm package contents"
npm pack --dry-run

echo "==> NPM release preflight passed"
