# harness-forge v2.0.0 — Master Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This master plan fixes the file structure, the interfaces between subsystems, the constraints, and the phase order. Each phase has (or will get, when it starts) its own step-level plan in this folder named `2026-MM-DD-pN-<name>.md`; a phase's detailed plan is written from the spec plus the evidence the earlier phases produced, never before.

**Goal:** Turn the v1.1.0 developer-only setup wizard into harness-forge: a Claude Code skill that interviews any user, profiles how they prompt, and generates a lean, packaged, verified personal harness from a vetted catalog, ending with a designed HTML architecture page.

**Architecture:** interview → profile → blueprint → compile → verify → page. The model does judgment work (interview, profile, blueprint, prose) inside one orchestrator skill with on-demand references; zero-dependency Node scripts do what must not fail (inventory, catalog query, settings merge, hook registration, pinned installs, provenance journal, doctor, reset). Fresh-context agents judge; the author never grades its own work.

**Tech Stack:** Claude Code skills/agents/hooks/plugins (skills-dir plugin packaging), Node 22 ESM `.mjs` scripts with zero dependencies, `node:test`, GitHub Actions (windows/macos/ubuntu), Python 3 stdlib only for diagram-design's `self_check.py`, git for pinned fetches.

**Spec:** `docs/superpowers/specs/2026-10-08-harness-forge-v2-design.md` (approved 2026-10-08). Evidence: `docs/audit-2026-10-08.md`, `docs/research-2026-10-08.md`, `docs/spikes-2026-10-08.md` (P0 output).

## Global Constraints

- Repo licence MIT. Nothing proprietary vendored: Anthropic's `pdf`/`docx`/`xlsx`/`pptx` skills are installed from the `anthropic-agent-skills` marketplace only; `tools/validate.mjs` fails if their folders or "source-available" licence text appear in the tree.
- Scripts: Node ≥ 22, ESM `.mjs`, **zero npm dependencies**, every script accepts `--json` and exits 0/1/2 (ok / failed / partial). Hooks are script files invoked in exec form (`"command": "node", "args": [...]`); `node -e` never appears anywhere.
- Claude Code floor for users: **2.1.228** (the dev machine); features that need a newer build are gated by `claude --version` in `scripts/preflight.mjs` and reported as "available after update".
- Generated harness budget: identity block ≤ 60 lines; authored skill descriptions ≤ 250 characters, trigger-first ("Use when…"); ≤ 4 agents with descriptions ≤ 300 characters each; own always-loaded layer ≤ ~2.5K tokens; hooks cost 0 tokens at rest; MCP ≤ 2, HTTP transport only, never SSE.
- Every write into the user's config is journaled first, backed up if the target exists, and recorded in the harness manifest with `mode: created|merged`; settings merges are JSON-aware and write temp-then-rename; `reset` restores the pre-run state hash-identically.
- UTF-8 everywhere, LF line endings (`.gitattributes`), Cyrillic-safe paths and content; files are created with the Write tool or `fs.writeFileSync(..., 'utf8')`, never via shell redirects.
- User-facing strings exist in EN and RU; the wizard answers in the language of the user's first message and sets `language` in settings. Trigger phrases: "Let's prepare a workspace" and "Давай настроим рабочее пространство".
- Sandbox rule for every test that launches Claude Code (locked by P0): scratch project dir, `CLAUDE_CODE_DISABLE_CLAUDE_MDS=1` in the environment, `claude -p "<prompt>" --plugin-dir <plugin-root> --setting-sources project --no-session-persistence --model haiku --max-turns N --output-format json`; `claude plugin eval … --trust-plugin --no-publish`; never the live `~/.claude`; anything that writes the live plugin registry is deferred to P9 with cleanup.
- Entry commands are sub-skills (P0 evidence): `/harness-forge:start`, `/harness-forge:reset`; the root `SKILL.md` is a thin alias. `plugin.json` carries `author` (required by `validate --strict`).
- Every version-sensitive claim in docs carries a date and a URL (`tools/validate.mjs` checks the `verified_at` fields in the catalog: > 90 days warns, > 180 days fails).
- Commits on branch `v2` (main stays at v1.1.0 until the P10 merge), conventional messages, each ending with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

