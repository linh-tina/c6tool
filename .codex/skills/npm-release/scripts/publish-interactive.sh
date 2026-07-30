#!/usr/bin/env bash

set -euo pipefail

readonly REGISTRY="https://registry.npmjs.org"
tag="latest"
access=""
dry_run=false

usage() {
  cat <<'EOF'
Usage: publish-interactive.sh [--tag TAG] [--access public|restricted] [--dry-run]

Publishes the package in the current directory to npmjs. For accounts requiring
2FA, run this script in a real terminal so npm can prompt for the OTP securely.

Options:
  --tag TAG          npm dist-tag (default: latest)
  --access VALUE     public or restricted
  --dry-run          validate publication without changing npmjs
  -h, --help         show this help
EOF
}

while (($# > 0)); do
  case "$1" in
    --tag)
      [[ $# -ge 2 ]] || {
        echo "Error: --tag requires a value." >&2
        exit 2
      }
      tag="$2"
      shift 2
      ;;
    --tag=*)
      tag="${1#*=}"
      shift
      ;;
    --access)
      [[ $# -ge 2 ]] || {
        echo "Error: --access requires a value." >&2
        exit 2
      }
      access="$2"
      shift 2
      ;;
    --access=*)
      access="${1#*=}"
      shift
      ;;
    --dry-run)
      dry_run=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$tag" ]]; then
  echo "Error: --tag must not be empty." >&2
  exit 2
fi

if [[ "$access" != "" && "$access" != "public" && "$access" != "restricted" ]]; then
  echo "Error: --access must be public or restricted." >&2
  exit 2
fi

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Error: node and npm are required." >&2
  exit 1
fi

if [[ ! -f package.json ]]; then
  echo "Error: run this script from the package root containing package.json." >&2
  exit 1
fi

if [[ "$dry_run" == false && ! -t 0 ]]; then
  echo "Error: interactive publication requires a real terminal for a possible npm OTP prompt." >&2
  echo "Run this script directly in your terminal, or configure npm trusted publishing." >&2
  exit 2
fi

node -e '
  const pkg = require("./package.json");
  if (!pkg.name || !pkg.version || pkg.private === true) process.exit(1);
' || {
  echo "Error: package.json must have name/version and must not be private." >&2
  exit 1
}

readonly package_name="$(node -p 'require("./package.json").name')"
readonly package_version="$(node -p 'require("./package.json").version')"
readonly package_spec="${package_name}@${package_version}"

echo "==> Authenticating with npmjs"
npm whoami --registry="$REGISTRY"

echo "==> Checking whether ${package_spec} already exists"
view_status=0
view_output="$(npm view "$package_spec" version --registry="$REGISTRY" 2>&1)" ||
  view_status=$?

if ((view_status == 0)); then
  echo "Error: ${package_spec} already exists and cannot be overwritten." >&2
  exit 1
fi

if [[ "$view_output" != *"E404"* ]]; then
  echo "$view_output" >&2
  echo "Error: could not confirm version availability." >&2
  exit "$view_status"
fi

publish_args=(
  publish
  --registry="$REGISTRY"
  --tag="$tag"
)

if [[ "$access" != "" ]]; then
  publish_args+=(--access="$access")
fi

if [[ "$dry_run" == true ]]; then
  publish_args+=(--dry-run)
fi

echo "==> Publishing ${package_spec} with dist-tag ${tag}"
npm "${publish_args[@]}"

if [[ "$dry_run" == true ]]; then
  echo "==> Dry run passed; npmjs was not changed"
  exit 0
fi

echo "==> Verifying ${package_spec}"
verified_version=false
for attempt in 1 2 3 4 5; do
  if npm view "$package_spec" version --registry="$REGISTRY" --prefer-online; then
    verified_version=true
    break
  fi

  if ((attempt < 5)); then
    echo "Registry has not propagated the version yet; retrying verification (${attempt}/5)..."
    sleep 3
  fi
done

if [[ "$verified_version" != true ]]; then
  echo "Error: npm accepted the publish, but the version is not visible yet." >&2
  echo "Do not publish again; query ${package_spec} later." >&2
  exit 1
fi

verified_tag=false
for attempt in 1 2 3 4 5; do
  published_tag="$(
    npm view "$package_name" "dist-tags.${tag}" \
      --registry="$REGISTRY" --prefer-online 2>/dev/null || true
  )"

  if [[ "$published_tag" == "$package_version" ]]; then
    verified_tag=true
    break
  fi

  if ((attempt < 5)); then
    echo "Registry has not propagated dist-tag ${tag} yet; retrying verification (${attempt}/5)..."
    sleep 3
  fi
done

if [[ "$verified_tag" != true ]]; then
  echo "Error: ${package_spec} exists, but dist-tag ${tag} is not verified yet." >&2
  exit 1
fi

npm view "$package_name" dist-tags --json --registry="$REGISTRY" --prefer-online

echo "==> Published and verified ${package_spec}"
