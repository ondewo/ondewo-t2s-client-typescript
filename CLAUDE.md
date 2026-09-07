# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Working Principles

Behavioral guidelines to reduce common mistakes. They bias toward caution over speed; for trivial tasks, use judgment.

### Think before coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### Simplicity first

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### Surgical changes

Touch only what you must. Clean up only your own mess.

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that _your_ changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: every changed line should trace directly to the user's request.

### Goal-driven execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## Git Commits

- **Never include Claude as author or co-author** in commit messages, PR descriptions, or any other text. Do not add
  `Co-Authored-By: Claude…` trailers, "Generated with Claude Code" footers, or any similar attribution.
- The user's own git author identity (already configured in git) is the only identity that should appear on commits.
- This rule overrides the default Claude Code commit-template guidance.
- **Never prepend the JIRA ticket ID** (e.g. `[OND231-624]`) to the commit subject yourself. The `giticket` commit-msg
  hook reads the ticket from the branch name (`(feature|bugfix|support|hotfix)/<TICKET>-…`) and prepends `[<ticket>]`
  automatically. Writing the prefix manually produces `[OND231-624] [OND231-624] feat: …`. Write a plain Conventional
  Commits subject (`feat: …`, `fix(scope): …`, `docs: …`) and let the hook decorate it.

## What this repo is

`@ondewo/t2s-client-typescript` — a TypeScript gRPC-web SDK for the ONDEWO T2S API. About 95% of the tree is generated
protobuf/gRPC-web stubs; the hand-written surface is small and is the only thing that is linted, tested and gated.

| Path | Status |
| --- | --- |
| `auth/offlineTokenProvider.ts` + `.spec.ts` | hand-written — the D18 Keycloak ROPC + `offline_access` token provider |
| `examples/ts-client.ts` + `.spec.ts`, `examples/environment.env` | hand-written — runnable example + its unit tests |
| `Makefile`, `tsconfig*.json`, `package.json`, `.ci-package.json`, `.husky/*`, `.github/workflows/tests.yml` | hand-written |
| `api/**` | **generated** by the proto-compiler docker image — never edit, never test, excluded from every hook |
| `public-api.js`, `public-api.d.ts` | **generated** — they re-export `api/` only; there is no auth export in them (that is a proto-compiler 5.13.0 codegen feature this client has not been regenerated with) |
| `src/ondewo-t2s-api` (submodule, `tags/6.6.0`) | the `.proto` source the stubs are built from |
| `ondewo-proto-compiler` (submodule, `tags/5.14.0`) | the codegen toolchain |

Node on this machine is v24 (nvm); CI uses Node 20. There is no Python in this repo — `uvx pre-commit …` works directly,
no `uv run --frozen` wrapper is needed (unlike the two `*-client-python` repos).

## Tests and the coverage gate

```shell
npm install --no-audit --no-fund
npm test          # pretest (tsc) -> c8 -> node --test, 100% lines/branches/functions
npm run test:drift  # package.json still agrees with .ci-package.json
make eslint       # 10 `no-ternary` WARNINGS, 0 errors -> exit 0
make prettier     # --check only; PRETTIER_WRITE=-w to fix
```

- **`pretest`** is `rm -rf .test-build && tsc -p tsconfig.test.json && cp -R api .test-build/api`. The wipe matters: a
  stale `.test-build` artifact from a deleted source would otherwise still be measured. The `api/` copy is what makes the
  compiled example's `require('../api/…')` resolve.
- **`tsconfig.test.json` uses a GLOB (`include: ["auth/**/*.ts", "examples/**/*.ts"]`), never a `files` list.** That glob
  is the mechanism by which the gate notices a new source file. Do not convert it to explicit entries.
- **The gate is `c8 --check-coverage --lines 100 --branches 100 --functions 100 --all --src .test-build` over
  `.test-build/{auth,examples}/**/*.js`, minus `*.spec.js`.** `--all` is what makes a source that no test ever loads show
  up at 0% instead of being invisible. Verified: dropping an untested `auth/probeUntested.ts` in takes the run to 99.56%
  lines / 95% functions and exit 1.
- c8 maps coverage back through the source maps, so the report names `offlineTokenProvider.ts` / `ts-client.ts`, not the
  compiled `.js`.
- **There is exactly one coverage exclusion**, and it is a line-scoped `/* c8 ignore next 6 */` on
  `examples/ts-client.ts`'s `if (require.main === module)` CLI block, which by construction cannot run under the test
  runner. Three older `/* c8 ignore next 3 */` pragmas in `auth/offlineTokenProvider.ts` mark the browser guard and two
  genuinely unreachable defensive branches. **Do not add blanket ignores** — write the test instead.
- `main()` in the example is covered by patching `login` on the auth module's exports object and
  `Text2SpeechPromiseClient.prototype.synthesize`. That is the only seam: `main` constructs both itself. Note the test
  environment deliberately does **not** copy `examples/environment.env` into `.test-build/`, so `main`'s `dotenv.config()`
  is a silent no-op there and the test owns `process.env`.

