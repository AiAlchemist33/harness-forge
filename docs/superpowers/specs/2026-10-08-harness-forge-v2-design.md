# harness-forge v2.0.0 — design spec

**Status: APPROVED 2026-10-08** (the Emperor: "yes proceed"). Produced by
strategos (fresh context, read-only) from `../../audit-2026-10-08.md` and
`../../research-2026-10-08.md`; amended by Fable. Tier: **Campaign**.
Implementation plan: `../plans/2026-10-08-harness-forge-v2.md`.

## Decisions taken 2026-10-08

- **Name:** `harness-forge` — repo, plugin id, and the wizard's skill folder
  (`.claude/skills/harness-forge/`); commands `/harness-forge` (start or resume)
  and `/harness-forge:reset`. The generated harness is named by the user
  (default `my-harness`) and gets `/<name>`, `/<name>:tune`, `/<name>:reset`.
- **Git:** local repo initialised; `v1.1.0` tagged on the pristine snapshot; a
  zip backup sits next to the folder
  (`MDtemplate-v1.1.0-backup-2026-10-08.zip`). The public GitHub repo is
  created at P9, when a README exists.
- **Army composition A (Lean):** Fable for P3 ranking + trust red team, the P4
  rubric, and the P10 ephor review; Opus/Sonnet elsewhere; build sessions on
  Opus.
- **Dev machine facts (2026-10-08):** Claude Code **2.1.228** installed (docs
  describe 2.1.294); Node 22.20.0; git 2.51; Python 3.13 + uv; gh 2.88; pwsh 7;
  Poppler, Tesseract and MarkItDown absent (installed in P7). The wizard gates
  features by `claude --version`: auto mode default, `/doctor prompt-audit`,
  `/skill-doctor`, AGENTS.md support and `plugin eval` all post-date 2.1.228.
- **Sandbox for spikes and evals:** nested `claude -p … --setting-sources
  project` runs work from inside a session and exclude user settings. A scratch
  `CLAUDE_CONFIG_DIR` has no auth without an interactive login, so user-level
  loading is tested via the equivalent project-level path, and anything that
  must touch the live plugin registry is deferred to P9 with cleanup.
- **diagram-design** is installed in the Emperor's `~/.claude/skills/` at sha
  `f4547ee9…` (280 files, MIT, pin recorded in `.source.json`).

## Fable's amendments to the strategos draft

1. **P7 is unblocked.** Research §7 (document/OCR baseline) landed after the
   draft was written; the `read-document` skill + `doc-reader` agent ship in 2.0.
2. **Node is a declared prerequisite for hooks, not for the wizard.** If Node is
   missing, the wizard still builds everything, marks the hooks "pending — install
   Node", and `/<name>:tune` re-checks. Secrets are protected regardless by
   `permissions.deny` rules (no runtime needed).
3. **Third-party skills are installed by the wizard's own sha-pinned git fetch**,
   not the `skills` CLI (telemetry on by default, wipes target folders, open
   Windows bugs). skills.sh remains a discovery source via its search API. The
   README documents `npx skills add` as a manual alternative.
4. **Identity block in the user's language; component internals in English.**
   The user owns and edits the identity block; English internals keep the
   training-distribution advantage for instructions.
5. **Reading past prompts (upgrade mode) is opt-in, default off**, extracted
   locally with secret redaction. Interview messages and the real-task probe are
   always enough for a profile.
6. **diagram-design is installed into the Emperor's own `~/.claude/skills/` in P0**
   (pinned sha, copy mode), as requested, and the same install path becomes the
   wizard's.

---

## The three wrong assumptions in the brief (strategos)

- **Node is not a Claude Code prerequisite.** The native installer needs none,
  and Git for Windows is optional (docs re-read 2026-10-08).
- **An install-count floor is not a trust gate.** Trojans with 1.7M installs pass
  any count floor.
