---
name: npm-release
description: Prepare, validate, version, and publish JavaScript or TypeScript packages to npmjs.com. Use when Codex is asked to release, publish, upload, bump, or ship a new npm package version, including SemVer selection, README maintenance, lint-staged checks, builds, package dry-runs, npm authentication, interactive 2FA/OTP handling, dist-tags, publication, and post-publish verification.
---

# NPM Release

Release an npm package only after its documentation, staged-file checks, build,
and package contents pass validation. Keep unrelated user changes out of the
release.

## Safety rules

- Treat `npm publish`, git pushes, and overwriting an existing version as
  external or irreversible actions.
- Never print or read npm tokens from `.npmrc`, environment variables, or secret
  stores. Use `npm whoami --registry=https://registry.npmjs.org` to check auth.
- Never ask the user to paste an OTP into chat or put an OTP in a command
  argument. Let npm prompt for it inside an interactive terminal.
- Never use `--force` to bypass an existing npm version.
- Do not publish if the worktree contains unexplained changes that overlap the
  release. Preserve unrelated changes and stage only explicit release files.
- Show the package name, old version, new version, registry, access, and dist-tag
  immediately before publishing. If the user's current request did not clearly
  authorize publication, ask for confirmation at that point.
- Stop on every failed gate. Do not publish first and report validation errors
  afterward.

## 1. Inspect the package

1. Locate the package root containing `package.json`. For a workspace, identify
   the exact package requested and run all commands from that package root.
2. Read `package.json`, the lockfile, `README.md`, npm configuration that does
   not expose secrets, and the relevant git status/diff.
3. Confirm `name`, current `version`, `private`, `files`, `main`, `types`,
   `exports`, `scripts`, `publishConfig`, and workspace settings.
4. Stop if `private` is `true`, the package name is unclear, or the configured
   registry is not the intended npm registry.
5. Query published state without changing it:

   ```bash
   npm view <package-name> version --registry=https://registry.npmjs.org
   npm view <package-name> versions --json --registry=https://registry.npmjs.org
   ```

   A 404 is acceptable only for a confirmed first publication.

## 2. Choose and apply the SemVer bump

Follow npm SemVer:

- `patch`: backward-compatible fix or maintenance (`1.2.3` → `1.2.4`)
- `minor`: backward-compatible feature (`1.2.3` → `1.3.0`)
- `major`: breaking public API or behavior (`1.2.3` → `2.0.0`)
- prerelease: use `prepatch`, `preminor`, `premajor`, or `prerelease` with an
  explicit identifier such as `beta` or `rc`

Honor an explicit bump requested by the user. Otherwise infer it from the
user-facing diff; default to `patch` only when the changes are clearly fixes or
maintenance. Ask when the diff implies a breaking/feature choice that cannot be
resolved safely.

Apply the version through npm so `package.json` and supported lockfiles stay in
sync:

```bash
npm version <patch|minor|major> --no-git-tag-version
npm version <prepatch|preminor|premajor|prerelease> \
  --preid=<beta|rc> --no-git-tag-version
```

Do not create a git commit or tag unless the user requests it. Confirm the new
version does not already exist on npm.

## 3. Update README

Review `README.md` against the actual package API and the release diff.

- Update pinned install commands, version badges, compatibility requirements,
  exported APIs, environment variables, examples, and migration notes affected
  by the release.
- Document user-visible features or breaking changes succinctly.
- Do not invent a changelog or add meaningless version text merely to force a
  README diff. If no documentation is affected, state that the README was
  reviewed and remains correct.
- Re-run documentation examples or typecheck them when the repository provides
  a supported command.

## 4. Stage only the release files

Inspect `git diff` first. Stage exact paths belonging to this release, including
versioned manifests, lockfiles, README changes, and intended source changes.
Never use a broad `git add .` in a dirty worktree.

`lint-staged` only checks staged files. Ensure at least one intended file is
staged; otherwise its success would not validate the release.

## 5. Run release gates

Run the bundled preflight from the package root:

```bash
bash <skill-directory>/scripts/preflight.sh
```

The script requires and runs:

1. local `lint-staged` against the staged release files;
2. the package's `build` script;
3. `npm pack --dry-run` to inspect publishable contents.

Also run project-specific `test`, `typecheck`, or `check` scripts when present
and not already covered by the build. After lint-staged applies fixes, inspect
the diff and re-stage only those intended fixes. Repeat preflight if the staged
content changed.

Review the dry-run file list. Stop for missing entry points/type declarations,
secret files, screenshots, cookies, `.env` files, excessive artifacts, or an
empty package.

## 6. Authenticate and prepare publication

Run:

```bash
npm whoami --registry=https://registry.npmjs.org
npm view <package-name>@<new-version> version \
  --registry=https://registry.npmjs.org
```

Treat `E404 No match found for version` from the second command as the expected
"available to publish" result, not as a release failure. Stop for authentication,
network, or registry errors that are not `E404`. Determine publication arguments:

- Stable versions use dist-tag `latest`.
- Prereleases use a non-`latest` tag matching the identifier, normally `beta`,
  `next`, or `rc`.
- For a first public scoped package, use `--access public`; otherwise respect
  `publishConfig.access` and existing package visibility.
- Always pass the intended registry explicitly.

Present a compact release summary and obtain confirmation when publication was
not already explicitly authorized.

## 7. Publish and verify

Prefer the bundled interactive publisher:

```bash
bash <skill-directory>/scripts/publish-interactive.sh \
  --tag=<latest|next|beta|rc> [--access=public]
```

Run it in a real TTY. When npm challenges for two-factor authentication, npm
prompts for the OTP directly in that terminal. Do not relay the OTP through the
agent conversation or include `--otp=<code>` because that can expose the code in
chat, process lists, or shell history.

If the agent environment cannot accept secure interactive input, stop before
publishing and instruct the user to run the command above in their own terminal.
Afterward, resume at verification. For unattended releases, recommend npm
trusted publishing; alternatively use a preconfigured granular access token
with bypass 2FA only when the package's publishing policy permits tokens. Never
create, retrieve, or echo a token as part of this skill.

Do not retry blindly after an ambiguous network failure. Query npm first to see
whether the version was accepted. Registry reads may briefly return `E404`
immediately after npm reports `+ <package>@<version>`; retry only the read-only
verification with a short bounded delay. Never retry `npm publish` in response
to propagation delay.

Verify:

```bash
npm view <package-name>@<new-version> version \
  --registry=https://registry.npmjs.org
npm view <package-name> dist-tags --json \
  --registry=https://registry.npmjs.org
```

Report the published package/version, dist-tag, registry, validation commands,
README outcome, and any remaining local changes. Only create or push a git
commit/tag when separately requested.

## Preflight script

- Use `scripts/preflight.sh` for deterministic local validation. It intentionally
  does not bump versions, authenticate, commit, tag, push, or publish.
- Use `scripts/publish-interactive.sh` for the final availability check,
  interactive npm publish, and post-publish verification. Run it with
  `--dry-run` to test packaging without changing the registry.
