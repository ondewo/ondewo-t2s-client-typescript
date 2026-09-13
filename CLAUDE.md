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
- **Never prepend the JIRA ticket ID** (e.g. `[OND221-2830]`) to the commit subject yourself. The `giticket` commit-msg
  hook reads the ticket from the branch name (`(feature|bugfix|support|hotfix)/<TICKET>-…`) and prepends `[<ticket>]`
  automatically. Writing the prefix manually produces `[OND221-2830] [OND221-2830] feat: …`. Write a plain Conventional
  Commits subject (`feat: …`, `fix(scope): …`, `docs: …`) and let the hook decorate it.

## What this repo is

`@ondewo/t2s-client-typescript` — a TypeScript gRPC-web SDK for the ONDEWO T2S API. About 95% of the tree is generated
protobuf/gRPC-web stubs; the hand-written surface is small and is the only thing that is linted, tested and gated.

| Path                                                                                                        | Status                                                                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth/offlineTokenProvider.ts` + `.spec.ts`                                                                 | hand-written — the D18 Keycloak ROPC + `offline_access` token provider                                                                                                                                                                                                                                                                                      |
| `examples/ts-client.ts` + `.spec.ts`, `examples/environment.env`                                            | hand-written — runnable example + its unit tests                                                                                                                                                                                                                                                                                                            |
| `Makefile`, `tsconfig*.json`, `package.json`, `.ci-package.json`, `.husky/*`, `.github/workflows/tests.yml` | hand-written                                                                                                                                                                                                                                                                                                                                                |
| `api/**`                                                                                                    | **generated** by the proto-compiler docker image — never edit, never test, excluded from every hook                                                                                                                                                                                                                                                         |
| `public-api.js`, `public-api.d.ts`                                                                          | **generated** — the committed barrels re-export `api/` only. Appending `export * from './auth/…'` is a proto-compiler ≥5.13.0 codegen step (`typescript/image-data/append-auth-exports.sh`), and this client has not been regenerated with it — despite what the 6.6.1 RELEASE.md entry says. Import the auth module by subpath until a `make build` lands. |
| `src/ondewo-t2s-api` (submodule, `tags/6.6.0`)                                                              | the `.proto` source the stubs are built from                                                                                                                                                                                                                                                                                                                |
| `ondewo-proto-compiler` (submodule, `tags/5.14.0`)                                                          | the codegen toolchain                                                                                                                                                                                                                                                                                                                                       |

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
  up at 0% instead of being invisible. Verified on this tree: dropping a 6-line untested `auth/probeUntested.ts` in
  takes the run to 99.12% lines / 98.83% branches / 95% functions and **exit 1**; removing it returns 100% and exit 0.
- c8 maps coverage back through the source maps, so the report names `offlineTokenProvider.ts` / `ts-client.ts`, not the
  compiled `.js`.
- `.husky/pre-push` runs `npm test` — the local equivalent of the CI gate. It is deliberately NOT on `pre-commit`:
  `make run_precommit_hooks` executes `.husky/pre-commit` directly and `make release` calls it, so the full tsc + c8 pass
  would run inside the automated release right after the codegen rewrote `api/` and `package.json`.
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
# then set ONDEWO_PROTO_COMPILER_GIT_BRANCH=tags/<VERSION> in the Makefile's variables block
git submodule status | grep proto-compiler   # must show the tag's peeled commit
```

- `.gitmodules` gives `ondewo-proto-compiler` an **ssh** URL (`git@github.com:…`), so the fetch needs a working ssh key;
  `src/ondewo-t2s-api` is https.
- Keep the Makefile variable and the gitlink in step. `make check_out_correct_submodule_versions` checks out whatever the
  Makefile says, so a Makefile that lags the gitlink actively **downgrades** the submodule during `make build`. This is
  not hypothetical: `2b9be11` / `214d47f` ("Update proto compiler dependency to version 5.12.0 / 5.13.0") moved only the
  gitlink and left `ONDEWO_PROTO_COMPILER_GIT_BRANCH=tags/5.11.0`, and the next release commit (`4b919d8`) duly reset the
  gitlink back to 5.11.0's `2cc55c0`. Two edits, always.
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
  repos in declaration order. giticket rewrites the subject to `[OND221-2830] feat: …`, which is no longer valid
  Conventional Commits — with giticket first, every commit on a ticket branch failed and could only land with
  `--no-verify`. Fixed on master in `ae80365`; the comment block above the two repos in the config records the rule.
  Verify after any change to the file:

  ```shell
  git switch -c feature/OND221-2830-probe
  printf 'chore: probe\n' > /tmp/msg
  uvx pre-commit run --hook-stage commit-msg --commit-msg-filename /tmp/msg   # exit 0
  cat /tmp/msg                                                                # [OND221-2830] chore: probe
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
  from the older entries. After any such pass, check the counts still match: 14 `## Release ONDEWO T2S Typescript
Client …` headings and 14 `*****` separators, and `make TEST` still prints the current version's notes.
- **`check-json` skips `tsconfig*.json`.** TypeScript's config format is JSONC and `tsconfig.test.json` uses comments to
  document its glob rule; Python's `json.load` rejects them.
- **The tooling configs are kept prettier-CLEAN, not prettier-ignored.** `.husky/pre-commit` runs
  `make prettier PRETTIER_WRITE=-w` **before** `pre-commit run`, so any file prettier still wants to rewrite is left
  unstaged and aborts the run with _"Your pre-commit configuration is unstaged"_. The fix is to keep
  `.pre-commit-config.yaml`, `.markdownlint-cli2.yaml`, `.ci-package.json` and `CLAUDE.md` already in `.prettierrc`
  style (tabs in JSON, single-quoted YAML scalars) so the write pass is a no-op — adding them to `.prettierignore`
  instead only hides the drift. `.prettierignore` itself covers `README.md` and `RELEASE.md` (whose
  `[comment]: <>` / `*****` markers prettier mangles), the generated trees, and `.test-build/`, `coverage/`,
  `.nyc_output/`.
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
${VERSION}/../^\*{5}/'`. The terminator is anchored on the `*****` entry separator on purpose: the earlier `/\*\*/`
  form matched the first inline `**bold**` span in an entry just as readily and silently truncated the GitHub release
  notes there. Leave it anchored.
- The published README is cut between the `[comment]: <>` markers by a `perl` line-range delete on `npm/README.md`.
- **Codegen must run TTY-free**: the `build` / `debug` scripts use plain `docker run` (no `-it`) — with a TTY the
  non-interactive release fails with `cannot attach stdin to a TTY-enabled container because stdin is not a terminal`.
- **Trust the registry, not the log.** The aggregate release orchestration lives in `ondewo-t2s-api`, not here, and it
  reports a failed client release as "already released". After a release, check the GitHub release and npm directly.

## Sharp edges

- `make prettier` is `--check` and fails on any style drift; `.prettierrc` is authoritative (**tabs**, single quotes,
  `printWidth: 120`). Everything prettier can see is already in that style — `auth/offlineTokenProvider*.ts` (once
  2-space/double-quoted), the workflow, and the JSON/YAML tooling configs — so a `--check` run on a clean checkout must
  exit 0. If it does not, fix the file rather than adding it to `.prettierignore`.
- `make eslint` exits 0 with 10 `no-ternary` warnings, but `@typescript-eslint/no-unnecessary-type-assertion` is an
  **error**: an `x as unknown as T` double assertion that TypeScript considers redundant fails `.husky/pre-commit`
  (`set -e`) and therefore the release. Prefer the narrowest cast that type-checks.
- `npm/` and `.test-build/` are gitignored build output. `make create_npm_package` wipes and rebuilds `npm/`.

## Releasing: preflight and the traps that have actually bitten

Written after a release program across every ONDEWO client in one session. Each item below
cost real time or a broken artefact; every statement is derived from THIS repo's Makefile.

### Before you touch the version, check the released tag is in `master`

Releases here are cut from a `release/<version>` branch and are **not always merged back**, so
`master` can be missing work that is already published — and because a later version number
sorts above the unmerged one, a consumer upgrading silently loses it. The ondewo-nlu-client-python
7.1.0 release was exactly this: it shipped from a `master` that had never seen 7.0.5's
offline-token hand-off, so PyPI's newest release was a regression against its predecessor.

```bash
latest=$(git tag --sort=-v:refname | head -1)
git merge-base --is-ancestor "$latest" master && echo "in master" || echo "NOT in master -- merge first"
```

A fast-forward (`git merge --ff-only <tag>`) is the common case. A true merge needs care: resolve
metadata toward `master` and keep BOTH release-note sections, newest first — a reader upgrading
from the older line still needs the older entry.

### `git add` on a dirty submodule stages the WRONG commit

This repo has submodules (`ondewo-proto-compiler`, `src/ondewo-t2s-api`). If a submodule's working
tree is dirty, `git add <submodule>` stages **its current HEAD**, not the pointer you resolved
during a merge — silently regressing it to an older commit. `git checkout master -- <submodule>`
fixes the index but the next `git add` re-breaks it. Move the working tree instead:

```bash
want=$(git ls-tree master <submodule> | awk '{print $3}')
git -C <submodule> checkout -q "$want" && git add <submodule>
```

### The release notes are sliced by an EXACTLY-CASED heading

`CURRENT_RELEASE_NOTES` slices `RELEASE.md` with a perl range. In THIS repo the opening
pattern is, verbatim:

```text
Release ONDEWO T2S Typescript Client ${ONDEWO_T2S_VERSION}
```

So the heading of a new entry must read exactly `## Release ONDEWO T2S Typescript Client <version>`. **This wording is
not consistent across the ONDEWO repos** — some say `... <Name> Client`, some `... Client
<Name>` with the words reversed, the API repos say `... API` with no `Client` at all, and the
casing varies (`Js`, `Nodejs`, `Typescript`, `Survey`). Do not carry a heading over from a
sibling repo. Copy the PREVIOUS entry in this file and change only the version, or read the
pattern above out of the Makefile.