- **The packaging fallback order was wrong.** A local-directory marketplace
  plugin comes before loose files (Chiron already proves that path on this
  machine).

## Leaning verdicts

1. **Node `.mjs` hooks in exec form: confirmed**, Node becomes a declared, checked
   prerequisite; preflight guides the install (winget / brew / apt).
   `${CLAUDE_PLUGIN_ROOT}` expands inside `args`. On Windows exec form needs a
   real `.exe` (`node` works; `npx`/`npm` shims never do). A missing interpreter
   is a non-blocking error and the tool call proceeds, so secrets also get
   `permissions.deny` rules and the "did you verify?" gate is a `prompt` hook.
2. **Skills-dir plugin: confirmed.** Fallback if spike S1 fails: local-directory
   marketplace plugin, then loose files. Traps: an installed plugin with the same
   name wins over `@skills-dir` (preflight checks); a hook registered both in
   settings and `hooks.json` runs twice (migrate, never duplicate).
3. **Catalog shape: confirmed; thresholds as a trust floor: rejected.** Discovery
   order: marketplace catalogs already on disk (official first), then the
   skills.sh API (undocumented — degrade gracefully). Trust comes from an
   official or allowlisted owner, or from content read at a pinned commit by a
   read-only vetting subagent, plus the user's explicit consent. The wizard
   queries the catalog through a script and never reads it whole.
4. **One orchestrator skill + reset + tune: confirmed, with one change.** Reset
   and tune must work after the user deletes the clone, so the provenance
   manifest, `bin/doctor.mjs` and `bin/reset.mjs` ship inside the generated
   harness. `.wizard-state.json` is only run/resume state.
5. **diagram-design at runtime, pinned sha: confirmed.** Install as a plain skill
   folder (hot-reloads mid-run; a plugin install waits for `/reload-plugins`).
   Render in a forked subagent (keeps ~17–22K tokens out of the wizard's
   context). Two gates: `self_check.py` on the diagram, `check-page.mjs` on the
   composed page.
6. **Plugin + marketplace manifests: confirmed; one copy serves both channels.**
   The wizard lives as a project skills-dir plugin at
   `.claude/skills/harness-forge/`; `marketplace.json` points at that folder.
   If both are present the installed copy wins and the project copy shows
   "Not loaded" (spike S2).
7. **EN README + RU section; wizard in the user's language from message one:
   confirmed.** Also set the `language` setting.

## Side finding in the Emperor's live harness (read, not run)

- Chiron's `hooks.json` matcher is `Read|Edit|Write|Grep|Bash` and
  `guard-secrets.ps1` only scans `command` when `tool_name -eq 'Bash'` →
  **PowerShell-tool calls (the primary shell) and Glob calls are not guarded**;
  the script's Glob branch never runs.
- `~/.claude/hooks/undo-buffer.ps1` and `guard-secrets.ps1` exist but are
  registered nowhere (`"PreToolUse": []` in settings).
- v2 guards match `PowerShell|Glob`; the v2 doctor flags unregistered scripts.

## Problem

A strong Claude Code setup takes expertise most people don't have, and
non-developers get nothing at all. The ecosystem is huge, its rankings are gamed,
and every component costs context. v1.1.0 is a fixed script for developers only:
a 120-line CLAUDE.md, `node -e` hooks, agents that write files, no packaging, and
a "verification" that only checks files exist. When fixed, anyone gets in one
sitting (target ~30 minutes) a lean, packaged, verified harness built from vetted
parts and shaped around how they actually prompt, plus a page that shows what
they have and how to grow it. Stars are an outcome, not a criterion; done means
the demonstrations below.

## Chosen architecture

interview → profile → blueprint → compile → verify → page.

- **The model does the judgment work:** adaptive interview, prompting profile,
  blueprint choices, prose (identity block, authored skills, advisor charters).
- **Zero-dependency Node scripts do what must not fail:** inventory, catalog
  query, JSON-aware settings merge, hook registration, sha-pinned installs, a
  write-ahead provenance journal, token-budget measurement, reset.