Inputs the spec implies but no task's tests cover by default; each line's test is added to the owning task's plan when that plan is written.

1. **Invalid user settings.json** (comments, trailing commas, BOM): `merge-settings.mjs` must refuse with a readable message and leave the file untouched; never "repair" and overwrite. → P5.
2. **Re-run on a config that already has a harness-forge block** in `CLAUDE.md`: replace between the HTML-comment markers, never append a second block; manifest `mode` stays `merged`. → P5.
3. **Non-ASCII home path** (`C:\Users\Иван\`, `/home/josé/`): every script and every hook `args` path must round-trip; marker files and journal paths must open. → P2, P5.
4. **Name collision**: the user already has a skill, agent, or plugin named like a pick (`read-document`, `reviewer`): inventory flags it, the blueprint offers rename or skip, compile never overwrites. → P5, P6.
5. **Interrupted run** (process killed between journal and write): resume reports the last completed step; reset restores from the journal; no half-written `settings.json` (temp + rename). → P5.

---

## File Structure (locked)

```
<repo>/
  README.md · LICENSE (MIT) · CHANGELOG.md · VERSION · CONTRIBUTING.md · SECURITY.md
  CLAUDE.md                         maintainer rules ≤15 lines + trigger-phrase routing to /harness-forge
  package.json                      "type":"module", scripts: validate · test · test:e2e; engines.node >=22; no dependencies
  .gitattributes · .gitignore
  .claude-plugin/marketplace.json   one plugin "harness-forge" → ./.claude/skills/harness-forge
  .claude/settings.json             project allows for the repo's own scripts; secret deny rules
  .claude/skills/harness-forge/     THE PRODUCT — a skills-dir plugin (path confirmed by spike S1; if S1 fails: ./plugin + marketplace only)
    .claude-plugin/plugin.json      name harness-forge, version, description, license MIT
    SKILL.md                        orchestrator ≤200 lines: state machine W0–W7, rules, phase index, EN+RU triggers
    references/                     w0-preflight.md … w7-handoff.md · interview-coverage.md · prompting-profile.md · compensations.md · blueprint-rules.md · lint-rules.md
    agents/                         skill-vetter.md (Read/Grep only) · harness-reviewer.md · page-critic.md · diagram-renderer.md
    catalog/                        catalog.json · schema.json · personas/*.md · README.md (rubric + update procedure)
    templates/harness/              identity.md · settings.fragment.json · skills/{home,tune,reset,new-project,read-document}/SKILL.md · agents/{reviewer,verifier,researcher,critic,doc-reader}.md · hooks/{hooks.json,guard-secrets.mjs,undo-buffer.mjs,context-guard.mjs,handoff-intent.mjs,encoding-guard.mjs,prompt-coach.mjs,verify-gate.json} · bin/{doctor.mjs,reset.mjs} · rules/*.md
    templates/page/                 page.html · page.css · strings.en.json · strings.ru.json
    scripts/                        preflight.mjs · inventory.mjs · catalog-query.mjs · prompt-signals.mjs · compile.mjs · merge-settings.mjs · install.mjs · journal.mjs · doctor.mjs · reset.mjs · diagram-spec.mjs · check-page.mjs · lib/{fs.mjs,json.mjs,paths.mjs,hash.mjs}
  docs/                             audit · research · spikes · concepts/ · guides/ (rewritten in P9) · superpowers/{specs,plans}
  examples/                         en-developer/ · ru-lawyer/ · en-marketer/ (real sandboxed run outputs + pages)
  tests/                            *.test.mjs · fixtures/{hooks,blueprints,settings,prompts,docs,validate}
  tools/validate.mjs                structural validator for the repo itself (frontmatter, names, encoding, manifests, catalog, deprecated patterns, vendoring)
  .github/workflows/ci.yml          windows-latest · macos-latest · ubuntu-latest × node 22
  .github/ISSUE_TEMPLATE/           bug.yml · catalog-submission.yml · persona-request.yml · config.yml
```

Responsibilities, one line each:
- `SKILL.md` decides *what to ask and what to propose*; it never computes paths, merges JSON, or installs.
- `scripts/*.mjs` decide *nothing*; they execute a JSON contract and return JSON.
- `references/*.md` hold the per-phase procedure and are loaded one at a time by the orchestrator.
- `templates/harness/**` are copied-and-filled by `compile.mjs`; prose placeholders are filled by the model from the blueprint, then linted by `scripts/doctor.mjs --lint`.
- `agents/*.md` are advisory only (no Write/Edit tools).

## Interfaces (JSON contracts every phase must honour)

All wizard scripts: `node <script> [args] --json` → stdout one JSON object; stderr human text; exit 0 ok, 1 failed, 2 partial (a script that can be partial says so in its own header). `tools/validate.mjs` is the exception: exit 2 means a usage error (bad arguments or a missing root) with the reason on stderr and nothing on stdout. Paths are absolute, UTF-8. The validator's check functions live in `.claude/skills/harness-forge/scripts/lib/checks.mjs` so `doctor.mjs` and the generated harness's `bin/doctor.mjs` can reuse them; `tools/validate.mjs` is only the CLI. Config dir is `process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude')`, overridable with `--config-dir` (tests use this).

- `preflight.mjs --json` → `{ os, shell, claude: {version, path}, node: {version, path}, python: {version, path, launcher}, git, gh, uv, poppler, tesseract: {present, langs[]}, markitdown, features: { autoModeDefault, promptAudit, skillDoctor, pluginEval, agentsMd } }` (features derived from `claude.version` against the floors in `references/w0-preflight.md`).
- `inventory.mjs --config-dir <dir> --json` → `{ claudeMd: {path, exists, lines, hasForgeBlock}, settings: {path, exists, valid, keys[], hooksRegistered[], deny[], ask[]}, hookScriptsOnDisk[], skills: [{name, path, channel: 'user'|'agents-store'|'plugin'|'synced', hasPluginJson}], agents[], plugins: [{id, enabled, scope}], marketplaces[], mcp: [{name, scope, transport}], duplicates[], unregisteredHooks[], v1State: {path, exists} }`.
- `catalog-query.mjs --persona <id>... --need <tag>... [--os win|mac|linux] [--lang ru] --json` → `{ picks: [{id, tier: 'core'|'recommended'|'optional', reason}], unmet: [tag...] }`; reads `catalog/catalog.json` validated against `catalog/schema.json`.
- `prompt-signals.mjs --input <file-of-prompts.jsonl> --json` → `{ features: {avgLength, questionsAsked, hasSuccessCriteriaRate, capsRate, absolutesRate, contextDumpRate, correctionLoopRate, verifyRequestRate}, examples: [≤5 redacted strings], redactions: n }`; never writes.
- `compile.mjs --blueprint <blueprint.json> --out <harness-dir> --json` → `{ files: [{path, sha256, source}], budget: {identityLines, descChars, estTokens}, warnings[] }`; idempotent (second run with the same blueprint produces no diff).
- `merge-settings.mjs --target <settings.json> --patch <patch.json> --journal <journal.jsonl> --json` → `{ before: sha256, after: sha256, changes: [{jsonPath, before, after}] }`; patch semantics: arrays union (dedup by string), objects deep-merge, scalars set; never removes user keys; invalid target → exit 1, no write.
- `install.mjs --spec <installs.json> --journal <journal.jsonl> --json` → per item `{id, status: 'installed'|'skipped'|'failed', path, sha, reason}`; `kind: 'git-skill'` = `git init; git fetch --depth 1 <sha>; checkout; copy subpath`; `kind: 'plugin'` = `claude plugin install <id> --scope user` with before/after `claude plugin list --json` diff.
- `journal.mjs` (library used by the above): append-only JSONL `{ts, op: 'backup'|'write'|'merge'|'install'|'delete', path, backupPath, before, after}`; `reset.mjs --journal <file> --json` replays in reverse and reports `{ restored[], removed[], verifyHash: {before, after, identical}}`.
- `doctor.mjs --harness <dir> [--lint] --json` → `{ structure: ok|issues[], budget, hooks: [{file, registered, dryRun: {event, fixture, decision, ms}}], unregisteredScripts[], claudeVersionFeatures }`.
- `diagram-spec.mjs --blueprint <file> --json` → `{ type: 'architecture', zones: [{id, label}], nodes: [{id, zone, label≤14, count}], arrows: [{from, to, label≤14, style}], accents: [id, id] }` with hard caps (nodes ≤ 9, arrows ≤ 12, accents ≤ 2) enforced in code.
- `check-page.mjs --file <html> [--share] --json` → `{ ok, checks: [{id, ok, detail}] }` for: single file, no `<script>`, only the Google Fonts `css2` link remote, `<html lang>` + charset, SVG `role="img"` + `aria-labelledby`, no U+FFFD, size ≤ 1.5 MB, share variant leaks no absolute paths.
- `.wizard-state.json`, blueprint, manifest, profile: field lists are in the spec ("Data models"); `compile.mjs` and `doctor.mjs` validate them against `scripts/lib/schemas.mjs`.

## Phase plan

Order: P0 → P1 → (P2 ∥ P3 ∥ P4) → P5 → P6 → (P7 ∥ P8) → P9 → P10. A phase starts by writing its step-level plan (`docs/superpowers/plans/2026-MM-DD-pN-<name>.md`) from this file, the spec, and the evidence so far; it ends only when its verify line has been run and its output pasted into the plan's "Evidence" section.

### P0 — Backup, pinned diagram-design install, spikes (Opus, M) — DONE 2026-10-08
- Done: zip backup, git init, tag `v1.1.0`, docs committed, diagram-design installed at `f4547ee9…` into the Emperor's `~/.claude/skills/`, spikes S1–S10 run and reported in `docs/spikes-2026-10-08.md`; amendments recorded in the spec ("P0 evidence").

### P1 — Skeleton and hygiene (Sonnet implementers, Opus review, S) — plan: `2026-10-08-p1-skeleton.md`
- Deliverables: v1 files removed from the tree (`templates/`, `guides/`, `.claude/skills/{prepare-workspace,reset-setup}`, `START-HERE.txt`); `LICENSE`, `README.md` stub (EN+RU, "under construction", v1.1.0 pointer), `CLAUDE.md` (maintainer rules + triggers), `VERSION` `2.0.0-dev`, `CHANGELOG.md` Unreleased section, `package.json`, `.claude-plugin/marketplace.json`, `.claude/skills/harness-forge/{.claude-plugin/plugin.json, SKILL.md alias, skills/start/SKILL.md, skills/reset/SKILL.md}`, `.claude/settings.json`, `tools/validate.mjs` + `tests/validate.test.mjs` + fixtures, `.github/workflows/ci.yml`, issue templates, `CONTRIBUTING.md`, `SECURITY.md`.
- Verify: `npm run validate` and `npm test` green locally; `claude plugin validate .claude/skills/harness-forge --strict` passes; `claude --plugin-dir .claude/skills/harness-forge plugin details harness-forge` prints the always-on cost; the sandbox recipe runs `/harness-forge:start` and returns the stub text; one interactive demo by the Emperor (trust the repo → `/plugin` shows `harness-forge@skills-dir` → `/harness-forge:start`). CI green on three OSes is observed at P9 when the repo is pushed.

### P2 — Hook library (Opus for guard-secrets, Sonnet for the rest, M) — plan: `…-p2-hooks.md`
- First task (from the P1 final review, I3): replace the validator's exec-form denylist with a positive rule in `scripts/lib/checks.mjs` — a command hook is valid only when its command basename (case-insensitive, `.exe` stripped, `path.win32.basename`) is `node`, every argument before the script is an allowlisted node flag (none by default), the first non-flag argument ends in `.mjs` or `.js`, and the rest are the script's own arguments; anything else (`bash -c`, `node -p`, `--import`, `pwsh -Command`, `NPX.CMD`) fails `hook-shell-form` or `node-eval`. Also close the P1 deferrals inside the hook/skill checks: multi-line frontmatter descriptions, `"hooks": null`, backslash basenames on POSIX.
- Deliverables: `templates/harness/hooks/*.mjs` (guard-secrets, undo-buffer, context-guard, handoff-intent EN/RU, encoding-guard, prompt-coach) + `hooks.json` (exec form, matchers include `PowerShell` and `Glob`), `verify-gate.json` (prompt type), `tests/fixtures/hooks/<event>-<case>.json` for Read/Edit/Write/Glob/Grep/Bash/PowerShell with Cyrillic and UNC paths, `tests/hooks.test.mjs` driving each script via stdin.
- Verify: `npm test` on three OSes; each fixture yields the expected decision JSON; cold start p95 < 150 ms (measured in the test).

### P3 — Catalog (Opus vets, Fable ranks + red-teams the trust model, L) — plan: `…-p3-catalog.md`
- Deliverables: `catalog/schema.json`, `catalog/catalog.json` (~30 entries from research §3.3 re-verified: licence, sha, cost via `claude plugin details` where available), `catalog/personas/*.md` (10–12), `catalog/README.md` (rubric, update procedure, trust tiers), `scripts/catalog-query.mjs`, `tests/catalog.test.mjs`.
- Verify: `node tools/validate.mjs --catalog` (schema, sha resolves via `git ls-remote`, SPDX matches upstream, nothing non-redistributable, `verified_at` fresh); every persona yields ≥ 5 picks; Fable red-team report filed as `docs/catalog-redteam-<date>.md`.

### P4 — Prompting profile (Fable rubric, Opus script + eval, M) — plan: `…-p4-profile.md`
- Deliverables: `references/prompting-profile.md` (11 AI Fluency behaviors + 6 Claude Code signals, evidence rules, tone hints), `references/compensations.md` (id → hook/skill/identity line), `scripts/prompt-signals.mjs`, `tests/fixtures/prompts/*.jsonl` (12 personas, planted fake keys), `tests/prompt-signals.test.mjs`.
- Verify: redaction test (no planted key appears in output); sandboxed `claude -p` over the 12 fixtures scores ≥ 10/12 expected gaps and 12/12 valid compensation ids (`tests/e2e/profile.mjs`).

### P5 — Wizard orchestrator and scripts (Opus, XL) — plan: `…-p5-wizard.md`
- Deliverables: `SKILL.md` orchestrator, `references/w0…w7`, `interview-coverage.md`, `blueprint-rules.md`, `lint-rules.md`, `agents/skill-vetter.md`, `agents/harness-reviewer.md`, `scripts/{preflight,inventory,compile,merge-settings,install,journal,doctor,reset}.mjs`, `scripts/lib/*`, `tests/{merge,compile,reset,inventory}.test.mjs`, 5 golden blueprints in `tests/fixtures/blueprints/`.
- Verify: snapshot tests for the 5 blueprints; merge leaves untouched bytes identical; compile twice = no diff; compile then reset = hash-identical config dir; simulated user (`tests/e2e/interview.mjs`, persona-card model alternating with `claude -p --resume`) reaches an approved blueprint in ≤ 12 turns.

### P6 — Harness templates (Opus; Fable reviews charters, L) — plan: `…-p6-templates.md`
- Deliverables: `templates/harness/identity.md`, `settings.fragment.json`, `skills/{home,tune,reset,new-project}`, `agents/{reviewer,verifier,researcher,critic}`, `bin/{doctor,reset}.mjs` (thin wrappers over `scripts/`), `rules/*.md`, `tests/templates.test.mjs`.
- Verify: `claude plugin validate --strict` on the compiled examples; budget within caps; `claude plugin eval` 12 cases ≥ 90% (if `plugin eval` is absent on the dev build: the equivalent `tests/e2e/skills.mjs` with `tool_used`-style assertions).

### P7 — Document baseline (Opus, M) — plan: `…-p7-documents.md`
- Deliverables: `templates/harness/skills/read-document/{SKILL.md,scripts/probe.mjs}` (chain: `pdfinfo` → `pdftotext -layout` probe → MarkItDown → `pdftoppm` + `tesseract -l rus+eng` → `doc-reader` for flagged pages; sidecar `.md` with `<!-- p.N -->` markers, content-hash keyed), `agents/doc-reader.md`, preflight checks for uv/Poppler/Tesseract/`rus` data, the optional marketplace step for `document-skills`, `tests/fixtures/docs/` golden set (text PDF EN/RU, scanned Cyrillic PDF, docx, xlsx, pptx, photo).
- Verify: golden set meets the thresholds from research §7 on Windows and Linux; no `(cid:` or U+FFFD in sidecars; workbook never dumped whole.

### P8 — HTML pipeline (Opus; daedalus review, M) — plan: `…-p8-page.md`
- Deliverables: `scripts/diagram-spec.mjs`, `agents/diagram-renderer.md`, `templates/page/*`, `scripts/check-page.mjs`, `agents/page-critic.md`, `tests/{diagram-spec,check-page}.test.mjs`, pinned diagram-design install step in `install.mjs`.
- Verify: three example pages pass `self_check.py` (exit 0) and `check-page.mjs` (exit 0); viewed at 1440 px and 390 px; no missing Cyrillic glyphs; daedalus verdict filed.

### P9 — README, docs, examples (Sonnet drafts, Opus reviews, M) — plan: `…-p9-docs.md`
- Deliverables: `README.md` (EN + RU), `docs/guides/*` rewritten per audit §I, `docs/concepts/*`, `examples/*` from real sandboxed runs only, GitHub repo created and the branch pushed, CI observed green.
- Publication policy (P1 final review, I5): the public repo starts from a fresh orphan history (squashed `v2`) unless the Emperor prefers full history; before the push, machine-specific evidence (usernames, home paths, session ids, plugin-registry contents, the "Side finding" about the Emperor's live guard) is removed from the committed docs or moved to the ignored `.superpowers/`.
- CI at publication (I6, L56–L58): the `plugin-validate` job becomes blocking on all three OSes with a pinned `@anthropic-ai/claude-code` version once pythia confirms `claude plugin validate` runs unauthenticated in CI; add `permissions: contents: read`, `timeout-minutes`, `concurrency`, `persist-credentials: false`; confirm current `actions/checkout` and `actions/setup-node` majors; create the `catalog` and `persona` labels; make the `cost` field a textarea; rewrite SECURITY.md for private vulnerability reporting and the real data flows; warn in bug.yml not to paste personal interview facts.
- Verify: link check; validator confirms every version claim dated and sourced; a fresh sandbox session runs the README quickstart verbatim.

### P10 — Gauntlet and release (Fable ephor; Opus argus + daedalus, M) — plan: `…-p10-release.md`
- Verify = the spec's "Done means" 1–5 with evidence tables; merge `v2` → `main`; tag `v2.0.0`; CHANGELOG and VERSION say 2.0.0.

## Process rules for executors

1. Start a phase by writing its step-level plan; get the Emperor's nod only for Campaign-scale changes to scope (not for routine task order).
2. TDD per task: failing test → minimal code → pass → commit. Fixtures, not mocks, for hooks and scripts.
3. Never run anything against the live `~/.claude`; tests pass `--config-dir` pointing at a scratch dir; nested Claude runs use `--setting-sources project --model haiku`.
4. Each commit is one task; message `feat(pN): …` / `test(pN): …` / `docs(pN): …` + the attribution trailer.
5. When a fact rots (a flag missing on the installed Claude Code, a changed upstream sha), record it in `docs/spikes-*.md` or the phase plan's Evidence section before working around it.
6. Phase ends with `/chiron:verify`-style evidence pasted into the plan and `/chiron:remember` for lessons that outlive the phase.