A heading that does not match yields an **empty slice**, and the GitHub release is then
created with empty notes or fails outright. Verify before releasing:

```bash
grep -c '^## Release ONDEWO T2S Typescript Client ' RELEASE.md     # must be >= 1 for your new version
```

### `src/RELEASE.md` is the source of truth; the root file is GENERATED

The build runs `cp src/RELEASE.md .`, so an edit to the root `RELEASE.md` is **discarded by
the next build**. Write the entry in `src/RELEASE.md` (and copy it to the root if you want to
read it before building). This is silent: the release completes and the notes are simply gone.

### Publish order decides how a partial failure is recovered

`make release` in this repo runs:

1. `publish_npm_via_docker`
2. `create_release_branch`
3. `create_release_tag`
4. `release_to_github_via_docker_image`

The **npm publish happens FIRST**. So a failure in a later step (tag, GitHub release)
leaves the package already published. Do **not** re-run `make ondewo_release` to recover: the
`spc` guard refuses when the branch or tag already exists, and re-publishing the same version
is rejected by the registry. Re-run only the step that failed, passing the credential it needs.

### Verify against the registry, with the REAL package name

This package publishes as **`@ondewo/t2s-client-typescript`**, which is not always the repository name — the JS client
publishes as `@ondewo/ondewo-nlu-client-js` (doubled `ondewo`), so a lookup by repo name returns
a 404 that reads like a failed release. Check the name in the manifest first, then:

```bash
npm view @ondewo/t2s-client-typescript versions --json
```

**An npm publish can be STAGED but not yet served.** Immediately after a publish the registry may
answer 404 for the new version while refusing a re-publish with
`409 Cannot publish over previously staged version`. That is not a failure and the version is
not burned — wait and re-check before bumping to a new number.

### The release prints credentials — read the log BEFORE you scrub it

`make ondewo_release` clones `ondewo-devops-accounts` and passes the registry and GitHub tokens on
the make command line, so they are echoed into the console and into any transcript capturing it.
This is a known and accepted property of the shared release path: do **not** re-plumb the recipe.
Redirect the run to a file, read it through a filter, and shred the file afterwards — and read it
**before** shredding, or a genuine failure is lost with the secrets:

```bash
umask 077; make ondewo_release > /tmp/rel.log 2>&1; echo "RC=$?"
grep -avE 'TOKEN|PASSWORD|USERNAME|_authToken' /tmp/rel.log | tail -20   # read FIRST
shred -u /tmp/rel.log; rm -rf ondewo-devops-accounts                     # then scrub
```