- The user approves **one blueprint screen**, not fifteen file dumps.
  Fresh-context agents judge the result; the author never grades its own work.

**Rejected:** the v1 approach upgraded (the model writes every file from template
guides). Lost because settings merges, hook registration and reset provenance are
exactly where a free-form model edit silently destroys user config with no undo,
and none of it can be regression-tested on three OSes. Also rejected: a non-LLM
`npx create-harness` CLI (no interview, no reading of how the user prompts) and
ECC-style kit bundles (293 skills that cost context every turn).

**Rollback.** Build: v1.1.0 zip + git tag; v2 ships only after the gauntlet.
Users: every write journaled and backed up first, `/<name>:reset` restores;
`claude plugin disable <name>@skills-dir` switches the harness off; hooks fail
open.

## v2 repo tree

```
<repo>/  README.md (EN + RU) · LICENSE (MIT) · CHANGELOG.md · VERSION · CONTRIBUTING.md · SECURITY.md · CLAUDE.md (≤40 lines: trigger routing + maintainer rules)
├─ .claude-plugin/marketplace.json     one plugin → ./.claude/skills/harness-forge
├─ .claude/settings.json               exact-match allows for the repo's own checks; secret deny rules
├─ .claude/skills/harness-forge/       THE PRODUCT (project skills-dir plugin = marketplace plugin; ships no hooks)
│  ├─ .claude-plugin/plugin.json · SKILL.md (orchestrator ≤200 lines: state machine, rules, phase index, EN+RU triggers)
│  ├─ references/  w0-preflight … w7-handoff · interview-coverage · prompting-profile · compensations · blueprint-rules · lint-rules
│  ├─ agents/      skill-vetter (Read/Grep only; untrusted input) · harness-reviewer · page-critic · diagram-renderer
│  ├─ catalog/     catalog.json · schema.json · personas/*.md (10–12) · README.md (vetting rubric + update procedure)
│  ├─ templates/   harness/ (plugin skeleton, identity block, advisor charters, skills, hooks/*.mjs, settings fragments) · page/ (html, css, EN/RU strings)
│  └─ scripts/     preflight inventory catalog-query prompt-signals compile merge-settings install doctor reset diagram-spec check-page (.mjs, no deps)
├─ docs/           concepts · guides (rewritten per audit §I; every version claim dated + sourced) · audit · research · spikes-*.md
├─ examples/       3 harnesses + pages from real sandboxed runs (EN developer, RU lawyer, EN marketer)
├─ tests/          fixtures (hook stdin per event, blueprints, prompt sets, merge cases, doc golden set) · *.test.mjs
├─ tools/validate.mjs  frontmatter, reserved names, encoding, manifests, catalog schema + freshness, no non-redistributable vendoring,
│                      deprecated-pattern lint (node -e, .claude/commands, Task, includeCoAuthoredBy, SSE, user-level effortLevel)
└─ .github/        ci.yml (windows/macos/ubuntu) · issue templates (bug, catalog submission, persona request)
```

## Wizard flow at runtime (state saved after every step; every loop capped)

- **W0 Preflight and consent.** Detect language from the first message; check
  OS, shell, `claude --version`; Node required for hooks, Python/git/gh
  recommended; `$CLAUDE_CONFIG_DIR` else `~/.claude`. Inventory: CLAUDE.md and
  settings; hooks registered vs. scripts on disk; skills per install channel
  (incl. `~/.agents/skills` and lock files); enabled/synced plugins and
  marketplaces; MCP servers (incl. claude.ai connectors); v1 wizard state. Ask
  once for the session approval to write into `~/.claude`. Mode: fresh,
  upgrade, or resume.