## CI — `.github/workflows/tests.yml`

The only CI this repo has. It runs on every push and on pull requests, and has exactly three `run:` steps on
`ubuntu-latest` with `actions/setup-node@v5` at Node 20:

1. `npm install --no-audit --no-fund`
2. `npm test`
3. `npm run test:drift`

What makes it red, in practice: a failing test case; coverage below 100% on any of lines/branches/functions (including a
new hand-written file nobody tested); a `tsc` type error in `pretest`, which is `--strict`; or `package.json` and
`.ci-package.json` disagreeing on a script/dependency the latter declares. `make eslint` and `make prettier` are **not**
in CI — they run from `.husky/pre-commit` only.

## Bumping the proto-compiler pin

Two edits, never codegen:

```shell
git submodule update --init --recursive
git -C ondewo-proto-compiler fetch --tags origin
git -C ondewo-proto-compiler checkout <VERSION>
git add ondewo-proto-compiler
# then set ONDEWO_PROTO_COMPILER_GIT_BRANCH=tags/<VERSION> in the Makefile (line 20)
git submodule status | grep proto-compiler   # must show the tag's peeled commit
```

- `.gitmodules` gives `ondewo-proto-compiler` an **ssh** URL (`git@github.com:…`), so the fetch needs a working ssh key;
  `src/ondewo-t2s-api` is https.
- Keep the Makefile variable and the gitlink in step. `make check_out_correct_submodule_versions` checks out whatever the
  Makefile says, so a Makefile that lags the gitlink actively **downgrades** the submodule during `make build`.
- **A pin bump ships nothing on its own.** The 5.11.0 → 5.14.0 payload (Angular TS2308 duplicate-symbol re-exports, auth
  barrel exports in the generated `public-api`, proto3 explicit-presence for `optional` scalars) is emitted at codegen
  time. Committed stubs are untouched until someone runs `make build`. Never write "Regenerated with proto-compiler
  X.Y.Z" in RELEASE.md for a pin-only change.
- The script in `ondewo-proto-compiler/update_proto_compiler_dependency.sh` also syncs `src/package.json` deps and
  `Dockerfile.utils`'s `NODE_VERSION`. Both are verified no-ops here: `@types/node ^22.15.27` already equals
  `typescript/image-data/package.json@5.14.0`, `ts-node`/`typescript` are not declared in `src/package.json` (the merge
  only rewrites keys that already exist), and `Dockerfile.utils` is already `ENV NODE_VERSION=24.14.0`.

## Pre-commit — hook order is load-bearing

`uvx pre-commit run --all-files` must pass. It currently does.

- **ORDER: `conventional-pre-commit` BEFORE `giticket`.** Both run at the `commit-msg` stage and pre-commit executes
  repos in declaration order. giticket rewrites the subject to `[OND231-624] feat: …`, which is no longer valid
  Conventional Commits — with giticket first, every commit on a ticket branch failed and could only land with
  `--no-verify`. Verify after any change to the file:

  ```shell
  git switch -c feature/OND231-624-probe
  printf 'chore: probe\n' > /tmp/msg
  uvx pre-commit run --hook-stage commit-msg --commit-msg-filename /tmp/msg   # exit 0
  cat /tmp/msg                                                                # [OND231-624] chore: probe
  ```

  The config must be **staged** first — pre-commit refuses to run against an unstaged `.pre-commit-config.yaml`.

- **markdownlint MD053 stays disabled** in `.markdownlint-cli2.yaml`. Its auto-fix DELETES the
  `[comment]: <> (START/END OF GITHUB README)` markers the release Makefile slices the published README with. So does
  prettier, differently (it rewrites them to `[comment]: <> 'START OF GITHUB README'`) — which is why `README.md` is in
  `.prettierignore`. Both root and `src/` markers are currently intact. The Makefile's `README_CUT_LINES` derives the
  slice by grepping the marker _text_, never a line number — so don't record their positions here, they move on
  every README edit.
- **`RELEASE.md` and `src/RELEASE.md` are in markdownlint's `ignores`** (its fixer corrupts that dense format), but the
  `trailing-whitespace` and `end-of-file-fixer` hooks still touch them — that is safe and is what stripped the blanks
  from the 6.5.0/6.6.0 entries. After any such pass, check the counts still match: 13 `## Release ONDEWO T2S Typescript
  Client …` headings and 13 `*****` separators, and `make TEST` still prints the current version's notes.
- **`check-json` skips `tsconfig*.json`.** TypeScript's config format is JSONC and `tsconfig.test.json` uses comments to
  document its glob rule; Python's `json.load` rejects them.
- **`.prettierignore` covers `.pre-commit-config.yaml`, `.markdownlint-cli2.yaml`, `.ci-package.json`, `CLAUDE.md`,
  `README.md`, `RELEASE.md`, `coverage/` and `.nyc_output/`.** `.husky/pre-commit` runs `make prettier PRETTIER_WRITE=-w`
  **before** `pre-commit run`, so a prettier rewrite of the pre-commit config left it unstaged and aborted the run with
  _"Your pre-commit configuration is unstaged"_ — a deadlock on every dev commit.
