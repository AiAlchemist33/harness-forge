# Contributing

- Open an issue first for catalog entries (use the "Catalog submission" form)
  and new personas (use the "Persona request" form).
- Every pull request: `npm run validate` and `npm test` green; one task per
  commit; version-sensitive claims carry a date and a URL.
- Catalog entries need a licence (SPDX), a pinned commit sha, a measured
  always-on token cost (`claude --plugin-dir <dir> plugin details <name>`),
  and a verdict with a reason. Install counts alone never justify an entry.
- No proprietary code is vendored. No inline-eval flags (`-e`/`--eval`) in
  hooks or scripts. No shell redirects to files.