- **W1 Interview loop (≤10 turns).** One open question, then one question per
  turn aimed at the emptiest important slot of eight: work and recurring
  deliverables · materials and tools · where AI helped or failed · quality bar ·
  autonomy and risk · languages and audiences · confidentiality · technical
  comfort. Mid-loop real-task probe: "write it exactly as you'd send it". Exit
  at 6 of 8 slots or "enough"; "skip" always works.
- **W2 Prompting profile** (module below). Strengths first; each gap offered as
  a compensation the user can decline.
- **W3 Blueprint loop.** ≤2 persona bundles → `catalog-query` → unmet needs →
  discovery (vetting subagent) → one screen: five layers (identity / knowledge /
  judgment / law / memory), token estimate, licence + dependencies + cost for
  every external. Revise until approved. MCP only where no CLI or claude.ai
  connector exists; HTTP transport, never SSE.
- **W4 Install.** journal entry → timestamped backups → `compile` → prose →
  lint → externals → memory seed. Plugins via `claude plugin install --scope
  user`; skills as sha-pinned folders. A failure is isolated and reported; the
  run continues.
- **W5 Verify loop (≤2 fix rounds).** `doctor`: structure, budget, exec-form dry
  run of every hook on fixture input; `claude plugin validate --strict`;
  `claude plugin list` shows loaded; `harness-reviewer` (fresh context) checks
  the identity block and authored skills; the user runs `/reload-plugins` and
  `/context` and tries one live guard demo.
- **W6 Present** (HTML pipeline below).
- **W7 Handoff.** Three first tasks. The day-2 loop `/<name>:tune`: wrong twice →
  identity line; same instructions pasted a third time → skill; must happen
  every time → hook; monthly `/doctor prompt-audit`, `/skill-doctor`, upstream
  changes since each pinned sha. `/<name>:reset`.

## Prompting-profile module

- **Evidence:** interview messages and the real-task probe; optional critique
  probe ("what would you check before using this?"); in upgrade mode, opt-in
  only, the last ≤50 prompts extracted locally by `prompt-signals.mjs` with
  secret redaction (features + ≤5 redacted examples).
- **Rubric:** the 11 AI Fluency Index behaviors (base rates for framing only)
  plus six Claude Code signals: correction loops · kitchen-sink sessions · vague
  multi-file asks · context dumping · CAPS/absolutes · never verifies.
- **Per behavior:** id · observed yes/no/unknown · evidence (quote or statistic)
  · source · confidence. Unknown never drives a compensation.
- **Output:** ≤3 strengths, ≤3 gaps; each gap maps to compensation ids
  (research §4 map, extended) with an accepted flag; tone hints for generated
  files. Stored in `.harness/profile.json`, a 2–3 line "working with me"
  section, and on the page. Never a score; exploratory vagueness not penalized.

## Data models (field lists)

- **Catalog entry:** id · name · kind (plugin|skill|skill-pack|mcp|cli) ·
  summary · source{channel, marketplace, repo, path, ref, sha} ·
  install{method, command, scope, check, uninstall} · license (SPDX) ·
  redistributable · signals[{metric, value, as_of, url}] ·
  cost_at_rest{tokens, measured_at, method} · requires{node, python, bun, git,
  gh, other} · os[] + caveats · languages[] · for[] · needs[] · compensates[] ·
  conflicts_with[] · duplicates[] · trust_tier
  (official|vetted|community|unvetted) · verdict + reason · caveats[] ·
  reviewed{by, at, sha_read, scripts_read} · status.
- **Persona bundle:** id · labels{en, ru} · picks{core, recommended, optional} ·
  advisor roles + domain review checklists · default hooks · interview probes ·
  first-task templates · ≤60 lines of prose.
- **`.wizard-state.json`:** schema/wizard version · run_id · timestamps · mode ·
  locale · config_dir · os/shell · phase · completed[] · loop counters ·
  preflight{tool → present, version, path} · inventory{by channel, duplicates,
  unregistered_hooks, v1_state} · interview{coverage{slot → empty|partial|full
  + evidence refs}, facts[{text, turn, confidence}], real_task (redacted),
  consents{config_write, transcripts}} · profile · blueprint{harness_name,
  personas, layers → component ids + params, settings_patch, budget,
  approved_at} · verification{checks[{id, cmd, result, evidence}], verdict} ·
  deliverable{paths, gate results, review verdict}.