- `.husky/pre-commit` additionally guards `pre-commit run` behind `git diff --quiet -- .pre-commit-config.yaml`: the
  release calls that hook **directly** via `make run_precommit_hooks`, and the codegen leaves the config unstaged.
- Hook revs, all confirmed newest stable: markdownlint-cli2 `v0.23.2`, pre-commit-hooks `v6.0.0`, conventional-pre-commit
  `v4.4.0`, giticket `'1.92'` (keep it **quoted** — unquoted it is a YAML float). giticket's `1.92` and `v1.92` tags are
  the same commit.
- Git hooks are **not** active in a fresh clone: `core.hooksPath` is unset until `make install_precommit_hooks` runs
  `npx husky install`. Don't assume a commit here ran eslint/prettier/pre-commit.

## Release path

`make ondewo_release` → `spc` → clone devops-accounts → `make release`, which runs `build`, `check_build`,
`run_precommit_hooks`, commits, pushes, publishes to npm, then branches/tags and creates the GitHub release.

- **The codegen regenerates the ROOT `package.json`** (`cd src && npm run build`, output-volume = repo root), wiping the
  CI scripts and test devDeps. `.ci-package.json` holds them and `make restore_ci_test_setup` merges them back inside
  `build`. It is an inline `node -e` on purpose — a helper `.js` gets caught by the release's eslint and fails it.
  `npm run test:drift` is the guard that the two files have not drifted.
- **Runtime deps the shipped auth helper needs (`undici`) must be declared in `src/package.json`**, the codegen source of
  truth; otherwise the regen strips them from root and the published package is missing them.
- **`create_npm_package` compiles `auth/offlineTokenProvider.ts` into `npm/auth/`** (`npx tsc … --declaration --rootDir
  auth --outDir npm/auth`). Without it the published package contains no auth module at all and consumers cannot
  `import { login } from '@ondewo/t2s-client-typescript/auth/offlineTokenProvider'`, even though the example does.
- **`npm_release` depends on `verify_npm_package_contents`**, which runs `npm pack --dry-run --json ./npm` and fails on
  any packed `*.spec.*` / `*.test.*` / `__tests__` / `__mocks__` / non-`.d.ts` `.ts` / `.map` / `examples/` /
  `.test-build` path, or a missing `public-api.{js,d.ts}` / `auth/offlineTokenProvider.{js,d.ts}`. Run
  `make create_npm_package && make verify_npm_package_contents` after touching either target; a clean package reports
  `verify-npm-package: OK` over 15 files.
- **`-git commit --no-verify -m "Preparing for Release …"`** — the leading `-` is deliberate: a build that produced no
  changes must not abort the release on git's "nothing to commit" exit. `--no-verify` keeps husky from reformatting the
  freshly generated `RELEASE.md` / `package.json` mid-commit.
- **Secrets are masked.** Every token-bearing recipe line is `@`-prefixed (`docker run -e …`, `echo $(TOKEN) | gh auth`,
  `npm config set …_authToken`, and the credential sub-make `@make release $(info)`), and `make TEST` prints
  `<set>`/`<unset>` rather than values. Keep it that way — an un-`@`-prefixed line makes `make` echo the expanded token.
- **`CURRENT_RELEASE_NOTES`** slices `RELEASE.md` with `perl -ne 'print if /Release ONDEWO T2S Typescript Client
  ${VERSION}/../\*\*/'`. The terminator is any `**`, which in this file is the next `*****` separator.
- The published README is cut between the `[comment]: <>` markers by a `perl` line-range delete on `npm/README.md`.
- **Codegen must run TTY-free**: the `build` / `debug` scripts use plain `docker run` (no `-it`) — with a TTY the
  non-interactive release fails with `cannot attach stdin to a TTY-enabled container because stdin is not a terminal`.
- **Trust the registry, not the log.** The aggregate release orchestration lives in `ondewo-t2s-api`, not here, and it
  reports a failed client release as "already released". After a release, check the GitHub release and npm directly.

## Sharp edges

- `make prettier` is `--check` and fails on any style drift; `.prettierrc` is authoritative (**tabs**, single quotes,
  `printWidth: 120`). `auth/offlineTokenProvider*.ts` used to be 2-space/double-quoted and was reformatted to match.
- `make eslint` exits 0 with 10 `no-ternary` warnings, but `@typescript-eslint/no-unnecessary-type-assertion` is an
  **error**: an `x as unknown as T` double assertion that TypeScript considers redundant fails `.husky/pre-commit`
  (`set -e`) and therefore the release. Prefer the narrowest cast that type-checks.
- `npm/` and `.test-build/` are gitignored build output. `make create_npm_package` wipes and rebuilds `npm/`.