- **Harness manifest (durable, ships with the harness):** name ·
  wizard_version · created/updated · components[{id, kind, origin
  authored|catalog|discovered, sha, license, files[{path, sha256}], mode
  created|merged, backup}] · settings_changes[{json_path, before, after}] ·
  identity_block{markers, hash} · external_installs[{id, uninstall}] · budget
  snapshot · tune_log[].

## Generated harness (in `$CLAUDE_CONFIG_DIR`, else `~/.claude`)

```
CLAUDE.md               + one block between HTML-comment markers: identity, routing, "working with me" — ≤60 lines
settings.json           merged: $schema, language, deny Read/Edit on secret paths, ask on egress verbs, attribution, autoMemoryEnabled, enabledPlugins (no hooks here)
rules/                  0–3 rules, all with paths: (zero cost until matching files are touched)
skills/<name>/          THE harness = <name>@skills-dir
  SKILL.md              /<name>: home, cheat sheet, router (user-only → 0 tokens)
  skills/               tune · reset · new-project · read-document (§7) · 0–3 authored workflows ("Use when…", ≤250 chars)
  agents/               2–4 advisors: reviewer (memory: user), verifier, researcher, [critic], doc-reader; model inherited; none can Write/Edit
  hooks/                hooks.json + guard-secrets · undo-buffer · context-guard · handoff-intent (EN/RU) · [encoding-guard, Windows] · [prompt-coach, opt-in] .mjs
                        + verify-gate (type: prompt, opt-in by profile)
  bin/ · docs/          doctor.mjs reset.mjs · architecture.html + architecture-share.html (no profile, no paths)
  .harness/             manifest.json · profile.json · guard-config.json
skills/<third-party>/   sha-pinned folders + LICENSE (incl. diagram-design)
plugins/ (managed)      catalog plugins via claude plugin install --scope user
undo/                   outside-git snapshots (10 per file, 30-day prune)
```

Always-loaded token budget: identity block ≤60 lines (~1K tokens); auto-invocable
skill descriptions ≤50% of the listing budget (1% of context; 8,000-char
fallback); agent descriptions ≤4 × 300 chars; hooks 0 tokens at rest; MCP ≤2
with schemas deferred. Own layer ≤ ~2.5K tokens; ≤ ~5K including third-party
plugins. `doctor` warns at 80%; real numbers from `/context`, stored in the
manifest.

## HTML pipeline

1. `diagram-spec.mjs` turns the blueprint into ≤9 nodes — You · Identity ·
   Skills(n) · Advisors(n) · Guards(n) · Memory · Tools(n) · Plugins(n) ·
   Projects — in three zones (always loaded / on demand / enforced by hooks);
   ≤12 arrows; labels ≤14 chars; limits enforced in code.
2. The `diagram-renderer` fork renders it with diagram-design at the pinned sha;
   questions pre-answered: type `architecture`, title font
   `'Instrument Serif','Noto Serif',serif`, no forced uppercase.
3. `self_check.py` (`py -3` / `python3`) exits 0.
4. Compose the page from `templates/page`: inline SVG + profile + cheat sheet
   (current commands only) + first tasks + maintenance triggers + what was
   installed and how to undo it. All text in the user's language.
5. `check-page.mjs` exits 0: single file, no `<script>`, fonts link the only
   remote asset, `lang` and charset set, SVG `role`/`aria-labelledby`, no U+FFFD,
   size cap, share variant leaks no paths.
6. `page-critic` (fresh context, daedalus rubric + Russian typography) gets one
   fix round. Then the page opens, with consent.

## Phases (S ≤1 session · M 1–2 · L 3–4 · XL 5+; a session = one focused agent context)

| # | Phase | Verify | Tier | Effort |
|---|---|---|---|---|
| P0 | **Backup** (zip v1.1.0; `git init` + tag if approved). **Install diagram-design into the Emperor's `~/.claude/skills/`.** **Spikes** in a scratch `CLAUDE_CONFIG_DIR`: research §8 items 1–7 plus S1 hooks/agents from `@skills-dir` with exec-form `node` · S2 exactly one wizard per channel · S3 full run under `CLAUDE_CONFIG_DIR` incl. MCP · S4 `prompt` Stop hook inside a plugin · S5 `self_check.py` via `py -3` · S6 search over on-disk marketplace catalogs · S7 `claude plugin details` cost output · S8 `plugin eval` on `@skills-dir` | `docs/spikes-*.md`: per item the command, observed output, chosen path; the zip opens | Opus | M |
| P1 | Skeleton and hygiene: tree, LICENSE, manifests, CLAUDE.md, `.gitignore`, CI matrix, `tools/validate.mjs`; v1 removed from tree | `npm run validate` + `claude plugin validate` green in CI on 3 OSes | Sonnet | S |
| P2 | Hook library (.mjs) + fixtures for Read/Edit/Write/Glob/Grep/Bash/**PowerShell**, Cyrillic and UNC paths | `npm test` on 3 OSes; exec-form dry run gives expected decisions; cold start p95 < 150 ms | Opus (guard-secrets) + Sonnet | M |
| P3 | Catalog: schema, ~30 seed entries re-verified (licence, sha, cost via `plugin details`), 10–12 personas, rubric, `catalog-query` | `validate:catalog`: schema · sha resolves · SPDX matches upstream · nothing non-redistributable · ≥5 picks per persona | Opus vets · **Fable** final ranking + trust-model red team | L |
| P4 | Prompting profile: rubric, compensations, `prompt-signals.mjs`, 12 fixture personas | planted fake keys never appear; sandboxed `claude -p` on fixtures: ≥10/12 expected gaps, 12/12 valid compensation ids | **Fable** rubric · Opus script + eval | M |
| P5 | Wizard: SKILL.md + references, state, compile, merge-settings, install, reset, vetter | 5 golden blueprint snapshots; merge leaves untouched bytes identical; compile twice = no diff; compile then reset = hash-identical; simulated user reaches an approved blueprint ≤12 turns | Opus | XL |
| P6 | Harness templates: identity, advisors, home/tune/reset/new-project skills, doctor, `bin/` | `plugin validate --strict` on compiled examples; budget within caps; `claude plugin eval` 12 cases ≥90% | Opus · Fable reviews charters (option C) | L |
| P7 | Document/OCR baseline per research §7: `read-document` skill, `doc-reader` agent, preflight checks, optional `document-skills` plugin step | EN+RU golden set (text PDF, scanned Cyrillic PDF, docx, xlsx, pptx, photo) meets §7 thresholds on Windows and Linux | Opus | M |
| P8 | HTML pipeline: diagram-spec, pinned install, renderer fork, page template, check-page, page-critic | 3 example pages: `self_check.py` 0 · `check-page` 0 · viewed at 1440 and 390 px · no missing Cyrillic glyphs | Opus · daedalus | M |
| P9 | README (EN + RU), docs rewrite (audit §I), examples from real runs only | link check; validator confirms every version claim dated and sourced; a fresh sandbox runs the quickstart verbatim | Sonnet drafts · Opus reviews | M |
| P10 | Gauntlet and release | ephor / argus / daedalus verdicts per Done means; tag v2.0.0 | **Fable** ephor · Opus argus + daedalus | M |

Order: P0 → P1 → (P2 ∥ P3 ∥ P4) → P5 → P6 → (P7 ∥ P8) → P9 → P10. Roughly
22–30 focused sessions.

## Verification gauntlet

- **Deterministic (CI, 3 OSes):** validator, hook fixtures, compiler snapshots,
  merge/idempotency/reset round-trips, redaction tests, page checks on
  `examples/`.
- **Behavioral (sandboxed `CLAUDE_CONFIG_DIR`, manual):** three end-to-end runs,
  simulated-user interviews, `claude plugin eval`. `-p` sessions don't load
  project skills-dir plugins, so these use `--plugin-dir`.
- **Fresh-context judgment:** ephor hunts guard bypasses (path tricks,
  PowerShell/Glob, Unicode, symlinks), merge data loss, sha-pin enforcement,
  prompt injection through discovered SKILL.md files, reset deleting more than
  it created; argus demonstrates each Done line with evidence; daedalus judges
  both pages and the README.

## Risks (risk → tripwire → fallback)

1. Hooks/agents don't load from `@skills-dir` → S1 fixture hook writes no marker
   → local-directory marketplace; loose files last.
2. Node missing or off PATH in GUI-launched apps (nvm/volta shims) → "hook
   error" in transcript or doctor dry run fails → write the absolute node path
   at install; `tune` re-checks.
3. Skill listing overflows, least-used dropped silently → doctor estimate
   > 50% or `/skill-doctor` shows drops → `disable-model-invocation` on
   user-only skills, trim descriptions, cut optional picks.
4. Settings merge loses user data → post-merge diff ≠ planned patch or schema
   fails → abort that write; restore from the journal backup.
5. Supply chain / prompt injection through discovered skills → sha mismatch,
   look-alike id, bundled scripts, or vetter flags model-directed text → don't
   install; unvetted needs explicit consent + risk summary; vetter has no
   write/exec tools.
6. Profile feels judgmental or wrong → pilots decline > half the compensations
   or fixture eval < 10/12 → self-report-only mode; profile collapsed by default.
7. Wizard's own context bloats → e2e runs exceed 60% before W4 → more steps
   in subagents; save state, resume fresh.
8. Facts rot → CI freshness (`verified_at` > 90 days warns, > 180 blocks
   release); preflight finds version below tested minimum → warn, disable
   dependent features.
9. Dev work touches the live `~/.claude` (Chiron) → a spike/e2e script starts
   with `CLAUDE_CONFIG_DIR` unset or outside scratch → scripts refuse to run.

## Done means

1. CI green on Windows, macOS, Ubuntu: `npm run validate` · `npm test` ·
   `claude plugin validate .claude/skills/harness-forge --strict`.
2. In sandboxes, both "clone and run `claude`" and "`/plugin marketplace add` +
   install" start exactly one wizard, for "Let's prepare a workspace" and for
   "Давай настроим рабочее пространство".
3. Three sandboxed runs (EN developer fresh on Sonnet 5.5 — the minimum model;
   RU lawyer fresh; upgrade over a credential-stripped copy of the Emperor's
   config on Opus 5.5), each showing: `<name>@skills-dir` loaded; `.env` denied
   with a reason via Read, Bash and PowerShell; an undo snapshot after editing
   a file outside git; `plugin eval` ≥ 90%; `/context` own layer within budget;
   the page passes both gates; reset leaves the config dir hash-identical to the
   pre-run snapshot.
4. ephor SOUND (or every HIGH+ finding fixed and re-reviewed once); argus
   DEMONSTRATED with an evidence table; daedalus sign-off on EN/RU pages and the
   README.
5. `examples/` holds those runs' real outputs; a fresh session runs the README
   quickstart verbatim; VERSION and CHANGELOG say 2.0.0, tagged.

## Questions resolved 2026-10-08

1. Git: yes — local now, GitHub repo at P9.
2. Name: `harness-forge`.
3. Army composition: A Lean.
4. Pilots: to be requested at P10.

## P0 evidence — amendments (2026-10-08, see `../../spikes-2026-10-08.md`)

1. **Entry commands are sub-skills.** Under the plugin loader (`--plugin-dir`), a
   plugin's root `SKILL.md` is ignored whenever the plugin has a `skills/`
   folder, and a bare `/<plugin>` never appears. The wizard therefore lives in
   `skills/start/` and `skills/reset/` → `/harness-forge:start`,
   `/harness-forge:reset`; the root `SKILL.md` stays as a three-line alias
   that works only in the skills-dir channel. The generated harness follows the
   same rule: `/<name>:home`, `/<name>:tune`, `/<name>:reset`,
   `/<name>:new-project`, `/<name>:read-document`.
2. **Trusted-folder loading is the only untested path.** A project skills-dir
   plugin loads after the trust dialog; `-p` never grants trust. P1's acceptance
   therefore includes one interactive demo by the Emperor (`claude` in the repo
   → trust → `/plugin` lists `harness-forge@skills-dir` → `/harness-forge:start`).
   Risk 1's tripwire is corrected: a missing hook marker in `-p` means the trust
   gate, not a loader failure.
3. **Sandbox recipe (locked):** `claude -p "<prompt>" --plugin-dir <plugin>
   --setting-sources project --no-session-persistence --model haiku --max-turns N
   --output-format json` with `CLAUDE_CODE_DISABLE_CLAUDE_MDS=1` in the
   environment (otherwise `~/.claude/CLAUDE.md` and claude.ai connectors leak
   in; `--safe-mode` strips the plugin itself). Under this recipe skills,
   sub-skills, agents and exec-form hooks all load (2.1.228 and 2.1.292).
4. **Hooks:** exec-form `node` runs as a direct child of `claude.exe` (no
   shell); shell-form runs in Git Bash; `"shell": "powershell"` works; the
   `PowerShell` matcher fires; a missing interpreter is a non-blocking error
   (fail open) — so `permissions.deny` rules for secrets remain mandatory. A
   `prompt`-type Stop hook inside a plugin works (the UI prints "Stop hook
   error occurred" when it blocks; cosmetic).
5. **Manifests and tooling:** `claude plugin validate --strict` requires
   `author`; `claude --plugin-dir <dir> plugin details <name>` prints
   "Always-on: ~N tok" for an uninstalled folder (superpowers ≈ 838, chiron ≈
   2,271) — `doctor.mjs` measures the budget this way; `claude plugin eval` is
   early-access on 2.1.228 and works on 2.1.292 with `--trust-plugin` and
   **`--no-publish`** (it otherwise publishes reports to claude.ai).
6. **Versions:** the terminal CLI is 2.1.228 while the VS Code extension bundles
   2.1.292; `claude --version` reports the CLI. On 2.1.228 `sonnet`/`opus`
   resolve to Sonnet 5 / Opus 5, `haiku` to Haiku 4.5 on both — evals name
   full model IDs. `promptCacheTtl` is `"5m"|"1h"` (2.1.292 only);
   `defaultShell` is `bash|powershell` and affects only `!` commands.
7. **Catalog seed on disk:** `~/.claude/plugins/plugin-catalog-cache.json`
   holds 204 official plugins with token costs, install counts and pinned
   commits (dated 2026-05-29; `tags` on 3 of 204). The official marketplace
   is not registered on this machine.
8. **diagram-design:** `py -3 -I scripts/self_check.py` exits 0 on the shipped
   example and 1 on an injected `<script>`; no `prefers-color-scheme` anywhere
   (light and dark are separate pages → the deliverable is light-only in 2.0);
   a `.diagram-design` marker creates `~/.diagram-design/profiles/default.md`
   on first use, so the renderer prompt pre-answers "keep default" instead of
   writing a marker; the renderer's reading set ≈ 17.4K tokens.
9. **Side effect to avoid:** nested runs without `--no-session-persistence`
   leave session logs under `~/.claude/projects/`; the spikes left a few, safe
   to delete by hand.
